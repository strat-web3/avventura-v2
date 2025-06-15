import { NextRequest, NextResponse } from 'next/server'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'

interface RukhResponse {
  output?: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  txHash?: string
  network?: string
  explorerLink?: string
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming form data
    const formData = await request.formData()

    const message = formData.get('message') as string
    const model = formData.get('model') as string
    const sessionId = formData.get('sessionId') as string
    const walletAddress = formData.get('walletAddress') as string
    const context = formData.get('context') as string
    const data = formData.get('data') as string
    const file = formData.get('file') as File | null

    console.log('🚀 Rukh API Request:', {
      message: message?.substring(0, 100) + '...',
      model,
      sessionId,
      context,
      hasFile: !!file,
    })

    // Validate required fields
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Prepare the form data for Rukh API
    const rukhFormData = new FormData()
    rukhFormData.append('message', message)
    rukhFormData.append('model', model || 'anthropic')
    rukhFormData.append('sessionId', sessionId || '')
    rukhFormData.append('walletAddress', walletAddress || '')
    rukhFormData.append('context', context || 'avventura')
    rukhFormData.append('data', data || '')

    if (file) {
      rukhFormData.append('file', file)
    }

    // Make request to Rukh API
    console.log('📡 Calling Rukh API at: https://rukh.w3hc.org/ask')

    const rukhResponse = await fetch('https://rukh.w3hc.org/ask', {
      method: 'POST',
      body: rukhFormData,
      // Don't set Content-Type header - let fetch set it for FormData
    })

    if (!rukhResponse.ok) {
      const errorText = await rukhResponse.text()
      console.error('❌ Rukh API Error:', rukhResponse.status, errorText)

      return NextResponse.json(
        {
          error: `Rukh API error: ${rukhResponse.status} ${rukhResponse.statusText}`,
          details: errorText,
        },
        { status: rukhResponse.status }
      )
    }

    const result: RukhResponse = await rukhResponse.json()
    console.log('✅ Rukh API Success:', {
      hasOutput: !!result.output,
      outputLength: result.output?.length,
      hasUsage: !!result.usage,
      hasTx: !!result.txHash,
    })

    // Return the successful response
    return NextResponse.json(result)
  } catch (error) {
    console.error('💥 Error in Rukh API route:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json({ error: `Server error: ${errorMessage}` }, { status: 500 })
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Rukh API Proxy',
    timestamp: new Date().toISOString(),
    endpoint: 'https://rukh.w3hc.org/ask',
  })
}
