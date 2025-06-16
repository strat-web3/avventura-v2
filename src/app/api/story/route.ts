import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
  forceRestart?: boolean
  conversationHistory?: Message[]
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
  action?: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Map frontend language names to full language names for Claude
// ✅ FIXED: Now matches what frontend sends
const LANGUAGE_MAPPING: Record<string, string> = {
  English: 'English',
  Chinese: '中文 (Chinese)',
  Hindi: 'हिन्दी (Hindi)',
  Spanish: 'Español (Spanish)',
  French: 'Français (French)',
  Arabic: 'العربية (Arabic)',
  Bengali: 'বাংলা (Bengali)',
  Russian: 'Русский (Russian)',
  Portuguese: 'Português (Portuguese)',
  Urdu: 'اردو (Urdu)',
}

function parseStoryResponse(response: string): { currentStep: StoryStep; nextSteps: StoryStep[] } {
  try {
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(cleanResponse)

    if (parsed.desc && Array.isArray(parsed.options)) {
      if (parsed.options.length !== 3) {
        throw new Error(`Invalid step format: expected 3 options, got ${parsed.options.length}`)
      }

      if (parsed.action) {
        console.log(`🎯 Action: ${parsed.action}`)
      }

      return {
        currentStep: {
          step: 1,
          desc: parsed.desc,
          options: parsed.options,
          action: parsed.action,
        },
        nextSteps: [],
      }
    }

    throw new Error('Invalid response format: expected object with desc/options')
  } catch (error) {
    console.error('Error parsing story response:', error)
    throw new Error('Failed to parse story response')
  }
}

async function callClaude(messages: Message[]): Promise<string> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  console.log('🚀 Calling Claude API with', messages.length, 'messages')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.NEXT_PUBLIC_MODEL,
      messages: messages,
      max_tokens: 1200,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Claude API Error:', response.status, errorText)
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const claudeResponse = data.content[0].text

  console.log('📥 Claude response received:', claudeResponse.length, 'characters')
  return claudeResponse
}

