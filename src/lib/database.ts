// src/lib/database.ts - Single entry per story with JSON homepage_display
import { Pool } from 'pg'

// Create a singleton connection pool
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Neon
      },
      max: 10, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Handle pool errors
    pool.on('error', err => {
      console.error('Unexpected error on idle client', err)
    })
  }

  return pool
}

// Homepage display structure for multilingual titles and descriptions
export interface HomepageDisplay {
  [languageCode: string]: {
    title: string
    description: string
  }
}

// Story interface with single entry and JSON homepage_display
export interface Story {
  id: number
  slug: string
  title: string
  content: string
  homepage_display: HomepageDisplay
  created_at: Date
  updated_at: Date
  is_active: boolean
}

// Supported languages
export const SUPPORTED_LANGUAGES = [
  'en',
  'zh',
  'hi',
  'es',
  'fr',
  'ar',
  'bn',
  'ru',
  'pt',
  'ur',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// Database operations for stories
export class StoryService {
  /**
   * Get a story by slug (single entry, language handled by Claude)
   */
  static async getStory(slug: string): Promise<Story | null> {
    const pool = getPool()

    try {
      console.log(`🔍 Looking for story '${slug}'`)

      const query = 'SELECT * FROM stories WHERE slug = $1 AND is_active = true'
      const result = await pool.query(query, [slug])

      if (result.rows.length > 0) {
        console.log(`✅ Found story '${slug}'`)
        return result.rows[0] as Story
      }

      console.log(`❌ Story '${slug}' not found`)
      return null
    } catch (error) {
      console.error('Error fetching story:', error)
      throw new Error(`Failed to fetch story: ${slug}`)
    }
  }

  /**
   * Get all active stories
   */
  static async getAllStories(): Promise<Story[]> {
    const pool = getPool()

    try {
      const query = 'SELECT * FROM stories WHERE is_active = true ORDER BY created_at DESC'
      const result = await pool.query(query)

      console.log(`✅ Found ${result.rows.length} active stories`)
      return result.rows as Story[]
    } catch (error) {
      console.error('Error fetching all stories:', error)
      throw new Error('Failed to fetch stories')
    }
  }

  /**
   * Get stories with homepage display data for a specific language
   * Returns stories with title and description in the requested language
   */
  static async getStoriesForHomepage(language: string = 'fr'): Promise<
    Array<{
      slug: string
      title: string
      description: string
    }>
  > {
    const pool = getPool()

    try {
      const stories = await this.getAllStories()

      return stories.map(story => {
        // Try to get title and description in requested language
        const displayData = story.homepage_display[language]

        if (displayData) {
          return {
            slug: story.slug,
            title: displayData.title,
            description: displayData.description,
          }
        }

        // Fallback to English
        const englishData = story.homepage_display['en']
        if (englishData) {
          console.log(
            `⚠️ Using English fallback for story '${story.slug}' (requested: ${language})`
          )
          return {
            slug: story.slug,
            title: englishData.title,
            description: englishData.description,
          }
        }

        // Ultimate fallback to French
        const frenchData = story.homepage_display['fr']
        if (frenchData) {
          console.log(`⚠️ Using French fallback for story '${story.slug}' (requested: ${language})`)
          return {
            slug: story.slug,
            title: frenchData.title,
            description: frenchData.description,
          }
        }

        // Last resort: use the default title and a generic description
        console.log(`⚠️ Using default fallback for story '${story.slug}' (requested: ${language})`)
        return {
          slug: story.slug,
          title: story.title,
          description: 'Adventure awaits!',
        }
      })
    } catch (error) {
      console.error('Error fetching stories for homepage:', error)
      throw new Error(`Failed to fetch stories for language: ${language}`)
    }
  }

  /**
   * Create or update a story
   */
  static async upsertStory(
    storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Story> {
    const pool = getPool()

    try {
      const query = `
        INSERT INTO stories (slug, title, content, homepage_display, is_active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (slug) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          homepage_display = EXCLUDED.homepage_display,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *
      `

      const result = await pool.query(query, [
        storyData.slug,
        storyData.title,
        storyData.content,
        JSON.stringify(storyData.homepage_display),
        storyData.is_active,
      ])

      console.log(`✅ Upserted story: ${storyData.slug}`)
      return result.rows[0] as Story
    } catch (error) {
      console.error('Error upserting story:', error)
      throw new Error(`Failed to save story: ${storyData.slug}`)
    }
  }

  /**
   * Update only the homepage display data for a story
   */
  static async updateHomepageDisplay(
    slug: string,
    homepageDisplay: HomepageDisplay
  ): Promise<boolean> {
    const pool = getPool()

    try {
      const query = `
        UPDATE stories 
        SET homepage_display = $1, updated_at = NOW() 
        WHERE slug = $2 AND is_active = true
      `

      const result = await pool.query(query, [JSON.stringify(homepageDisplay), slug])

      const success = result.rowCount! > 0
      if (success) {
        console.log(`✅ Updated homepage display for story: ${slug}`)
      } else {
        console.log(`❌ Story not found: ${slug}`)
      }

      return success
    } catch (error) {
      console.error('Error updating homepage display:', error)
      throw new Error(`Failed to update homepage display for story: ${slug}`)
    }
  }

  /**
   * Delete a story (soft delete by setting is_active = false)
   */
  static async deleteStory(slug: string): Promise<boolean> {
    const pool = getPool()

    try {
      const query = 'UPDATE stories SET is_active = false, updated_at = NOW() WHERE slug = $1'
      const result = await pool.query(query, [slug])

      const success = result.rowCount! > 0
      if (success) {
        console.log(`✅ Deleted story: ${slug}`)
      } else {
        console.log(`❌ Story not found: ${slug}`)
      }

      return success
    } catch (error) {
      console.error('Error deleting story:', error)
      throw new Error(`Failed to delete story: ${slug}`)
    }
  }

  /**
   * Get story statistics
   */
  static async getStoryStats(): Promise<{
    totalStories: number
    oldestStory: string | null
    newestStory: string | null
    languagesSupported: number
  }> {
    const pool = getPool()

    try {
      // Total active stories
      const totalResult = await pool.query(
        'SELECT COUNT(*) as count FROM stories WHERE is_active = true'
      )
      const totalStories = parseInt(totalResult.rows[0].count)

      // Oldest and newest stories
      const oldestResult = await pool.query(
        'SELECT slug FROM stories WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
      )
      const newestResult = await pool.query(
        'SELECT slug FROM stories WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
      )

      return {
        totalStories,
        oldestStory: oldestResult.rows[0]?.slug || null,
        newestStory: newestResult.rows[0]?.slug || null,
        languagesSupported: SUPPORTED_LANGUAGES.length,
      }
    } catch (error) {
      console.error('Error fetching story stats:', error)
      throw new Error('Failed to fetch story statistics')
    }
  }

  /**
   * Search stories by title or content
   */
  static async searchStories(searchTerm: string): Promise<Story[]> {
    const pool = getPool()

    try {
      const query = `
        SELECT * FROM stories 
        WHERE is_active = true 
        AND (title ILIKE $1 OR content ILIKE $1 OR homepage_display::text ILIKE $1)
        ORDER BY created_at DESC
      `
      const result = await pool.query(query, [`%${searchTerm}%`])

      console.log(`✅ Found ${result.rows.length} stories matching "${searchTerm}"`)
      return result.rows as Story[]
    } catch (error) {
      console.error('Error searching stories:', error)
      throw new Error(`Failed to search stories: ${searchTerm}`)
    }
  }

  /**
   * Get available languages for homepage display across all stories
   */
  static async getAvailableLanguages(): Promise<string[]> {
    const pool = getPool()

    try {
      const query = `
        SELECT DISTINCT jsonb_object_keys(homepage_display) as language 
        FROM stories 
        WHERE is_active = true
      `
      const result = await pool.query(query)

      return result.rows.map(row => row.language).sort()
    } catch (error) {
      console.error('Error fetching available languages:', error)
      throw new Error('Failed to fetch available languages')
    }
  }

  /**
   * Check if database connection is healthy
   */
  static async healthCheck(): Promise<boolean> {
    const pool = getPool()

    try {
      const result = await pool.query('SELECT NOW()')
      return result.rows.length > 0
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

// Cleanup function for graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
