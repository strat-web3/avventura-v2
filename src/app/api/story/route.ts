import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
  forceRestart?: boolean
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
}

interface StoryResponse {
  sessionId?: string
  currentStep: StoryStep
  nextSteps: StoryStep[]
  success: boolean
  error?: string
  shouldRestart?: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// In-memory session storage (replace with database in production)
const sessionStorage = new Map<string, Message[]>()

function parseStoryResponse(response: string): { currentStep: StoryStep; nextSteps: StoryStep[] } {
  try {
    // Remove any markdown code block formatting
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()

    // Parse the JSON response
    const parsed = JSON.parse(cleanResponse)

    // Handle new format: single object with current step
    if (parsed.desc && Array.isArray(parsed.options)) {
      // Validate the single step format
      if (parsed.options.length !== 3) {
        throw new Error(`Invalid step format: expected 3 options, got ${parsed.options.length}`)
      }

      // Create current step and empty next steps
      return {
        currentStep: {
          step: 1, // Will be updated based on conversation history
          desc: parsed.desc,
          options: parsed.options,
        },
        nextSteps: [], // No pre-generated next steps in new format
      }
    }

    throw new Error('Invalid response format: expected object with desc/options')
  } catch (error) {
    console.error('Error parsing story response:', error)
    console.error('Raw response:', response)
    throw new Error('Failed to parse story response')
  }
}

async function callClaude(messages: Message[]): Promise<string> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  console.log('\n=== CLAUDE API CALL ===')
  console.log('🔵 Request Details:')
  console.log(`📊 Number of messages: ${messages.length}`)
  console.log(`🤖 Model: claude-4-opus-20250514`)
  console.log(`🌡️ Temperature: 0.8`)
  console.log(`📝 Max tokens: 2000`)

  // Only log the last few messages to avoid spam
  const messagesToLog = messages.length > 4 ? messages.slice(-2) : messages
  console.log('\n📜 RECENT CONVERSATION:')
  messagesToLog.forEach((message, index) => {
    const actualIndex = messages.length > 4 ? messages.length - 2 + index : index
    console.log(`\n--- Message ${actualIndex + 1} (${message.role.toUpperCase()}) ---`)
    console.log(`📏 Length: ${message.content.length} characters`)
    if (message.content.length < 200) {
      console.log(`📄 Content: ${message.content}`)
    } else {
      console.log(`📄 Content: ${message.content.substring(0, 100)}... [truncated]`)
    }
  })

  console.log('\n🚀 Sending request to Claude API...')
  const startTime = Date.now()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-4-opus-20250514',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  const endTime = Date.now()
  const duration = endTime - startTime

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Claude API Error:', response.status, errorText)
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const claudeResponse = data.content[0].text

