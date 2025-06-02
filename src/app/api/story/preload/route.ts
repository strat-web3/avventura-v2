// src/app/api/story/preload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PreloadRequest {
  sessionId: string
  storyName: string
  language?: string
  conversationHistory: Message[]
  choices: number[] // Array of choice numbers to preload (e.g., [1, 2, 3])
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
  action?: string
}

// Map frontend language codes to full language names for Claude
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

  console.log('🚀 [Preload] Calling Claude API with', messages.length, 'messages')

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
    console.error('❌ [Preload] Claude API Error:', response.status, errorText)
    throw new Error(`Claude API error: ${response.status}`)
  }

  const data = await response.json()
  const claudeResponse = data.content[0].text

  console.log('📥 [Preload] Claude response received:', claudeResponse.length, 'characters')
  return claudeResponse
}

export async function POST(request: NextRequest) {
  try {
    const body: PreloadRequest = await request.json()
    const {
      sessionId,
      storyName,
      language = 'French',
      conversationHistory = [],
      choices = [1, 2, 3],
    } = body

    console.log('🔮 [Preload] Request:', {
      sessionId,
      storyName,
      language,
      historyLength: conversationHistory.length,
      choices,
    })

    if (!sessionId || !storyName || conversationHistory.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: sessionId, storyName, and conversationHistory',
        },
        { status: 400 }
      )
    }

    // Preload responses for each choice
    const preloadedSteps: Record<number, StoryStep> = {}
    const errors: Record<number, string> = {}

    await Promise.allSettled(
      choices.map(async choice => {
        try {
          console.log(`🔮 [Preload] Processing choice ${choice}`)

          // Create the choice message
          const choiceMessage = `Choice ${choice}`

          // Build the full conversation history with the choice
          const fullHistory: Message[] = [
            ...conversationHistory,
            {
              role: 'user' as const,
              content: choiceMessage,
            },
          ]

          // Call Claude API
          const claudeResponse = await callClaude(fullHistory)

          // Parse the response
          const parsedResponse = parseStoryResponse(claudeResponse)

          // Calculate step number
          const userChoices = conversationHistory.filter(
            msg => msg.role === 'user' && msg.content.startsWith('Choice ')
          ).length
          const stepNumber = userChoices + 2 // +1 for current choice, +1 for next step

          preloadedSteps[choice] = {
            ...parsedResponse.currentStep,
            step: stepNumber,
          }

          console.log(`✅ [Preload] Choice ${choice} preloaded successfully`)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors[choice] = errorMsg
          console.error(`❌ [Preload] Choice ${choice} failed:`, errorMsg)
        }
      })
    )

    const successCount = Object.keys(preloadedSteps).length
    const errorCount = Object.keys(errors).length

    console.log(`📊 [Preload] Results: ${successCount} successful, ${errorCount} failed`)

    return NextResponse.json({
      success: successCount > 0,
      sessionId,
      preloadedSteps,
      errors,
      summary: {
        requested: choices.length,
        successful: successCount,
        failed: errorCount,
      },
      message: `Preloaded ${successCount}/${choices.length} choices`,
    })
  } catch (error) {
    console.error('❌ [Preload] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
