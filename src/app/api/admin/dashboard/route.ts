// src/app/api/admin/dashboard/route.ts - Comprehensive analytics dashboard

import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

export const dynamic = 'force-dynamic'

// GET /api/admin/dashboard - Get formatted dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'all' // all, week, month
    const format = searchParams.get('format') || 'dashboard' // dashboard, export, summary

    console.log('📊 Fetching dashboard analytics')

    // Get all data needed for dashboard
    const [stats, allStoriesAnalytics, stories] = await Promise.all([
      StoryService.getStoryStats(),
      StoryService.getAllStoriesAnalytics(),
      StoryService.getAllStories(),
    ])

    // Calculate dashboard metrics
    const dashboardData = {
      overview: {
        totalStories: stats.totalStories,
        totalSessions: stats.totalSessions,
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        totalCosts: stats.totalCosts,

        // Efficiency metrics
        averageSessionsPerStory: Math.round(stats.averageSessionsPerStory * 100) / 100,
        averageRequestsPerStory: Math.round(stats.averageRequestsPerStory * 100) / 100,
        averageRequestsPerSession:
          stats.totalSessions > 0
            ? Math.round((stats.totalRequests / stats.totalSessions) * 100) / 100
            : 0,

        // Cost metrics
        averageCostPerStory:
          stats.totalStories > 0
            ? Math.round((stats.totalCosts / stats.totalStories) * 10000) / 10000
            : 0,
        averageCostPerSession:
          stats.totalSessions > 0
            ? Math.round((stats.totalCosts / stats.totalSessions) * 10000) / 10000
            : 0,
        averageCostPerRequest:
          stats.totalRequests > 0
            ? Math.round((stats.totalCosts / stats.totalRequests) * 10000) / 10000
            : 0,

        // Token metrics
        averageTokensPerStory:
          stats.totalStories > 0
            ? Math.round((stats.totalTokens / stats.totalStories) * 100) / 100
            : 0,
        averageTokensPerSession:
          stats.totalSessions > 0
            ? Math.round((stats.totalTokens / stats.totalSessions) * 100) / 100
            : 0,
        averageTokensPerRequest:
          stats.totalRequests > 0
            ? Math.round((stats.totalTokens / stats.totalRequests) * 100) / 100
            : 0,
      },

      // Top performers
      rankings: {
        mostPopular: allStoriesAnalytics
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5)
          .map((story, index) => ({
            rank: index + 1,
            slug: story.storySlug,
            title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
            sessions: story.sessions,
            sessionShare:
              stats.totalSessions > 0
                ? Math.round((story.sessions / stats.totalSessions) * 10000) / 100
                : 0,
          })),

        mostRequests: allStoriesAnalytics
          .sort((a, b) => b.requests - a.requests)
          .slice(0, 5)
          .map((story, index) => ({
            rank: index + 1,
            slug: story.storySlug,
            title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
            requests: story.requests,
            requestShare:
              stats.totalRequests > 0
                ? Math.round((story.requests / stats.totalRequests) * 10000) / 100
                : 0,
          })),

        mostExpensive: allStoriesAnalytics
          .sort((a, b) => b.costs - a.costs)
          .slice(0, 5)
          .map((story, index) => ({
            rank: index + 1,
            slug: story.storySlug,
            title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
            costs: Math.round(story.costs * 10000) / 10000,
            costShare:
              stats.totalCosts > 0 ? Math.round((story.costs / stats.totalCosts) * 10000) / 100 : 0,
          })),

        mostEfficient: allStoriesAnalytics
          .filter(story => story.sessions > 0 && story.requests > 0)
          .map(story => ({
            ...story,
            efficiency: Math.round((story.sessions / story.requests) * 10000) / 100, // sessions per request ratio
          }))
          .sort((a, b) => b.efficiency - a.efficiency)
          .slice(0, 5)
          .map((story, index) => ({
            rank: index + 1,
            slug: story.storySlug,
            title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
            efficiency: story.efficiency,
            sessions: story.sessions,
            requests: story.requests,
          })),
      },

      // Performance insights
      insights: {
        costEfficiency: {
          bestValueStories: allStoriesAnalytics
            .filter(story => story.sessions > 0)
            .map(story => ({
              slug: story.storySlug,
              title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
              costPerSession: Math.round(story.costPerSession * 10000) / 10000,
              sessions: story.sessions,
            }))
            .sort((a, b) => a.costPerSession - b.costPerSession)
            .slice(0, 3),

          highestCostPerSession: allStoriesAnalytics
            .filter(story => story.sessions > 0)
            .map(story => ({
              slug: story.storySlug,
              title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
              costPerSession: Math.round(story.costPerSession * 10000) / 10000,
              sessions: story.sessions,
            }))
            .sort((a, b) => b.costPerSession - a.costPerSession)
            .slice(0, 3),
        },

        engagement: {
          highEngagement: allStoriesAnalytics
            .filter(story => story.sessions > 0)
            .map(story => ({
              slug: story.storySlug,
              title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
              requestsPerSession: Math.round((story.requests / story.sessions) * 100) / 100,
              sessions: story.sessions,
              requests: story.requests,
            }))
            .sort((a, b) => b.requestsPerSession - a.requestsPerSession)
            .slice(0, 3),

          lowEngagement: allStoriesAnalytics
            .filter(story => story.sessions > 0)
            .map(story => ({
              slug: story.storySlug,
              title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
              requestsPerSession: Math.round((story.requests / story.sessions) * 100) / 100,
              sessions: story.sessions,
              requests: story.requests,
            }))
            .sort((a, b) => a.requestsPerSession - b.requestsPerSession)
            .slice(0, 3),
        },
      },

      // Cost breakdown
      costs: {
        total: {
          amount: stats.totalCosts,
          formatted: `$${stats.totalCosts.toFixed(4)}`,
          currency: 'USD',
        },
        byStory: allStoriesAnalytics
          .sort((a, b) => b.costs - a.costs)
          .map(story => ({
            slug: story.storySlug,
            title: stories.find(s => s.slug === story.storySlug)?.title || story.storySlug,
            amount: Math.round(story.costs * 10000) / 10000,
            formatted: `$${story.costs.toFixed(4)}`,
            percentage:
              stats.totalCosts > 0 ? Math.round((story.costs / stats.totalCosts) * 10000) / 100 : 0,
            sessions: story.sessions,
            requests: story.requests,
          })),
        projectedMonthly: stats.totalCosts * 30, // Very rough estimate, would need time-based data for accuracy
        formattedProjectedMonthly: `$${(stats.totalCosts * 30).toFixed(2)}`,
      },

      // Story health
      storyHealth: allStoriesAnalytics
        .map(story => {
          const storyData = stories.find(s => s.slug === story.storySlug)

          // Calculate health score (0-100)
          let healthScore = 0
          if (story.sessions > 0) healthScore += 40 // Has users
          if (story.sessions >= 5) healthScore += 20 // Popular
          if (story.requests > 0) healthScore += 20 // Has interactions
          if (story.costPerSession < 0.01) healthScore += 20 // Cost efficient

          return {
            slug: story.storySlug,
            title: storyData?.title || story.storySlug,
            healthScore,
            status:
              healthScore >= 80
                ? 'excellent'
                : healthScore >= 60
                  ? 'good'
                  : healthScore >= 40
                    ? 'fair'
                    : 'needs-attention',
            metrics: {
              sessions: story.sessions,
              requests: story.requests,
              tokens: story.tokens,
              costs: Math.round(story.costs * 10000) / 10000,
              costPerSession: Math.round(story.costPerSession * 10000) / 10000,
              requestsPerSession:
                story.sessions > 0 ? Math.round((story.requests / story.sessions) * 100) / 100 : 0,
            },
            lastUpdated: storyData?.updated_at,
          }
        })
        .sort((a, b) => b.healthScore - a.healthScore),
    }

    // Format response based on requested format
    if (format === 'export') {
      // CSV-style export format
      return NextResponse.json({
        success: true,
        format: 'export',
        exportData: {
          overview: dashboardData.overview,
          stories: dashboardData.storyHealth,
          costs: dashboardData.costs.byStory,
        },
        timestamp: new Date().toISOString(),
      })
    }

    if (format === 'summary') {
      // Brief summary format
      return NextResponse.json({
        success: true,
        format: 'summary',
        summary: {
          totalStories: dashboardData.overview.totalStories,
          totalSessions: dashboardData.overview.totalSessions,
          totalCosts: dashboardData.costs.total.formatted,
          topStory: dashboardData.rankings.mostPopular[0]?.title || 'N/A',
          averageCostPerSession: `$${dashboardData.overview.averageCostPerSession.toFixed(4)}`,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Full dashboard format (default)
    return NextResponse.json({
      success: true,
      format: 'dashboard',
      dashboard: dashboardData,
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalStories: stats.totalStories,
        dataCompleteness:
          (allStoriesAnalytics.filter(s => s.sessions > 0).length / allStoriesAnalytics.length) *
          100,
      },
    })
  } catch (error) {
    console.error('Error generating dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate dashboard',
      },
      { status: 500 }
    )
  }
}
