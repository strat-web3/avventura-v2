import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/admin/analytics/[slug] - Get analytics for specific story
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    console.log(`📊 Fetching analytics for story: ${slug}`)

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story slug is required',
        },
        { status: 400 }
      )
    }

    // Get story analytics
    const analytics = await StoryService.getStoryAnalytics(slug)

    if (!analytics) {
      return NextResponse.json(
        {
          success: false,
          error: `Story '${slug}' not found`,
        },
        { status: 404 }
      )
    }

    // Get story details for context
    const story = await StoryService.getStory(slug)

    return NextResponse.json({
      success: true,
      story: {
        slug: story?.slug,
        title: story?.title,
        createdAt: story?.created_at,
        updatedAt: story?.updated_at,
      },
      analytics: {
        ...analytics,
        costFormatted: `$${analytics.costs.toFixed(4)}`,
        costPerSessionFormatted: `$${analytics.costPerSession.toFixed(4)}`,
        costPerRequestFormatted: `$${analytics.costPerRequest.toFixed(4)}`,
        tokensPerRequestFormatted: Math.round(analytics.tokensPerRequest * 100) / 100,
      },
      performance: {
        sessionsRank: 'N/A', // Could calculate ranking vs other stories
        requestsRank: 'N/A',
        efficiencyScore:
          analytics.requests > 0 ? Math.round((analytics.sessions / analytics.requests) * 100) : 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`Error fetching analytics for story ${params.slug}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch story analytics',
      },
      { status: 500 }
    )
  }
}
