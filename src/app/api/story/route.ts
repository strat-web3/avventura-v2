import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

// Store conversation history per session
const conversationHistory = new Map<string, any[]>()

// Session metadata to track when sessions were created/last accessed
const sessionMetadata = new Map<
  string,
  {
    createdAt: number
    lastAccessed: number
    storyName: string
  }
>()

// Request deduplication map - stores active requests and their results
const activeRequests = new Map<string, Promise<any>>()
const cachedResponses = new Map<string, any>()

// Generate unique key for each request
function generateRequestKey(sessionId: string, choice?: number): string {
  return `${sessionId}_${choice || 'init'}`
}

// Check if server has the session in memory
function hasServerSession(sessionId: string): boolean {
  return conversationHistory.has(sessionId)
}

// Initialize new server session
function initializeServerSession(sessionId: string, storyName: string): void {
  if (!conversationHistory.has(sessionId)) {
    conversationHistory.set(sessionId, [])
    sessionMetadata.set(sessionId, {
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      storyName: storyName,
    })
    console.log(`Initialized new server session: ${sessionId} for story: ${storyName}`)
  }
}

// Update session access time
function updateSessionAccess(sessionId: string): void {
  const metadata = sessionMetadata.get(sessionId)
  if (metadata) {
    metadata.lastAccessed = Date.now()
    sessionMetadata.set(sessionId, metadata)
  }
}

