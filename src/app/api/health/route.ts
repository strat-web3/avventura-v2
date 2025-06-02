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

    // Get comprehensive system health
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
        })),
      },

      // Performance metrics
      performance: {
        schemaVersion: 'simplified',
        storageMethod: 'single-entry-per-story',
        multilingualMethod: 'ai-translation',
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
        },
      },
      { status: 500 }
    )
  }
}
