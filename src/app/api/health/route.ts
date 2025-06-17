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

    // Get comprehensive system health including analytics
    const [stories, stats] = await Promise.all([
      StoryService.getAllStories(),
      StoryService.getStoryStats(),
    ])

    // Supported languages (handled by Claude)
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
        schema: 'single-entry-with-analytics',
      },

      // Multilingual capabilities
      multilingual: {
        enabled: true,
        supportedLanguages: supportedLanguages.length,
        languages: supportedLanguages,
        languageNames,
        translationMethod: 'Claude AI real-time',
        note: 'All stories playable in all supported languages',
      },

      // System services
      services: {
        api: 'running',
        database: 'connected',
        ai: 'claude-3-5-haiku',
        translation: 'real-time',
        analytics: 'enabled',
      },

      // Analytics overview
      analytics: {
        totalSessions: stats.totalSessions,
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        totalCosts: `$${stats.totalCosts.toFixed(4)}`,
        averageSessionsPerStory: Math.round(stats.averageSessionsPerStory * 100) / 100,
        averageRequestsPerStory: Math.round(stats.averageRequestsPerStory * 100) / 100,
        averageCostPerSession:
          stats.totalSessions > 0
            ? `$${(stats.totalCosts / stats.totalSessions).toFixed(4)}`
            : '$0.0000',
        averageCostPerRequest:
          stats.totalRequests > 0
            ? `$${(stats.totalCosts / stats.totalRequests).toFixed(4)}`
            : '$0.0000',
      },

      // Stories overview
      content: {
        totalStories: stats.totalStories,
        averageContentLength:
          stories.length > 0
            ? Math.round(
                stories.reduce((sum, story) => sum + story.content.length, 0) / stories.length
              )
            : 0,
        availableStories: stories.map(story => ({
          slug: story.slug,
          title: story.title,
          playableInLanguages: supportedLanguages.length,
          sessions: story.sessions,
          requests: story.requests,
          tokens: story.tokens,
          costs: `$${story.costs.toFixed(4)}`,
        })),
      },

      // Performance metrics
      performance: {
        schemaVersion: 'analytics-enabled',
        storageMethod: 'single-entry-per-story',
        multilingualMethod: 'ai-translation',
        analyticsMethod: 'real-time-tracking',
        databaseComplexity: 'low',
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
