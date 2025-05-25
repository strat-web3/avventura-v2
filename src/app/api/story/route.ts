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

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { sessionId, choice, storyName, language = 'fr' } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Build the prompt based on whether it's the first step or a continuation
    let prompt = ''

    if (storyName === 'cretace' && choice === undefined) {
      // First step for Cretace story - load content from cretace-sup2.md
      try {
        const filePath = join(process.cwd(), 'public', 'cretace-sup2.md')
        const fileContent = await readFile(filePath, 'utf-8')

        prompt = `${fileContent}

Use French as the language for the story content.

Please generate the first step for this Cretaceous adventure story in French, following the format specified above.`
      } catch (fileError) {
        console.error('Error reading cretace-sup2.md:', fileError)
        // Fallback content if file cannot be read
        prompt = `Generate the first step of a Cretaceous period adventure story in French, featuring Professor Juju as a guide. The story should be educational about Cretaceous marine life and suitable for a 7-year-old. Return only a JSON array with 4 objects in the format specified.`
      }
    } else {
      // Continuation - user made a choice
      prompt = `Continue the Cretaceous adventure story in French. The user chose option ${choice}. Generate the next step and 3 possible future steps in the same JSON format as before. Keep the story educational about Cretaceous period marine life, scientifically accurate, and suitable for a 7-year-old. Include Professor Juju as a helpful, funny, and knowledgeable guide.

Previous context: User is exploring the Cretaceous period with Professor Juju, learning about ancient marine life and fossils.

Generate exactly 4 objects in the JSON array: the immediate result of choice ${choice}, followed by 3 possible next steps.`
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
        model: 'claude-3-5-sonnet-20241022',
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
      console.error('Anthropic API error:', response.status, errorData)
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid API response structure:', data)
      return NextResponse.json({ error: 'Invalid response from AI service' }, { status: 500 })
    }

    const content = data.content[0].text

    try {
      // Parse the JSON response from Claude
      const storySteps: StoryStep[] = JSON.parse(content)

      // Validate the response format
      if (!Array.isArray(storySteps) || storySteps.length !== 4) {
        throw new Error('Invalid response format from AI')
      }

      // Return the current step (first in the array)
      const currentStep = storySteps[0]

      return NextResponse.json({
        sessionId,
        step: currentStep,
        success: true,
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw content:', content)

      // Return a fallback response
      return NextResponse.json({
        sessionId,
        step: {
          desc: "Une erreur est survenue dans l'aventure. Voulez-vous recommencer?",
          options: ["Recommencer l'aventure", "Continuer malgré l'erreur", "Quitter l'aventure"],
        },
        success: false,
      })
    }
  } catch (error) {
    console.error('Story API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  // Test endpoint to verify API is working
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    message: 'Story API is running',
    hasApiKey,
    timestamp: new Date().toISOString(),
  })
}
