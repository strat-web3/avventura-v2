import { NextRequest, NextResponse } from 'next/server'
import { StoryService, Story, HomepageDisplay } from '@/lib/database'

// Mark as dynamic to prevent static generation issues
export const dynamic = 'force-dynamic'

// GET /api/admin/stories - List stories (optionally filtered by owner or search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const owner = searchParams.get('owner') || undefined

    let stories: Story[]

    if (owner) {
      // Get stories by specific owner
      stories = await StoryService.getStoriesByOwner(owner)
      console.log(`📚 Retrieved ${stories.length} stories for owner: ${owner}`)
    } else if (search) {
      stories = await StoryService.searchStories(search)
      console.log(`🔍 Search results for "${search}": ${stories.length} stories`)
    } else {
      stories = await StoryService.getAllStories()
      console.log(`📚 Retrieved all stories: ${stories.length} total`)
    }

    return NextResponse.json({
      success: true,
      stories,
      count: stories.length,
      schema: 'single-entry-with-json-and-owner',
      message: owner
        ? `Found ${stories.length} stories owned by ${owner}`
        : search
          ? `Found ${stories.length} stories matching "${search}"`
          : `Retrieved ${stories.length} stories`,
    })
  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stories',
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/stories - Create or update a story with owner check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, title, content, homepage_display, owner } = body

    if (!slug || !title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: slug, title, content',
        },
        { status: 400 }
      )
    }

    // Validate owner address format (basic Ethereum address validation)
    if (owner && !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid owner address format. Must be a valid Ethereum address.',
        },
        { status: 400 }
      )
    }

    // Validate slug format (letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.',
        },
        { status: 400 }
      )
    }

    // Check if story exists and verify ownership for updates
    const existingStory = await StoryService.getStory(slug)
    if (existingStory && existingStory.owner && existingStory.owner !== owner) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only edit stories that you own.',
        },
        { status: 403 }
      )
    }

    // Validate homepage_display if provided
    if (homepage_display) {
      if (typeof homepage_display !== 'object') {
        return NextResponse.json(
          {
            success: false,
            error: 'homepage_display must be an object with language codes as keys',
          },
          { status: 400 }
        )
      }

      // Check that each language entry has title and description
      for (const [lang, data] of Object.entries(homepage_display)) {
        const typedData = data as any
        if (
          !typedData ||
          typeof typedData !== 'object' ||
          !typedData.title ||
          !typedData.description
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid homepage_display entry for language "${lang}". Must have title and description.`,
            },
            { status: 400 }
          )
        }
      }
    }

    const story = await StoryService.upsertStory(
      {
        slug,
        title,
        content,
        homepage_display: homepage_display || {},
        owner,
        is_active: true,
      },
      owner
    )

    console.log(`✅ Story saved: ${story.title} (${story.slug}) by owner: ${story.owner}`)

    return NextResponse.json({
      success: true,
      story,
      message: `Story '${story.title}' saved successfully`,
      availableLanguages: Object.keys(story.homepage_display),
    })
  } catch (error) {
    console.error('Error saving story:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save story',
      },
      { status: 500 }
    )
  }
}
