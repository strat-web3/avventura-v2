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

// Story interface with single entry, JSON homepage_display, owner, and analytics
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
  // Analytics columns
  sessions: number
  requests: number
  tokens: number
  costs: number // in USD
}

// Analytics-specific interfaces
export interface StoryStats {
  totalStories: number
  oldestStory: string | null
  newestStory: string | null
  languagesSupported: number
  storiesWithOwners: number
  uniqueOwners: number
  // Analytics totals
  totalSessions: number
  totalRequests: number
  totalTokens: number
  totalCosts: number
  averageSessionsPerStory: number
  averageRequestsPerStory: number
}

export interface StoryAnalytics {
  storySlug: string
  sessions: number
  requests: number
  tokens: number
  costs: number
  costPerSession: number
  costPerRequest: number
  tokensPerRequest: number
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

      const query = `
        SELECT id, slug, title, content, homepage_display, owner, created_at, updated_at, is_active,
               sessions, requests, tokens, costs
        FROM stories 
        WHERE slug = $1 AND is_active = true
      `
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
      const query = `
        SELECT id, slug, title, content, homepage_display, owner, created_at, updated_at, is_active,
               sessions, requests, tokens, costs
        FROM stories 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `
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
      const query = `
        SELECT id, slug, title, content, homepage_display, owner, created_at, updated_at, is_active,
               sessions, requests, tokens, costs
        FROM stories 
        WHERE owner = $1 AND is_active = true 
        ORDER BY created_at DESC
      `
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
    storyData: Omit<
      Story,
      'id' | 'created_at' | 'updated_at' | 'sessions' | 'requests' | 'tokens' | 'costs'
    >,
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
        INSERT INTO stories (slug, title, content, homepage_display, owner, is_active, sessions, requests, tokens, costs)
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 0.0000)
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

  // ========================================
  // ANALYTICS METHODS
  // ========================================

  /**
   * Increment session count when a user starts a new story session
   */
  static async incrementSessions(slug: string): Promise<void> {
    const pool = getPool()

    try {
      const query = `
        UPDATE stories 
        SET sessions = sessions + 1, updated_at = NOW()
        WHERE slug = $1 AND is_active = true
      `

      await pool.query(query, [slug])
      console.log(`📊 Incremented sessions for story: ${slug}`)
    } catch (error) {
      console.error('Error incrementing sessions:', error)
      throw new Error(`Failed to increment sessions for story: ${slug}`)
    }
  }

  /**
   * Increment request count and update token/cost analytics
   */
  static async incrementRequests(
    slug: string,
    tokenCount: number = 0,
    cost: number = 0
  ): Promise<void> {
    const pool = getPool()

    try {
      const query = `
        UPDATE stories 
        SET requests = requests + 1, 
            tokens = tokens + $2, 
            costs = costs + $3,
            updated_at = NOW()
        WHERE slug = $1 AND is_active = true
      `

      await pool.query(query, [slug, tokenCount, cost])
      console.log(
        `📊 Updated analytics for story ${slug}: +1 request, +${tokenCount} tokens, +$${cost.toFixed(4)}`
      )
    } catch (error) {
      console.error('Error incrementing requests:', error)
      throw new Error(`Failed to increment requests for story: ${slug}`)
    }
  }

  /**
   * Get detailed analytics for a specific story
   */
  static async getStoryAnalytics(slug: string): Promise<StoryAnalytics | null> {
    const pool = getPool()

    try {
      const query = `
        SELECT slug, sessions, requests, tokens, costs,
               CASE WHEN sessions > 0 THEN costs / sessions ELSE 0 END as cost_per_session,
               CASE WHEN requests > 0 THEN costs / requests ELSE 0 END as cost_per_request,
               CASE WHEN requests > 0 THEN tokens / requests ELSE 0 END as tokens_per_request
        FROM stories 
        WHERE slug = $1 AND is_active = true
      `

      const result = await pool.query(query, [slug])
      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        storySlug: row.slug,
        sessions: row.sessions,
        requests: row.requests,
        tokens: row.tokens,
        costs: parseFloat(row.costs),
        costPerSession: parseFloat(row.cost_per_session),
        costPerRequest: parseFloat(row.cost_per_request),
        tokensPerRequest: parseFloat(row.tokens_per_request),
      }
    } catch (error) {
      console.error('Error fetching story analytics:', error)
      throw new Error(`Failed to fetch analytics for story: ${slug}`)
    }
  }

  /**
   * Get analytics for all stories
   */
  static async getAllStoriesAnalytics(): Promise<StoryAnalytics[]> {
    const pool = getPool()

    try {
      const query = `
        SELECT slug, sessions, requests, tokens, costs,
               CASE WHEN sessions > 0 THEN costs / sessions ELSE 0 END as cost_per_session,
               CASE WHEN requests > 0 THEN costs / requests ELSE 0 END as cost_per_request,
               CASE WHEN requests > 0 THEN tokens / requests ELSE 0 END as tokens_per_request
        FROM stories 
        WHERE is_active = true 
        ORDER BY requests DESC
      `

      const result = await pool.query(query)
      return result.rows.map(row => ({
        storySlug: row.slug,
        sessions: row.sessions,
        requests: row.requests,
        tokens: row.tokens,
        costs: parseFloat(row.costs),
        costPerSession: parseFloat(row.cost_per_session),
        costPerRequest: parseFloat(row.cost_per_request),
        tokensPerRequest: parseFloat(row.tokens_per_request),
      }))
    } catch (error) {
      console.error('Error fetching all stories analytics:', error)
      throw new Error('Failed to fetch analytics for all stories')
    }
  }

  /**
   * Calculate Claude API costs based on tokens and model
   */
  static calculateClaudeCost(inputTokens: number, outputTokens: number, model: string): number {
    // Claude pricing (as of 2024)
    const pricing = {
      'claude-3-5-haiku-20241022': {
        input: 0.00025, // $0.25 per 1K input tokens
        output: 0.00125, // $1.25 per 1K output tokens
      },
      'claude-sonnet-4-20250514': {
        input: 0.003, // $3.00 per 1K input tokens
        output: 0.015, // $15.00 per 1K output tokens
      },
    }

    const modelPricing =
      pricing[model as keyof typeof pricing] || pricing['claude-3-5-haiku-20241022']

    const inputCost = (inputTokens / 1000) * modelPricing.input
    const outputCost = (outputTokens / 1000) * modelPricing.output

    return inputCost + outputCost
  }

  // ========================================
  // ENHANCED STATS WITH ANALYTICS
  // ========================================

  /**
   * Get comprehensive story statistics including analytics
   */
  static async getStoryStats(): Promise<StoryStats> {
    const pool = getPool()

    try {
      // Get comprehensive stats including analytics
      const query = `
        SELECT 
          COUNT(*) as total_stories,
          MIN(created_at) as oldest_story,
          MAX(created_at) as newest_story,
          COUNT(CASE WHEN owner IS NOT NULL THEN 1 END) as stories_with_owners,
          COUNT(DISTINCT owner) FILTER (WHERE owner IS NOT NULL) as unique_owners,
          SUM(sessions) as total_sessions,
          SUM(requests) as total_requests,
          SUM(tokens) as total_tokens,
          SUM(costs) as total_costs,
          CASE WHEN COUNT(*) > 0 THEN AVG(sessions) ELSE 0 END as avg_sessions_per_story,
          CASE WHEN COUNT(*) > 0 THEN AVG(requests) ELSE 0 END as avg_requests_per_story
        FROM stories 
        WHERE is_active = true
      `

      const result = await pool.query(query)
      const row = result.rows[0]

      return {
        totalStories: parseInt(row.total_stories),
        oldestStory: row.oldest_story,
        newestStory: row.newest_story,
        languagesSupported: SUPPORTED_LANGUAGES.length,
        storiesWithOwners: parseInt(row.stories_with_owners),
        uniqueOwners: parseInt(row.unique_owners),
        totalSessions: parseInt(row.total_sessions) || 0,
        totalRequests: parseInt(row.total_requests) || 0,
        totalTokens: parseInt(row.total_tokens) || 0,
        totalCosts: parseFloat(row.total_costs) || 0,
        averageSessionsPerStory: parseFloat(row.avg_sessions_per_story) || 0,
        averageRequestsPerStory: parseFloat(row.avg_requests_per_story) || 0,
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
        SELECT id, slug, title, content, homepage_display, owner, created_at, updated_at, is_active,
               sessions, requests, tokens, costs
        FROM stories 
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
   * Get ownership statistics with analytics
   */
  static async getOwnershipStats(ownerAddress: string): Promise<{
    totalStories: number
    latestStory: string | null
    oldestStory: string | null
    totalLanguages: number
    totalSessions: number
    totalRequests: number
    totalTokens: number
    totalCosts: number
  }> {
    const pool = getPool()

    try {
      // Get comprehensive ownership stats including analytics
      const query = `
        SELECT 
          COUNT(*) as total_stories,
          MIN(created_at) as oldest_created,
          MAX(created_at) as latest_created,
          SUM(sessions) as total_sessions,
          SUM(requests) as total_requests,
          SUM(tokens) as total_tokens,
          SUM(costs) as total_costs
        FROM stories 
        WHERE owner = $1 AND is_active = true
      `

      const result = await pool.query(query, [ownerAddress])
      const stats = result.rows[0]

      // Get latest and oldest story slugs
      const latestResult = await pool.query(
        'SELECT slug FROM stories WHERE owner = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
        [ownerAddress]
      )
      const oldestResult = await pool.query(
        'SELECT slug FROM stories WHERE owner = $1 AND is_active = true ORDER BY created_at ASC LIMIT 1',
        [ownerAddress]
      )

      // Count unique languages
      const languagesResult = await pool.query(
        `SELECT DISTINCT jsonb_object_keys(homepage_display) as language 
         FROM stories 
         WHERE owner = $1 AND is_active = true`,
        [ownerAddress]
      )

      return {
        totalStories: parseInt(stats.total_stories),
        latestStory: latestResult.rows[0]?.slug || null,
        oldestStory: oldestResult.rows[0]?.slug || null,
        totalLanguages: languagesResult.rows.length,
        totalSessions: parseInt(stats.total_sessions) || 0,
        totalRequests: parseInt(stats.total_requests) || 0,
        totalTokens: parseInt(stats.total_tokens) || 0,
        totalCosts: parseFloat(stats.total_costs) || 0,
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
