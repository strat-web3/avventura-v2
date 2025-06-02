import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'

// GET /api/admin/stories/homepage?language=fr
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'fr'

    console.log(`🏠 Fetching homepage stories for language: ${language}`)

    // Get stories with localized homepage display data
    const stories = await StoryService.getStoriesForHomepage(language)

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length,
      language,
      message: `Retrieved ${stories.length} stories for homepage in ${language}`,
    })
  } catch (error) {
    console.error('Error fetching homepage stories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch homepage stories',
      },
      { status: 500 }
    )
  }
}
