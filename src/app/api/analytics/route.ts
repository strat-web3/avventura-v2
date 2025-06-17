import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/admin/analytics - Get overall analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'summary'

    console.log('📊 Fetching analytics overview')

    // Get comprehensive analytics
    const [stats, allStoriesAnalytics] = await Promise.all([
      StoryService.getStoryStats(),
      StoryService.getAllStoriesAnalytics(),
    ])

    if (format === 'detailed') {
      return NextResponse.json({
        success: true,
        overview: {
          totalStories: stats.totalStories,
          totalSessions: stats.totalSessions,
          totalRequests: stats.totalRequests,
          totalTokens: stats.totalTokens,
          totalCosts: stats.totalCosts,
          averageSessionsPerStory: Math.round(stats.averageSessionsPerStory * 100) / 100,
          averageRequestsPerStory: Math.round(stats.averageRequestsPerStory * 100) / 100,
          averageCostPerSession:
            stats.totalSessions > 0
              ? Math.round((stats.totalCosts / stats.totalSessions) * 10000) / 10000
              : 0,
          averageCostPerRequest:
            stats.totalRequests > 0
              ? Math.round((stats.totalCosts / stats.totalRequests) * 10000) / 10000
              : 0,
          averageTokensPerRequest:
            stats.totalRequests > 0
              ? Math.round((stats.totalTokens / stats.totalRequests) * 100) / 100
              : 0,
        },
        storiesAnalytics: allStoriesAnalytics,
        topStories: {
          mostPopular: allStoriesAnalytics.sort((a, b) => b.sessions - a.sessions).slice(0, 5),
          mostRequests: allStoriesAnalytics.sort((a, b) => b.requests - a.requests).slice(0, 5),
          mostExpensive: allStoriesAnalytics.sort((a, b) => b.costs - a.costs).slice(0, 5),
          mostTokens: allStoriesAnalytics.sort((a, b) => b.tokens - a.tokens).slice(0, 5),
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Summary format
    return NextResponse.json({
      success: true,
      summary: {
        totalStories: stats.totalStories,
        totalSessions: stats.totalSessions,
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        totalCosts: `$${stats.totalCosts.toFixed(4)}`,
        averageSessionsPerStory: Math.round(stats.averageSessionsPerStory * 100) / 100,
        averageRequestsPerStory: Math.round(stats.averageRequestsPerStory * 100) / 100,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    )
  }
}
