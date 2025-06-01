import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
  forceRestart?: boolean
  conversationHistory?: Message[] // Keep for backward compatibility but won't use for choices
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// NO server-side storage - completely stateless
function parseStoryResponse(response: string): { currentStep: StoryStep; nextSteps: StoryStep[] } {
  try {
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(cleanResponse)

    if (parsed.desc && Array.isArray(parsed.options)) {
      if (parsed.options.length !== 3) {
        throw new Error(`Invalid step format: expected 3 options, got ${parsed.options.length}`)
      }

      return {
        currentStep: {
          step: 1,
          desc: parsed.desc,
          options: parsed.options,
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

  // Log all messages being sent to Claude
  console.log('📤 MESSAGES SENT TO CLAUDE:')
  messages.forEach((message, index) => {
    console.log(`--- Message ${index + 1} (${message.role.toUpperCase()}) ---`)
    console.log(`📏 Length: ${message.content.length} characters`)
    if (message.content.length <= 200) {
      console.log(`📄 Full content: ${message.content}`)
    } else {
      console.log(`📄 Preview: ${message.content.substring(0, 200)}...`)
      console.log(`📄 Full content: ${message.content}`)
    }
    console.log('--- End Message ---')
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
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

  // Log Claude's complete response
  console.log('📥 CLAUDE API RESPONSE:')
  console.log(`📏 Response length: ${claudeResponse.length} characters`)
  console.log(`📄 Full response: ${claudeResponse}`)
  console.log('--- End Claude Response ---')

  return claudeResponse
}

function createInitialSystemMessage(storyContent: string, language: string): string {
  return `# INSTRUCTIONS FOR THE ADVENTURE

## Mandatory Response Format

At each step, provide ONLY a JSON object (nothing else) with this exact model:

\`\`\`json
{
    "desc": "Description of the current step",
    "options": [
      "Option 1",
      "Option 2", 
      "Option 3"
    ]
}
\`\`\`

**IMPORTANT:** 
- Respond ONLY with the JSON, no other text
- Respond in the language: ${language}
- Keep in memory the choices of users: make it so the story don't repeat itself
- There must be surprises. Be as creative as you can, but keep the historical and musical accuracy
- The description MUST correspond to the previously selected option to ensure continuity
- CRITICAL: Return ONLY a JSON object with desc and options. Do not wrap in markdown code blocks or any other formatting.

## Story Content:

${storyContent}

## User Communication Protocol

After this initial setup, the user will communicate with you using only simple choice messages like "Choice 1", "Choice 2", or "Choice 3". You should interpret these as the user selecting that numbered option from your previous response and continue the story accordingly.

**IMPORTANT MEMORY INSTRUCTION:** You must remember the ENTIRE conversation history and story progression from all previous exchanges. Each user message will ONLY contain their choice (e.g., "Choice 2"), and you must recall all previous story steps, character interactions, and plot developments to ensure perfect continuity. Do not ask for context or previous information - maintain complete memory of the adventure's progression.

Now please start this adventure story from the beginning.`
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const {
      sessionId,
      choice,
      storyName,
      language = 'français',
      forceRestart = false,
      conversationHistory = [], // Keep for initial requests but ignore for choices
    } = body

    console.log('🎮 Memory-Optimized Story API Request:', {
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
      console.log(`🆕 Starting new conversation for: ${storyName}`)

      // Read the story file
      const storyFilePath = path.join(process.cwd(), 'public', `${storyName}.md`)

      if (!fs.existsSync(storyFilePath)) {
        return NextResponse.json(
          {
            success: false,
            error: `Story '${storyName}' not found`,
          },
          { status: 404 }
        )
      }

      const storyContent = fs.readFileSync(storyFilePath, 'utf-8')
      const initialMessage = createInitialSystemMessage(storyContent, language)

      // Set up initial conversation
      history = [
        {
          role: 'user',
          content: initialMessage,
        },
      ]
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
            conversationHistory: history, // Return updated history
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

    // For initial requests, we need to return the full conversation history
    // For choice requests, we simulate the conversation history for the client
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

        // Fallback: Send the full conversation history with proper typing
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

        console.log('✅ Memory-optimized API response ready (with fallback)')
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
      conversationHistory: responseHistory, // Return appropriate history
      success: true,
    }

    console.log('✅ Memory-optimized API response ready')
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in memory-optimized story processing:', error)

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
  return NextResponse.json({
    status: 'healthy - memory optimized',
    timestamp: new Date().toISOString(),
  })
}
