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
    const [stories, stats, availableLanguages] = await Promise.all([
      StoryService.getAllStories(),
      StoryService.getStoryStats(),
      StoryService.getAvailableLanguages(),
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
        schema: 'single-entry-with-json-homepage-display',
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
        })),
        sampleHomepageData,
      },

      // Performance metrics
      performance: {
        schemaVersion: 'single-entry-with-json',
        storageMethod: 'one-entry-per-story',
        homepageMethod: 'json-column-multilingual',
        storyContentMethod: 'claude-real-time-translation',
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
        },
      },
      { status: 500 }
    )
  }
}
