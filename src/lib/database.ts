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

// Story interface with single entry, JSON homepage_display, and owner
export interface Story {
  id: number
  slug: string
  title: string
  content: string
  homepage_display: HomepageDisplay
  owner?: string // Ethereum address
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

/**
 * Fills in missing language translations with English content as fallback
 * @param homepageDisplay - The current homepage display object
 * @returns Enhanced homepage display with English fallbacks for missing languages
 */
function fillLanguageFallbacks(homepageDisplay: HomepageDisplay): HomepageDisplay {
  // Get English content as the source for fallbacks
  const englishContent = homepageDisplay['en']

  if (!englishContent || !englishContent.title || !englishContent.description) {
    console.warn('⚠️ No English content found for fallback. Skipping automatic language fill.')
    return homepageDisplay
  }

  console.log('🌍 English content found, filling missing language translations...')

  // Create a copy of the original homepage_display
  const enhancedDisplay: HomepageDisplay = { ...homepageDisplay }

  // Fill missing languages with English content
  SUPPORTED_LANGUAGES.forEach(lang => {
    if (
      !enhancedDisplay[lang] ||
      !enhancedDisplay[lang].title ||
      !enhancedDisplay[lang].description
    ) {
      enhancedDisplay[lang] = {
        title: englishContent.title,
        description: englishContent.description,
      }
      console.log(`  ✅ Added English fallback for language: ${lang}`)
    } else {
      console.log(`  ℹ️ Language ${lang} already has content, keeping existing`)
    }
  })

  const addedLanguages = SUPPORTED_LANGUAGES.filter(
    lang =>
      !homepageDisplay[lang] || !homepageDisplay[lang].title || !homepageDisplay[lang].description
  ).length

  console.log(
    `🎯 Language fallback complete: ${addedLanguages} languages filled with English content`
  )

  return enhancedDisplay
}

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
        console.log(`✅ Found story '${slug}' owned by: ${result.rows[0].owner || 'unknown'}`)
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
   * Get stories owned by a specific address
   */
  static async getStoriesByOwner(ownerAddress: string): Promise<Story[]> {
    const pool = getPool()

    try {
      const query =
        'SELECT * FROM stories WHERE owner = $1 AND is_active = true ORDER BY created_at DESC'
      const result = await pool.query(query, [ownerAddress])

      console.log(`✅ Found ${result.rows.length} stories for owner: ${ownerAddress}`)
      return result.rows as Story[]
    } catch (error) {
      console.error('Error fetching stories by owner:', error)
      throw new Error(`Failed to fetch stories for owner: ${ownerAddress}`)
    }
  }

  /**
   * Check if user owns a specific story
   */
  static async isStoryOwner(slug: string, ownerAddress: string): Promise<boolean> {
    const pool = getPool()

    try {
      const query = 'SELECT owner FROM stories WHERE slug = $1 AND is_active = true'
      const result = await pool.query(query, [slug])

      if (result.rows.length === 0) {
        return false
      }

      const storyOwner = result.rows[0].owner
      return storyOwner === ownerAddress
    } catch (error) {
      console.error('Error checking story ownership:', error)
      return false
    }
  }

  /**
   * Get stories with homepage display data for a specific language
   * Returns stories with title and description in the requested language
   * Falls back to English if the requested language is not available
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

        if (displayData && displayData.title && displayData.description) {
          return {
            slug: story.slug,
            title: displayData.title,
            description: displayData.description,
          }
        }

        // Fallback to English (always use English if available)
        const englishData = story.homepage_display['en']
        if (englishData && englishData.title && englishData.description) {
          console.log(
            `⚠️ Using English fallback for story '${story.slug}' (requested: ${language})`
          )
          return {
            slug: story.slug,
            title: englishData.title,
            description: englishData.description,
          }
        }

        // Ultimate fallback: use the default title and a generic description
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
   * Create or update a story with owner
   * Automatically fills missing language translations with English content
   */
  static async upsertStory(
    storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>,
    ownerAddress?: string
  ): Promise<Story> {
    const pool = getPool()

    try {
      console.log(`📝 Upserting story: ${storyData.slug} for owner: ${ownerAddress}`)

      // Check if story exists and verify ownership for updates
      const existingStory = await this.getStory(storyData.slug)
      if (existingStory && existingStory.owner && existingStory.owner !== ownerAddress) {
        throw new Error('You can only edit stories that you own.')
      }

      // Enhance homepage_display with English fallbacks for missing languages
      const enhancedHomepageDisplay = fillLanguageFallbacks(storyData.homepage_display)

      const query = `
        INSERT INTO stories (slug, title, content, homepage_display, owner, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          homepage_display = EXCLUDED.homepage_display,
          owner = EXCLUDED.owner,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *
      `

      const result = await pool.query(query, [
        storyData.slug,
        storyData.title,
        storyData.content,
        JSON.stringify(enhancedHomepageDisplay),
        ownerAddress || null,
        storyData.is_active,
      ])

      console.log(
        `✅ Upserted story: ${storyData.slug} with ${Object.keys(enhancedHomepageDisplay).length} languages for owner: ${ownerAddress}`
      )
      return result.rows[0] as Story
    } catch (error) {
      console.error('Error upserting story:', error)
      throw new Error(`Failed to save story: ${storyData.slug}`)
    }
  }

