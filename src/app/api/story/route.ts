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

export async function POST(request: NextRequest) {
  try {
    const body: StoryRequest = await request.json()
    const { sessionId, choice, storyName, language = 'fr' } = body

    console.log('=== STORY API REQUEST ===')
    console.log('SessionId:', sessionId)
    console.log('Choice:', choice)
    console.log('StoryName:', storyName)
    console.log('Language:', language)
    console.log('Is first step:', choice === undefined)

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment')
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
    }

    // Build the prompt based on whether it's the first step or a continuation
    let prompt = ''

    if (storyName === 'cretace' && choice === undefined) {
      console.log('Loading first step for Cretace story')
      // First step for Cretace story - load content from cretace-sup2.md
      try {
        const filePath = join(process.cwd(), 'public', 'cretace-sup2.md')
        console.log('Reading file from:', filePath)
        const fileContent = await readFile(filePath, 'utf-8')
        console.log('File content loaded, length:', fileContent.length)

        prompt = fileContent
      } catch (fileError) {
        console.error('Error reading cretace-sup2.md:', fileError)
        // Fallback content if file cannot be read
        prompt = `Génère la première étape d'une aventure du Crétacé en français avec le professeur Juju. Retourne uniquement un tableau JSON avec 4 objets ayant chacun "desc" et "options" (3 choix). Histoire éducative pour enfant de 7 ans.`
      }
    } else {
      console.log('Generating continuation step for choice:', choice)
      // Continuation - user made a choice
      prompt = `Continue l'aventure du Crétacé en français. L'utilisateur a choisi l'option ${choice}.

OBLIGATOIRE : Retourne EXACTEMENT le même format JSON que demandé initialement. Un tableau avec exactement 4 objets ayant cette structure :
{
  "desc": "Texte de description en français", 
  "options": ["Option 1", "Option 2", "Option 3"]
}

Le premier objet = résultat immédiat du choix ${choice}
Les 3 objets suivants = étapes futures possibles

Contexte : aventure éducative du Crétacé Supérieur avec le professeur Juju (personnage facétieux et bienveillant). Histoire scientifiquement exacte, adaptée pour enfant de 7 ans, sur la vie marine préhistorique.

Retourne UNIQUEMENT le tableau JSON, aucun autre texte.`
    }

    console.log('Prompt prepared, length:', prompt.length)
    console.log('Making request to Anthropic API...')

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

    console.log('Anthropic API response status:', response.status)
    console.log('Anthropic API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', response.status, errorData)
      return NextResponse.json(
        { error: `API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Anthropic API response data structure:', {
      hasContent: !!data.content,
      contentIsArray: Array.isArray(data.content),
      contentLength: data.content?.length,
      firstContentType: data.content?.[0]?.type,
      usage: data.usage,
    })

    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid API response structure:', data)
      return NextResponse.json({ error: 'Invalid response from AI service' }, { status: 500 })
    }

    const content = data.content[0].text
    console.log('Raw content from AI:', content)
    console.log('Content length:', content.length)

    try {
      // Parse the JSON response from Claude
      console.log('Attempting to parse JSON...')
      const storySteps: any[] = JSON.parse(content)
      console.log('JSON parsed successfully, steps count:', storySteps.length)
      console.log(
        'Steps structure:',
        storySteps.map((step, i) => ({
          index: i,
          hasDesc: !!step.desc,
          optionsCount: step.options?.length,
          hasStep: !!step.step,
          keys: Object.keys(step),
        }))
      )

      // Validate the response format
      if (!Array.isArray(storySteps) || storySteps.length !== 4) {
        console.error('Invalid response format - expected 4 steps, got:', storySteps.length)
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

        // If no options found, create default ones
        if (!options || !Array.isArray(options) || options.length !== 3) {
          console.warn(`Step ${index} has invalid options:`, options)
          options = [
            "Continuer l'exploration",
            'Demander des explications au professeur Juju',
            'Explorer autre chose',
          ]
        }

        // Ensure we have a description
        if (!desc || typeof desc !== 'string') {
          console.warn(`Step ${index} has invalid description:`, desc)
          desc = `Une nouvelle aventure vous attend dans le Crétacé avec le professeur Juju.`
        }

        return {
          desc,
          options: options.slice(0, 3), // Ensure exactly 3 options
        }
      })

      console.log(
        'Validated steps:',
        validatedSteps.map((step, i) => ({
          index: i,
          descLength: step.desc.length,
          optionsCount: step.options.length,
        }))
      )

      // Return the current step and the next possible steps
      const [currentStep, ...nextSteps] = validatedSteps
      console.log('Returning response with currentStep and', nextSteps.length, 'nextSteps')

      return NextResponse.json({
        sessionId,
        currentStep,
        nextSteps,
        success: true,
      })
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw content that failed to parse:', content)
      console.error(
        'Parse error details:',
        parseError instanceof Error ? parseError.message : parseError
      )

      // Return a fallback response
      return NextResponse.json({
        sessionId,
        currentStep: {
          desc: "Une erreur est survenue dans l'aventure. Voulez-vous recommencer?",
          options: ["Recommencer l'aventure", "Continuer malgré l'erreur", "Quitter l'aventure"],
        },
        nextSteps: [],
        success: false,
      })
    }
  } catch (error) {
    console.error('=== STORY API ERROR ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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
