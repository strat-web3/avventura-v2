import { NextResponse } from 'next/server'
import { StoryService } from '@/lib/database'

export async function GET() {
  try {
    const isDbHealthy = await StoryService.healthCheck()

    if (!isDbHealthy) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: 'Database connection failed',
        },
        { status: 503 }
      )
    }

    // Get comprehensive system health and analytics
    const [stories, stats, availableLanguages, allAnalytics] = await Promise.all([
      StoryService.getAllStories(),
      StoryService.getStoryStats(),
      StoryService.getAvailableLanguages(),
      StoryService.getAllStoriesAnalytics(),
    ])

    // Supported languages (handled by Claude + homepage display)
    const supportedLanguages = ['en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur']

    const languageNames = {
      en: 'English',
      zh: '中文 (Chinese)',
      hi: 'हिन्दी (Hindi)',
      es: 'Español (Spanish)',
      fr: 'Français (French)',
      ar: 'العربية (Arabic)',
      bn: 'বাংলা (Bengali)',
      ru: 'Русский (Russian)',
      pt: 'Português (Portuguese)',
      ur: 'اردو (Urdu)',
    }

    // Calculate additional analytics
    const totalTokens = allAnalytics.reduce((sum, story) => sum + story.tokens, 0)
    const totalCosts = allAnalytics.reduce((sum, story) => sum + story.costs, 0)
    const totalSessions = allAnalytics.reduce((sum, story) => sum + story.sessions, 0)
    const totalRequests = allAnalytics.reduce((sum, story) => sum + story.requests, 0)

    // Sample homepage data
    const sampleHomepageData =
      stories.length > 0
        ? {
            storySlug: stories[0].slug,
            availableLanguages: Object.keys(stories[0].homepage_display),
            sampleTitles: Object.entries(stories[0].homepage_display)
              .slice(0, 3)
              .reduce(
                (acc, [lang, data]) => {
                  acc[lang] = data.title
                  return acc
                },
                {} as Record<string, string>
              ),
          }
        : null

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',

      // Database health
      database: {
        connected: true,
        storiesCount: stats.totalStories,
        oldestStory: stats.oldestStory,
        newestStory: stats.newestStory,
        schema: 'single-entry-with-json-homepage-display-and-analytics',
      },

      // Multilingual capabilities
      multilingual: {
        enabled: true,
        homepageLanguages: availableLanguages.length,
        supportedLanguages: supportedLanguages.length,
        languages: supportedLanguages,
        languageNames,
        homepageMethod: 'json-column',
        storyContentMethod: 'claude-real-time-translation',
        note: 'Homepage titles/descriptions stored in JSON, story content translated by Claude',
      },

      // System services
      services: {
        api: 'running',
        database: 'connected',
        ai: 'claude-3-5-haiku',
        translation: 'hybrid (json + real-time)',
        analytics: 'real-time-tracking',
      },

      // Comprehensive Analytics
      analytics: {
        overview: {
          totalSessions: stats.totalSessions,
          totalRequests: stats.totalRequests,
          totalTokens: stats.totalTokens,
          totalCosts: stats.totalCosts,
          averageSessionsPerStory: Math.round(stats.averageSessionsPerStory * 100) / 100,
          averageRequestsPerStory: Math.round(stats.averageRequestsPerStory * 100) / 100,
          averageCostPerSession:
            totalSessions > 0 ? Math.round((totalCosts / totalSessions) * 10000) / 10000 : 0,
          averageCostPerRequest:
            totalRequests > 0 ? Math.round((totalCosts / totalRequests) * 10000) / 10000 : 0,
          averageTokensPerRequest:
            totalRequests > 0 ? Math.round((totalTokens / totalRequests) * 100) / 100 : 0,
        },
        topStories: {
          mostPopular: allAnalytics
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 3)
            .map(s => ({
              slug: s.storySlug,
              sessions: s.sessions,
              requests: s.requests,
            })),
          mostRequests: allAnalytics
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 3)
            .map(s => ({
              slug: s.storySlug,
              requests: s.requests,
              tokens: s.tokens,
            })),
          mostExpensive: allAnalytics
            .sort((a, b) => b.costs - a.costs)
            .slice(0, 3)
            .map(s => ({
              slug: s.storySlug,
              costs: Math.round(s.costs * 10000) / 10000,
              requests: s.requests,
            })),
        },
        costBreakdown: {
          formatted: `$${totalCosts.toFixed(4)}`,
          perStory: stories.length > 0 ? `$${(totalCosts / stories.length).toFixed(4)}` : '$0.0000',
          perSession: totalSessions > 0 ? `$${(totalCosts / totalSessions).toFixed(4)}` : '$0.0000',
          perRequest: totalRequests > 0 ? `$${(totalCosts / totalRequests).toFixed(4)}` : '$0.0000',
        },
      },

      // Stories overview
      content: {
        totalStories: stats.totalStories,
        languagesSupported: stats.languagesSupported,
        averageContentLength:
          stories.length > 0
            ? Math.round(
                stories.reduce((sum, story) => sum + story.content.length, 0) / stories.length
              )
            : 0,
        availableStories: stories.map(story => ({
          slug: story.slug,
          title: story.title,
          homepageLanguages: Object.keys(story.homepage_display).length,
          sessions: story.sessions,
          requests: story.requests,
          tokens: story.tokens,
          costs: Math.round(story.costs * 10000) / 10000,
        })),
        sampleHomepageData,
      },

      // Performance metrics
      performance: {
        schemaVersion: 'single-entry-with-json-and-analytics',
        storageMethod: 'one-entry-per-story',
        homepageMethod: 'json-column-multilingual',
        storyContentMethod: 'claude-real-time-translation',
        analyticsMethod: 'real-time-database-tracking',
        databaseComplexity: 'low',
        queryPerformance: 'optimized-with-gin-index',
      },
    })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          api: 'running',
          database: 'error',
          ai: 'unknown',
          translation: 'unavailable',
          analytics: 'unavailable',
        },
      },
      { status: 500 }
    )
  }
}