// Clean up old sessions (called periodically)
function cleanupOldSessions(): void {
  const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
  let cleanedCount = 0

  // Convert to array to avoid iterator issues
  const sessionsToCheck = Array.from(sessionMetadata.entries())

  sessionsToCheck.forEach(([sessionId, metadata]) => {
    if (metadata.lastAccessed < cutoffTime) {
      conversationHistory.delete(sessionId)
      sessionMetadata.delete(sessionId)
      cleanedCount++
    }
  })

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} old sessions`)
  }
}

// Call cleanup periodically (every hour)
setInterval(cleanupOldSessions, 60 * 60 * 1000)

async function loadStoryInstructions(storyName: string): Promise<string> {
  try {
    const filePath = join(process.cwd(), 'public', `${storyName}.md`)
    const content = await readFile(filePath, 'utf8')
    return content
  } catch (error) {
    console.error(`Error loading story instructions for ${storyName}:`, error)
    throw new Error(`Story "${storyName}" not found`)
  }
}

function parseStoryResponse(response: string): { currentStep: StoryStep; nextSteps: StoryStep[] } {
  try {
    // Remove any markdown code block formatting
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()

    // Parse the JSON response
    const parsed = JSON.parse(cleanResponse)

    // Validate the structure
    if (!Array.isArray(parsed) || parsed.length !== 4) {
      throw new Error('Invalid response format: expected array with 4 objects')
    }

    // Validate each step has required properties
    for (let i = 0; i < parsed.length; i++) {
      const step = parsed[i]
      if (!step.desc || !Array.isArray(step.options) || step.options.length !== 3) {
        throw new Error(`Invalid step ${i}: missing desc or options`)
      }
    }

    return {
      currentStep: { ...parsed[0], step: 1 },
      nextSteps: parsed.slice(1).map((step, index) => ({ ...step, step: index + 2 })),
    }
  } catch (error) {
    console.error('Error parsing story response:', error)
    console.error('Raw response:', response)
    throw new Error('Failed to parse story response')
  }
}

async function callClaudeAPI(messages: any[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API')
    }

    return data.content[0].text
  } catch (error) {
    console.error('Error calling Claude API:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { sessionId, choice, storyName, language = 'français', forceRestart = false } = body

    // Validate required fields
    if (!sessionId || !storyName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId and storyName',
      })
    }

    // Generate request key for deduplication
    const requestKey = generateRequestKey(sessionId, choice)

    // Skip cache for force restart
    if (!forceRestart) {
      // Check if we have a cached response for this exact request
      if (cachedResponses.has(requestKey)) {
        console.log(`Returning cached response for ${requestKey}`)
        return NextResponse.json(cachedResponses.get(requestKey))
      }

      // Check if there's already an active request for this key
      if (activeRequests.has(requestKey)) {
        console.log(`Waiting for existing request: ${requestKey}`)
        const result = await activeRequests.get(requestKey)
        return NextResponse.json(result)
      }
    }

    // Create a new request promise
    const requestPromise = (async () => {
      try {
        // Clean up old sessions periodically
        if (Math.random() < 0.01) {
          // 1% chance to trigger cleanup
          cleanupOldSessions()
        }

        // Handle force restart
        if (forceRestart) {
          console.log(`Force restarting session: ${sessionId} for story: ${storyName}`)
          // Clear existing session data
          conversationHistory.delete(sessionId)
          sessionMetadata.delete(sessionId)
          // Initialize fresh session
          initializeServerSession(sessionId, storyName)
        }

        // Initialize or update session
        if (!hasServerSession(sessionId)) {
          if (choice !== undefined && !forceRestart) {
            // User is trying to continue a story but server doesn't have the session
            return {
              success: false,
              error: 'Session expired or not found. Please refresh the page to restart.',
              shouldRestart: true,
            }
          }
          // Initialize new session for story start
          initializeServerSession(sessionId, storyName)
        } else {
          // Update last accessed time
          updateSessionAccess(sessionId)
        }

        // Get conversation history
        const history = conversationHistory.get(sessionId) || []

        let claudeResponse: string

        if (choice === undefined || forceRestart) {
          // Initial story request or forced restart
          console.log(
            `Starting ${forceRestart ? 'restarted' : 'new'} story: ${storyName} for session: ${sessionId}`
          )

          try {
            const storyInstructions = await loadStoryInstructions(storyName)

            const messages = [
              {
                role: 'user',
                content: storyInstructions,
              },
            ]

            claudeResponse = await callClaudeAPI(messages)

            // Store the initial instructions and response in history
            history.length = 0 // Clear existing history for restart
            history.push(
              { role: 'user', content: storyInstructions },
              { role: 'assistant', content: claudeResponse }
            )
          } catch (error) {
            console.error('Error loading story or calling Claude:', error)
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to start story',
            }
          }
        } else {
          // Continue story with user choice
          console.log(`Continuing story for session: ${sessionId}, choice: ${choice}`)

          if (history.length === 0) {
            return {
              success: false,
              error: 'No story context found. Please refresh to start over.',
              shouldRestart: true,
            }
          }

          // Add user choice to history
          const userMessage = {
            role: 'user',
            content: `I choose option ${choice}.`,
          }

          history.push(userMessage)

          try {
            claudeResponse = await callClaudeAPI(history)

            // Add Claude's response to history
            history.push({
              role: 'assistant',
              content: claudeResponse,
            })
          } catch (error) {
            console.error('Error calling Claude API:', error)
            // Remove the user message if Claude call failed
            history.pop()
            return {
              success: false,
              error: 'Failed to process your choice. Please try again.',
            }
          }
        }

        // Update conversation history
        conversationHistory.set(sessionId, history)

        // Parse the response
        const parsedResponse = parseStoryResponse(claudeResponse)

        const result: StoryResponse = {
          sessionId,
          currentStep: parsedResponse.currentStep,
          nextSteps: parsedResponse.nextSteps,
          success: true,
        }

        // Cache the result (unless it was a force restart)
        if (!forceRestart) {
          cachedResponses.set(requestKey, result)

          // Clean up cache if it gets too large
          if (cachedResponses.size > 1000) {
            const keysToDelete = Array.from(cachedResponses.keys()).slice(0, 100)
            keysToDelete.forEach(key => cachedResponses.delete(key))
          }
        }

        return result
      } catch (error) {
        console.error('Error in story processing:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
      }
    })()

    // Store the active request (unless force restart)
    if (!forceRestart) {
      activeRequests.set(requestKey, requestPromise)
    }

    try {
      const result = await requestPromise
      return NextResponse.json(result)
    } finally {
      // Clean up the active request
      if (!forceRestart) {
        activeRequests.delete(requestKey)
      }
    }
  } catch (error) {
    console.error('Error in POST handler:', error)
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
  const sessionCount = conversationHistory.size
  const activeRequestCount = activeRequests.size
  const cacheSize = cachedResponses.size

  return NextResponse.json({
    status: 'healthy',
    sessions: sessionCount,
    activeRequests: activeRequestCount,
    cacheSize: cacheSize,
    timestamp: new Date().toISOString(),
  })
}