  /**
   * Update only the homepage display data for a story
   * Automatically fills missing language translations with English content
   * Includes ownership check
   */
  static async updateHomepageDisplay(
    slug: string,
    homepageDisplay: HomepageDisplay,
    ownerAddress?: string
  ): Promise<boolean> {
    const pool = getPool()

    try {
      console.log(`📝 Updating homepage display for: ${slug} by owner: ${ownerAddress}`)

      // Check ownership if owner address is provided
      if (ownerAddress) {
        const isOwner = await this.isStoryOwner(slug, ownerAddress)
        if (!isOwner) {
          throw new Error('You can only update stories that you own.')
        }
      }

      // Enhance homepage_display with English fallbacks for missing languages
      const enhancedHomepageDisplay = fillLanguageFallbacks(homepageDisplay)

      const query = `
        UPDATE stories 
        SET homepage_display = $1, updated_at = NOW() 
        WHERE slug = $2 AND is_active = true
      `

      const result = await pool.query(query, [JSON.stringify(enhancedHomepageDisplay), slug])

      const success = result.rowCount! > 0
      if (success) {
        console.log(
          `✅ Updated homepage display for story: ${slug} with ${Object.keys(enhancedHomepageDisplay).length} languages`
        )
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
   * Includes ownership check
   */
  static async deleteStory(slug: string, ownerAddress?: string): Promise<boolean> {
    const pool = getPool()

    try {
      console.log(`🗑️ Deleting story: ${slug} by owner: ${ownerAddress}`)

      // Check ownership if owner address is provided
      if (ownerAddress) {
        const isOwner = await this.isStoryOwner(slug, ownerAddress)
        if (!isOwner) {
          throw new Error('You can only delete stories that you own.')
        }
      }

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
    storiesWithOwners: number
    uniqueOwners: number
  }> {
    const pool = getPool()

    try {
      // Total active stories
      const totalResult = await pool.query(
        'SELECT COUNT(*) as count FROM stories WHERE is_active = true'
      )
      const totalStories = parseInt(totalResult.rows[0].count)

      // Stories with owners
      const ownedResult = await pool.query(
        'SELECT COUNT(*) as count FROM stories WHERE is_active = true AND owner IS NOT NULL'
      )
      const storiesWithOwners = parseInt(ownedResult.rows[0].count)

      // Unique owners
      const uniqueOwnersResult = await pool.query(
        'SELECT COUNT(DISTINCT owner) as count FROM stories WHERE is_active = true AND owner IS NOT NULL'
      )
      const uniqueOwners = parseInt(uniqueOwnersResult.rows[0].count)

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
        storiesWithOwners,
        uniqueOwners,
      }
    } catch (error) {
      console.error('Error fetching story stats:', error)
      throw new Error('Failed to fetch story statistics')
    }
  }

  /**
   * Search stories by title or content
   * Optionally filter by owner
   */
  static async searchStories(searchTerm: string, ownerAddress?: string): Promise<Story[]> {
    const pool = getPool()

    try {
      let query = `
        SELECT * FROM stories 
        WHERE is_active = true 
        AND (title ILIKE $1 OR content ILIKE $1 OR homepage_display::text ILIKE $1)
      `
      const params = [`%${searchTerm}%`]

      if (ownerAddress) {
        query += ' AND owner = $2'
        params.push(ownerAddress)
      }

      query += ' ORDER BY created_at DESC'

      const result = await pool.query(query, params)

      console.log(
        `✅ Found ${result.rows.length} stories matching "${searchTerm}"${ownerAddress ? ` for owner ${ownerAddress}` : ''}`
      )
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
   * Get ownership statistics
   */
  static async getOwnershipStats(ownerAddress: string): Promise<{
    totalStories: number
    latestStory: string | null
    oldestStory: string | null
    totalLanguages: number
  }> {
    const pool = getPool()

    try {
      // Total stories by owner
      const totalResult = await pool.query(
        'SELECT COUNT(*) as count FROM stories WHERE owner = $1 AND is_active = true',
        [ownerAddress]
      )
      const totalStories = parseInt(totalResult.rows[0].count)

      // Latest and oldest stories by owner
      const latestResult = await pool.query(
        'SELECT slug FROM stories WHERE owner = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
        [ownerAddress]
      )
      const oldestResult = await pool.query(
        'SELECT slug FROM stories WHERE owner = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1',
        [ownerAddress]
      )

      // Count unique languages across all stories by owner
      const languagesResult = await pool.query(
        `SELECT DISTINCT jsonb_object_keys(homepage_display) as language 
         FROM stories 
         WHERE owner = $1 AND is_active = true`,
        [ownerAddress]
      )
      const totalLanguages = languagesResult.rows.length

      return {
        totalStories,
        latestStory: latestResult.rows[0]?.slug || null,
        oldestStory: oldestResult.rows[0]?.slug || null,
        totalLanguages,
      }
    } catch (error) {
      console.error('Error fetching ownership stats:', error)
      throw new Error(`Failed to fetch ownership stats for: ${ownerAddress}`)
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