function createInitialSystemMessage(storyContent: string, language: string): string {
  // ✅ FIXED: Now correctly looks up the full language instruction
  const languageName = LANGUAGE_MAPPING[language] || 'Français (French)'

  return `# INSTRUCTIONS FOR THE MULTILINGUAL ADVENTURE

## Mandatory Response Format

At each step, provide ONLY a JSON object (nothing else) with this exact model:

\`\`\`json
{
    "desc": "Description of the current step",
    "options": [
      "Option 1",
      "Option 2", 
      "Option 3"
    ],
    "action": "milestone"
}
\`\`\`

**CRITICAL LANGUAGE INSTRUCTION:** 
- Respond ENTIRELY in: ${languageName}
- ALL text (descriptions, options, dialogue) must be in ${languageName}
- Translate and adapt the story content naturally to ${languageName}
- Maintain cultural authenticity while making it accessible to ${languageName} speakers
- For historical/cultural contexts, provide appropriate context for ${languageName} speakers

**IMPORTANT:** 
- Respond ONLY with the JSON, no other text
- Keep in memory the choices of users: make the story progressive and avoid repetition
- Be creative while maintaining historical/scientific accuracy
- The description MUST correspond to the previously selected option for continuity
- When the user reaches a significant story milestone (specified in "## Milestones" section), set action to "milestone"
- For regular story progression, omit the action field or set it to "continue"
- CRITICAL: Return ONLY a JSON object. No markdown code blocks or other formatting.

## Story Content:

${storyContent}

## User Communication Protocol

After this initial setup, the user will communicate using only simple choice messages like "Choice 1", "Choice 2", or "Choice 3". You should interpret these as the user selecting that numbered option from your previous response and continue the story accordingly.

**MEMORY INSTRUCTION:** Remember the ENTIRE conversation history and story progression. Each user message will ONLY contain their choice (e.g., "Choice 2"), and you must recall all previous story steps, character interactions, and plot developments to ensure perfect continuity.

**LANGUAGE CONSISTENCY:** Every response must be consistently in ${languageName}. Adapt names, places, and cultural references appropriately for ${languageName} speakers while maintaining the story's authenticity.

Now please start this adventure story from the beginning in ${languageName}.`
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const {
      sessionId,
      choice,
      storyName,
      language = 'French',
      forceRestart = false,
      conversationHistory = [],
    } = body

    console.log('🌍 Story API Request:', {
      sessionId,
      choice,
      storyName,
      language,
      forceRestart,
      historyLength: conversationHistory.length,
    })

    if (!sessionId || !storyName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: sessionId and storyName',
        },
        { status: 400 }
      )
    }

    let history: Message[] = []

    // Handle new conversation or force restart
    if (conversationHistory.length === 0 || forceRestart) {
      console.log(`🆕 Starting new conversation for: ${storyName} in ${language}`)

      try {
        // Fetch story from database (no language parameter needed)
        const story = await StoryService.getStory(storyName)

        if (!story) {
          return NextResponse.json(
            {
              success: false,
              error: `Story '${storyName}' not found`,
            },
            { status: 404 }
          )
        }

        console.log(`📖 Loaded story from database: ${story.title}`)
        console.log(`🌍 Will be played in: ${LANGUAGE_MAPPING[language] || language}`)

        const initialMessage = createInitialSystemMessage(story.content, language)

        // Set up initial conversation
        history = [
          {
            role: 'user',
            content: initialMessage,
          },
        ]
      } catch (error) {
        console.error('❌ Database error:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to load story from database',
          },
          { status: 500 }
        )
      }
    } else if (choice !== undefined) {
      // For choice requests with existing conversation, only send the choice
      const choiceMessage = `Choice ${choice}`

      history = [
        {
          role: 'user',
          content: choiceMessage,
        },
      ]

      console.log(
        `🎯 User selected choice ${choice} - relying on Claude's memory (conversation exists with ${conversationHistory.length} messages)`
      )
    } else {
      // Continuing existing conversation with full history (for page refresh scenarios)
      history = [...conversationHistory]

      // Check if we need Claude's response
      if (history.length > 0 && history[history.length - 1].role === 'assistant') {
        // We have the last response, return it
        const lastResponse = history[history.length - 1].content
        console.log('📋 Returning cached response from client history')

        try {
          const parsedResponse = parseStoryResponse(lastResponse)
          const userChoices = history.filter(
            msg => msg.role === 'user' && msg.content.startsWith('Choice ')
          ).length

          return NextResponse.json({
            sessionId,
            currentStep: {
              ...parsedResponse.currentStep,
              step: userChoices + 1,
            },
            nextSteps: parsedResponse.nextSteps,
            conversationHistory: history,
            success: true,
          })
        } catch (error) {
          console.error('❌ Error parsing cached response:', error)
          // Fall through to make new API call
        }
      }
    }

    // Call Claude API
    console.log(`📊 Calling Claude with ${history.length} messages`)
    const claudeResponse = await callClaude(history)

    // Handle response history for different request types
    let responseHistory: Message[]

    // Check if Claude's response is valid JSON (for choice requests)
    if (choice !== undefined && conversationHistory.length > 0) {
      try {
        // Test if the response is valid JSON
        const testParse = JSON.parse(claudeResponse.replace(/```json\s*|\s*```/g, '').trim())
        if (!testParse.desc || !Array.isArray(testParse.options)) {
          throw new Error('Invalid JSON structure')
        }
        // Memory worked - set empty response history for choice requests
        responseHistory = []
      } catch (jsonError) {
        console.log('⚠️ Claude memory failed, falling back to full conversation history')

        // Fallback: Send the full conversation history
        const fullHistory: Message[] = [
          ...conversationHistory,
          {
            role: 'user' as const,
            content: `Choice ${choice}`,
          },
        ]

        console.log(`🔄 Retrying with full history (${fullHistory.length} messages)`)
        const retryResponse = await callClaude(fullHistory)

        // Update response history for return
        responseHistory = [
          ...fullHistory,
          {
            role: 'assistant' as const,
            content: retryResponse,
          },
        ]

        // Parse the retry response
        const parsedResponse = parseStoryResponse(retryResponse)
        const userChoices = conversationHistory.filter(
          msg => msg.role === 'user' && msg.content.startsWith('Choice ')
        ).length

        const result = {
          sessionId,
          currentStep: {
            ...parsedResponse.currentStep,
            step: userChoices + 2,
          },
          nextSteps: parsedResponse.nextSteps,
          conversationHistory: responseHistory,
          success: true,
        }

        console.log('✅ Multilingual API response ready (with fallback)')
        return NextResponse.json(result)
      }
    } else {
      // For initial requests, build the full history
      responseHistory = [
        ...history,
        {
          role: 'assistant' as const,
          content: claudeResponse,
        },
      ]
    }

    // Parse the response
    const parsedResponse = parseStoryResponse(claudeResponse)

    // Calculate step number based on whether this is a choice or initial request
    let stepNumber = 1
    if (choice !== undefined && conversationHistory.length > 0) {
      // For choice requests, increment from the conversation history
      const userChoices = conversationHistory.filter(
        msg => msg.role === 'user' && msg.content.startsWith('Choice ')
      ).length
      stepNumber = userChoices + 2 // +1 for current choice, +1 for next step
    }

    const result = {
      sessionId,
      currentStep: {
        ...parsedResponse.currentStep,
        step: stepNumber,
      },
      nextSteps: parsedResponse.nextSteps,
      conversationHistory: responseHistory,
      success: true,
    }

    console.log('✅ API response ready')
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in story processing:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Health check endpoint that also tests database connection
    const isDbHealthy = await StoryService.healthCheck()
    const stats = await StoryService.getStoryStats()

    return NextResponse.json({
      status: 'healthy - multilingual ready',
      timestamp: new Date().toISOString(),
      database: isDbHealthy ? 'connected' : 'disconnected',
      stories: stats,
      languages: Object.keys(LANGUAGE_MAPPING).length,
      supportedLanguages: Object.keys(LANGUAGE_MAPPING),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
