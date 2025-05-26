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

  let prompt = ''

  if (choice === undefined) {
    // First step - try to load story-specific instructions
    try {
      const filePath = join(process.cwd(), 'public', `${storyName}.md`)
      const fileContent = await readFile(filePath, 'utf-8')
      prompt = fileContent
      console.log(`📋 Loaded story instructions for: ${storyName}`)
    } catch (fileError) {
      console.log(`⚠️ No instructions file found for ${storyName}, using generic prompt`)
      // Fallback generic content
      prompt = `Create the first step of an interactive adventure story named "${storyName}" in ${language}.

MANDATORY: Return ONLY a JSON array with exactly 4 objects, each having this structure:
{
  "desc": "Description text in ${language}",
  "options": ["Option 1", "Option 2", "Option 3"]
}

The first object = the initial situation
The next 3 objects = possible future steps

Requirements:
- Educational and engaging content appropriate for children
- Scientifically accurate if applicable
- Include a friendly guide character
- Each option should lead to different story branches
- Return ONLY the JSON array, no other text.`
    }
  } else {
    // Continuation - user made a choice
    prompt = `Continue the "${storyName}" adventure story in ${language}. The user chose option ${choice}.

MANDATORY: Return ONLY a JSON array with exactly 4 objects having this structure:
{
  "desc": "Description text in ${language}", 
  "options": ["Option 1", "Option 2", "Option 3"]
}

The first object = immediate result of choice ${choice}
The next 3 objects = possible future steps

Requirements:
- Keep the story consistent and engaging
- Educational content appropriate for children
- Include character interactions
- Each description should advance the story
- Return ONLY the JSON array, no other text.`
  }

  // Make request to Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
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
    // Parse the JSON response from Claude
    const storySteps: any[] = JSON.parse(content)

    // Validate the response format
    if (!Array.isArray(storySteps) || storySteps.length !== 4) {
      console.error('❌ Invalid response format - expected 4 steps, got:', storySteps.length)
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

    // Return the current step and the next possible steps
    const [currentStep, ...nextSteps] = validatedSteps

    // Log the formatted response
    console.log('✅ Response generated:')
    console.log('📖 Current Step:', currentStep.desc.substring(0, 80) + '...')
    console.log('🎯 Options:', currentStep.options.map((opt, i) => `${i + 1}. ${opt}`).join(' | '))
    console.log('📊 Next Steps Preloaded:', nextSteps.length)

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
    timestamp: new Date().toISOString(),
  })
}
