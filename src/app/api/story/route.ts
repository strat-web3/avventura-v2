import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
  forceRestart?: boolean
  conversationHistory?: Message[] // Add this - client sends conversation
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-4-sonnet-20250514',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.8,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Claude API Error:', response.status, errorText)
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
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
      conversationHistory = [], // Client provides conversation history
    } = body

    console.log('🎮 Stateless Story API Request:', {
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

    let history = [...conversationHistory] // Work with copy

    // Handle new conversation or force restart
    if (history.length === 0 || forceRestart) {
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

      // Reset history and add initial message
      history = [
        {
          role: 'user',
          content: initialMessage,
        },
      ]
    } else if (choice !== undefined) {
      // Add user choice
      const choiceMessage = `Choice ${choice}`
      history.push({
        role: 'user',
        content: choiceMessage,
      })

      console.log(`🎯 User selected choice ${choice}`)
    } else {
      // Continuing existing conversation - check if we need Claude's response
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

    // Add Claude's response to history
    history.push({
      role: 'assistant',
      content: claudeResponse,
    })

    // Parse the response
    const parsedResponse = parseStoryResponse(claudeResponse)
    const userChoices = history.filter(
      msg => msg.role === 'user' && msg.content.startsWith('Choice ')
    ).length

    const result = {
      sessionId,
      currentStep: {
        ...parsedResponse.currentStep,
        step: userChoices + 1,
      },
      nextSteps: parsedResponse.nextSteps,
      conversationHistory: history, // Return complete conversation history
      success: true,
    }

    console.log('✅ Stateless API response ready')
    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Error in stateless story processing:', error)

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
    status: 'healthy - stateless',
    timestamp: new Date().toISOString(),
  })
}