  console.log('\n✅ Claude API Response Received:')
  console.log(`⏱️ Duration: ${duration}ms`)
  console.log(`📏 Response length: ${claudeResponse.length} characters`)
  console.log(`📄 Claude's response:`)
  console.log(claudeResponse)
  console.log('\n=== END CLAUDE API CALL ===\n')

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
- The description MUST correspond to the previously selected option to ensure continuity (i.e. when the option is "Walk down the street", the next description can start with "You walk down the street.")
- CRITICAL: Return ONLY a JSON object with desc and options. Do not wrap in markdown code blocks or any other formatting.

## Story Content:

${storyContent}

## User Communication Protocol

After this initial setup, the user will communicate with you using only simple choice messages like "Choice 1", "Choice 2", or "Choice 3". You should interpret these as the user selecting that numbered option from your previous response and continue the story accordingly.

Now please start this adventure story from the beginning.`
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { sessionId, choice, storyName, language = 'français', forceRestart = false } = body

    console.log('🎮 Story API Request:', { sessionId, choice, storyName, language, forceRestart })

    if (!sessionId || !storyName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: sessionId and storyName',
        },
        { status: 400 }
      )
    }

    try {
      // Handle force restart
      if (forceRestart) {
        console.log(`🔄 Force restarting session: ${sessionId} for story: ${storyName}`)
        sessionStorage.delete(sessionId)
      }

      // Get or create conversation history
      let history = sessionStorage.get(sessionId) || []

      if (history.length === 0) {
        console.log(`🆕 Initialized new server session: ${sessionId} for story: ${storyName}`)

        // Read the story file from public folder
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

        // Create the comprehensive initial message
        const initialMessage = createInitialSystemMessage(storyContent, language)

        // Initialize conversation with story content
        history.push({
          role: 'user',
          content: initialMessage,
        })

        console.log(
          forceRestart
            ? `🎬 Starting restarted story: ${storyName} for session: ${sessionId}`
            : `🎬 Starting new story: ${storyName} for session: ${sessionId}`
        )
      } else if (choice !== undefined) {
        // Add user choice to conversation - use simple format as per protocol
        const choiceMessage = `Choice ${choice}`

        history.push({
          role: 'user',
          content: choiceMessage,
        })

        console.log(`🎯 User selected choice ${choice} for session: ${sessionId}`)
        console.log(`📝 Choice message added to history: "${choiceMessage}"`)
      } else {
        // Just continuing existing story without a choice (e.g., page refresh)
        console.log(`🔄 Continuing existing story for session: ${sessionId}`)

        // If we have a conversation but no new choice, and the last message was from the user,
        // we need to get Claude's response. If the last message was from Claude, we can return it.
        if (history.length > 0 && history[history.length - 1].role === 'assistant') {
          // We have Claude's last response, parse and return it
          const lastResponse = history[history.length - 1].content
          console.log('📋 Returning cached Claude response')

          try {
            const parsedResponse = parseStoryResponse(lastResponse)

            // Calculate current step number based on conversation history
            const userChoices = history.filter(
              msg => msg.role === 'user' && msg.content.startsWith('Choice ')
            ).length
            const currentStepNumber = userChoices + 1

            const result: StoryResponse = {
              sessionId,
              currentStep: {
                ...parsedResponse.currentStep,
                step: currentStepNumber,
              },
              nextSteps: parsedResponse.nextSteps,
              success: true,
            }

            return NextResponse.json(result)
          } catch (error) {
            console.error('❌ Error parsing cached response:', error)
            // Fall through to make a new API call
          }
        }
      }

      console.log(`📊 Current conversation history length: ${history.length} messages`)

      // Call Claude API
      const claudeResponse = await callClaude(history)
      console.log('✅ Claude response received')

      // Add Claude's response to history
      history.push({
        role: 'assistant',
        content: claudeResponse,
      })

      console.log(`📈 Updated conversation history length: ${history.length} messages`)

      // Update session storage
      sessionStorage.set(sessionId, history)
      console.log(`💾 Session ${sessionId} updated in storage`)

      // Parse the response
      const parsedResponse = parseStoryResponse(claudeResponse)

      // Calculate current step number based on conversation history
      const userChoices = history.filter(
        msg => msg.role === 'user' && msg.content.startsWith('Choice ')
      ).length
      const currentStepNumber = userChoices + 1

      console.log(
        `🔢 Calculated step number: ${currentStepNumber} (based on ${userChoices} user choices)`
      )

      const result: StoryResponse = {
        sessionId,
        currentStep: {
          ...parsedResponse.currentStep,
          step: currentStepNumber,
        },
        nextSteps: parsedResponse.nextSteps,
        success: true,
      }

      console.log('📋 Story API Response:', {
        sessionId,
        currentStep: result.currentStep.step,
        success: true,
        descriptionLength: result.currentStep.desc.length,
        optionsCount: result.currentStep.options.length,
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('❌ Error in story processing:', error)

      // If the session might be corrupted, suggest restart
      if (error instanceof Error && error.message.includes('parse')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to parse story response',
            shouldRestart: true,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Error parsing request body:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request format',
      },
      { status: 400 }
    )
  }
}

// Health check endpoint
export async function GET() {
  const sessionCount = sessionStorage.size

  return NextResponse.json({
    status: 'healthy',
    sessions: sessionCount,
    timestamp: new Date().toISOString(),
  })
}
