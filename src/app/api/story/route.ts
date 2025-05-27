import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
}

interface StoryResponse {
  currentStep: StoryStep
  nextSteps: StoryStep[]
}

// Store conversation history per session
const conversationHistory = new Map<string, any[]>()

// Request deduplication map - stores active requests and their results
const activeRequests = new Map<string, Promise<any>>()
const cachedResponses = new Map<string, any>()

// Generate unique key for each request
function getRequestKey(sessionId: string, choice?: number): string {
  return `${sessionId}_${choice || 'first'}`
}

// Main processing function - returns data object, not NextResponse
async function processStoryRequest(body: StoryRequest): Promise<any> {
  const { sessionId, choice, storyName, language = 'fr' } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not found in environment')
    throw new Error('Anthropic API key not configured')
  }

  // Get or initialize conversation history for this session
  let messages = conversationHistory.get(sessionId) || []

  let prompt = ''

  if (choice === undefined) {
    // First step - use the instruction file as-is and start conversation
    try {
      const filePath = join(process.cwd(), 'public', `${storyName}.md`)
      const fileContent = await readFile(filePath, 'utf-8')
      prompt = fileContent // Just use the instruction file directly
      console.log(`📋 Loaded story instructions for: ${storyName}`)

      // Initialize conversation history
      messages = [
        {
          role: 'user',
          content: fileContent,
        },
      ]
    } catch (fileError) {
      console.log(`⚠️ No instructions file found for ${storyName}`)
      // Only use fallback if no instruction file exists
      prompt = `Create a simple interactive story named "${storyName}" in ${language}. Return only JSON array with 4 objects: [{"desc": "text", "options": ["opt1", "opt2", "opt3"]}, {...}, {...}, {...}]`

      messages = [
        {
          role: 'user',
          content: prompt,
        },
      ]
    }
  } else {
    // Continuation - add user choice to conversation history with strong format enforcement
    const choiceMessage = {
      role: 'user',
      content: `User chose option ${choice}. 

CRITICAL: You must continue the ${storyName} story and respond with ONLY a JSON array containing exactly 4 objects. Each object must have "desc" and "options" properties. No other text, no markdown, no explanations.

Format: [{"desc": "story text", "options": ["option1", "option2", "option3"]}, {"desc": "next story text", "options": ["optionA", "optionB", "optionC"]}, {"desc": "another story text", "options": ["optionX", "optionY", "optionZ"]}, {"desc": "final story text", "options": ["option1", "option2", "option3"]}]

Continue the ${storyName} adventure from where the user made their choice.`,
    }
    messages.push(choiceMessage)
  }

  // Make request to Anthropic API with conversation history
  const requestBody = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: messages,
    // Add system message to enforce format consistency
    system: `You are continuing a story called "${storyName}". You must ALWAYS respond with exactly 4 JSON objects in an array format. Each object must have "desc" and "options" properties. Never respond with markdown, explanations, or any other format. Example: [{"desc": "story text", "options": ["opt1", "opt2", "opt3"]}, {...}, {...}, {...}]`,
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('❌ Anthropic API error:', response.status, errorData)
    throw new Error(`API Error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    console.error('❌ Invalid API response structure')
    throw new Error('Invalid response from AI service')
  }

  const content = data.content[0].text

  try {
    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim()

    // Remove ```json and ``` if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the JSON response from Claude
    const storySteps: any[] = JSON.parse(cleanedContent.trim())

    // Validate the response format
    if (!Array.isArray(storySteps) || storySteps.length !== 4) {
      console.error('❌ Invalid response format - expected 4 steps, got:', storySteps.length)
      console.error('📝 Raw content received:', content.substring(0, 200) + '...')
      throw new Error('Invalid response format from AI')
    }

    // Transform and validate each step to ensure correct format
    const validatedSteps: StoryStep[] = storySteps.map((step, index) => {
      // Handle different possible formats from Claude
      let desc = step.desc
      let options = step.options

      // If Claude returned the wrong format, try to extract the content
      if (!desc && step.text) {
        desc = step.text
      }
      if (!desc && step.description) {
        desc = step.description
      }

      // If no options found, create default ones based on language
      if (!options || !Array.isArray(options) || options.length !== 3) {
        console.warn(`⚠️ Step ${index} has invalid options, using defaults`)
        const defaultOptions =
          language === 'fr'
            ? ["Continuer l'exploration", 'Demander des explications', 'Explorer autre chose']
            : ['Continue exploring', 'Ask for explanations', 'Explore something else']
        options = defaultOptions
      }

      // Ensure we have a description
      if (!desc || typeof desc !== 'string') {
        console.warn(`⚠️ Step ${index} has invalid description, using default`)
        desc =
          language === 'fr'
            ? `Une nouvelle aventure vous attend dans ${storyName}.`
            : `A new adventure awaits you in ${storyName}.`
      }

      return {
        desc,
        options: options.slice(0, 3), // Ensure exactly 3 options
      }
    })

    // Add Claude's response to conversation history
    messages.push({
      role: 'assistant',
      content: content,
    })

    // Store updated conversation history
    conversationHistory.set(sessionId, messages)

    // Return the current step and the next possible steps
    const [currentStep, ...nextSteps] = validatedSteps

    // Log the formatted response
    console.log('✅ Response generated:')
    console.log('   📖 Current Step:', currentStep.desc)
    console.log(
      '   🎯 Options:',
      currentStep.options.map((opt, i) => `${i + 1}. ${opt}`).join(' | ')
    )
    console.log('   📊 Next Steps Preloaded:', nextSteps.length)

    return {
      sessionId,
      currentStep,
      nextSteps,
      success: true,
    }
  } catch (parseError) {
    console.error(
      '❌ Failed to parse AI response:',
      parseError instanceof Error ? parseError.message : parseError
    )
    console.error('📝 Raw content that failed to parse:', content.substring(0, 500))

    // If we get a parsing error, try to recover by sending a correction message
    if (choice !== undefined) {
      console.error('🔧 Attempting format correction...')

      // Add a strong correction message
      const correctionMessage = {
        role: 'user',
        content: `ERROR: Your previous response was not valid JSON. You MUST respond with ONLY a JSON array containing exactly 4 objects for the ${storyName} story. No markdown, no other text, no explanations.

REQUIRED FORMAT:
[
  {"desc": "Description for current step in ${storyName}", "options": ["Option 1", "Option 2", "Option 3"]},
  {"desc": "Description for next step in ${storyName}", "options": ["Option A", "Option B", "Option C"]},
  {"desc": "Description for another step in ${storyName}", "options": ["Option X", "Option Y", "Option Z"]},
  {"desc": "Description for final step in ${storyName}", "options": ["Option 1", "Option 2", "Option 3"]}
]

Continue the ${storyName} adventure where user chose option ${choice}.`,
      }

      messages.push(correctionMessage)
      conversationHistory.set(sessionId, messages)

      // Try one more time with correction
      try {
        const retryResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: messages,
          }),
        })

        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          const retryContent = retryData.content[0].text.trim()

          // Clean retry content
          let cleanedRetryContent = retryContent
          if (cleanedRetryContent.startsWith('```json')) {
            cleanedRetryContent = cleanedRetryContent
              .replace(/^```json\s*/, '')
              .replace(/\s*```$/, '')
          } else if (cleanedRetryContent.startsWith('```')) {
            cleanedRetryContent = cleanedRetryContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
          }

          try {
            const retrySteps = JSON.parse(cleanedRetryContent)
            if (Array.isArray(retrySteps) && retrySteps.length === 4) {
              console.log('✅ Format correction successful!')

              // Validate and process the corrected response
              const validatedRetrySteps: StoryStep[] = retrySteps.map((step, index) => ({
                desc: step.desc || `Continuing ${storyName} adventure...`,
                options:
                  Array.isArray(step.options) && step.options.length === 3
                    ? step.options
                    : ['Continue', 'Explore', 'Ask questions'],
              }))

              // Add corrected response to history
              messages.push({
                role: 'assistant',
                content: retryContent,
              })
              conversationHistory.set(sessionId, messages)

              const [currentStep, ...nextSteps] = validatedRetrySteps
              return {
                sessionId,
                currentStep,
                nextSteps,
                success: true,
              }
            }
          } catch (retryParseError) {
            console.error('❌ Retry also failed to parse:', retryParseError)
          }
        }
      } catch (retryError) {
        console.error('❌ Retry request failed:', retryError)
      }
    }

    // Return a fallback response based on language
    const fallbackDesc =
      language === 'fr'
        ? "Une erreur est survenue dans l'aventure. Voulez-vous recommencer?"
        : 'An error occurred in the adventure. Would you like to restart?'

    const fallbackOptions =
      language === 'fr'
        ? ["Recommencer l'aventure", "Continuer malgré l'erreur", "Quitter l'aventure"]
        : ['Restart the adventure', 'Continue despite the error', 'Exit the adventure']

    return {
      sessionId,
      currentStep: {
        desc: fallbackDesc,
        options: fallbackOptions,
      },
      nextSteps: [],
      success: false,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { sessionId, choice, storyName, language = 'fr' } = body

    const requestKey = getRequestKey(sessionId, choice)

    // Check if we have a cached response for this exact request
    if (cachedResponses.has(requestKey)) {
      console.log(
        `🔄 Returning cached response: ${storyName} | Choice: ${choice || 'first'} | Session: ${sessionId.slice(-8)}`
      )
      const cachedResult = cachedResponses.get(requestKey)
      return NextResponse.json(cachedResult)
    }

    // Check if the same request is already in progress
    if (activeRequests.has(requestKey)) {
      console.log(
        `🔄 Deduplicating request: ${storyName} | Choice: ${choice || 'first'} | Session: ${sessionId.slice(-8)}`
      )
      const result = await activeRequests.get(requestKey)
      return NextResponse.json(result)
    }

    console.log(
      `📨 Story API Request: ${storyName} | Choice: ${choice || 'first'} | Session: ${sessionId.slice(-8)}`
    )

    // Create and store the request promise
    const requestPromise = processStoryRequest(body)
    activeRequests.set(requestKey, requestPromise)

    try {
      const result = await requestPromise
      console.log('result:', result)
      // Cache the result data (not the Response object)
      cachedResponses.set(requestKey, result)

      return NextResponse.json(result)
    } finally {
      // Clean up the active request when done
      activeRequests.delete(requestKey)

      // Clean up cache after 30 seconds to prevent memory leaks
      setTimeout(() => {
        cachedResponses.delete(requestKey)
      }, 30000)
    }
  } catch (error) {
    console.error('❌ Story API Error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // Test endpoint to verify API is working
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    message: 'Story API is running',
    hasApiKey,
    activeRequests: activeRequests.size,
    conversationSessions: conversationHistory.size,
    timestamp: new Date().toISOString(),
  })
}

// Clean up old conversation histories periodically (optional)
setInterval(() => {
  // Keep only the most recent 100 sessions to prevent memory leaks
  if (conversationHistory.size > 100) {
    const entries = Array.from(conversationHistory.entries())
    const toKeep = entries.slice(-100)
    conversationHistory.clear()
    toKeep.forEach(([key, value]) => conversationHistory.set(key, value))
    console.log('🧹 Cleaned up old conversation histories')
  }
}, 300000) // Every 5 minutes
