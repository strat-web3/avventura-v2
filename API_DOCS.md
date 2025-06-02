# Admin API Routes Documentation

This section documents all the administrative API routes available in Avventura v2 for managing stories, monitoring system health, and performing database operations.

## Overview

The admin API provides endpoints for:

- Story management (CRUD operations)
- Database health monitoring
- Bulk operations
- Homepage content management
- System statistics

All admin routes are prefixed with `/api/admin/` or `/api/` for general endpoints.

---

## Health & System Monitoring

### GET /api/health

**Description:** System health check with comprehensive status information.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-06-02T19:17:14.000Z",
  "version": "2.0.0",
  "database": {
    "connected": true,
    "storiesCount": 5,
    "oldestStory": "montpellier",
    "newestStory": "sailing"
  },
  "multilingual": {
    "enabled": true,
    "supportedLanguages": 10,
    "languages": ["en", "zh", "hi", "es", "fr", "ar", "bn", "ru", "pt", "ur"],
    "languageNames": {
      "en": "English",
      "fr": "Français",
      "..."
    },
    "translationMethod": "Claude AI real-time"
  },
  "services": {
    "api": "running",
    "database": "connected",
    "ai": "claude-3-5-haiku",
    "translation": "real-time"
  },
  "content": {
    "totalStories": 5,
    "averageContentLength": 12450,
    "availableStories": [
      {
        "slug": "sailing",
        "title": "Ocean's Promise",
        "playableInLanguages": 10
      }
    ]
  }
}
```

### GET /api/admin/stories/stats

**Description:** Detailed system statistics and health metrics.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-06-02T19:17:14.000Z",
  "version": "2.0.0",
  "database": {
    "connected": true,
    "storiesCount": 5,
    "oldestStory": "montpellier",
    "newestStory": "sailing",
    "schema": "single-entry-with-json-homepage-display"
  },
  "multilingual": {
    "enabled": true,
    "homepageLanguages": 10,
    "supportedLanguages": 10,
    "languages": ["en", "zh", "hi", "es", "fr", "ar", "bn", "ru", "pt", "ur"],
    "homepageMethod": "json-column",
    "storyContentMethod": "claude-real-time-translation"
  },
  "content": {
    "totalStories": 5,
    "languagesSupported": 10,
    "averageContentLength": 12450,
    "availableStories": [...],
    "sampleHomepageData": {
      "storySlug": "sailing",
      "availableLanguages": ["en", "fr", "zh", "..."],
      "sampleTitles": {
        "en": "Ocean's Promise",
        "fr": "La Promesse de l'Océan",
        "zh": "海洋之约"
      }
    }
  },
  "performance": {
    "schemaVersion": "single-entry-with-json",
    "storageMethod": "one-entry-per-story",
    "homepageMethod": "json-column-multilingual",
    "storyContentMethod": "claude-real-time-translation",
    "databaseComplexity": "low",
    "queryPerformance": "optimized-with-gin-index"
  }
}
```

---

## Story Management

### GET /api/admin/stories

**Description:** List all stories with optional search functionality.

**Query Parameters:**

- `search` (optional): Search term to filter stories by title, content, or homepage display data

**Examples:**

```bash
# Get all stories
GET /api/admin/stories

# Search stories
GET /api/admin/stories?search=medieval
```

**Response:**

```json
{
  "success": true,
  "stories": [
    {
      "id": 1,
      "slug": "montpellier",
      "title": "Medieval Montpellier",
      "content": "# Montpellier Médiéval\n\n## Setting\n...",
      "homepage_display": {
        "fr": {
          "title": "Montpellier Médiéval",
          "description": "Explorez la vie médiévale à Montpellier au 10ème siècle!"
        },
        "en": {
          "title": "Medieval Montpellier",
          "description": "Explore medieval life in 10th century Montpellier!"
        }
      },
      "created_at": "2025-06-02T19:00:00.000Z",
      "updated_at": "2025-06-02T19:00:00.000Z",
      "is_active": true
    }
  ],
  "count": 5,
  "schema": "single-entry-with-json",
  "message": "Retrieved 5 stories"
}
```

### POST /api/admin/stories

**Description:** Create or update a story.

**Request Body:**

```json
{
  "slug": "new-adventure",
  "title": "New Adventure",
  "content": "# Adventure Content\n\n## Setting\n...",
  "homepage_display": {
    "en": {
      "title": "New Adventure",
      "description": "An exciting new adventure awaits!"
    },
    "fr": {
      "title": "Nouvelle Aventure",
      "description": "Une nouvelle aventure passionnante vous attend!"
    }
  }
}
```

**Validation Rules:**

- `slug`: Required, alphanumeric + hyphens only (`/^[a-z0-9-]+$/`)
- `title`: Required
- `content`: Required
- `homepage_display`: Optional object with language codes as keys

**Response:**

```json
{
  "success": true,
  "story": {
    "id": 6,
    "slug": "new-adventure",
    "title": "New Adventure",
    "content": "# Adventure Content...",
    "homepage_display": {...},
    "created_at": "2025-06-02T19:17:14.000Z",
    "updated_at": "2025-06-02T19:17:14.000Z",
    "is_active": true
  },
  "message": "Story 'New Adventure' saved successfully",
  "availableLanguages": ["en", "fr"]
}
```

### GET /api/admin/stories/[slug]

**Description:** Get, update, or health check for a specific story.

#### GET - Health Check

**Response:**

```json
{
  "status": "healthy - single entry database",
  "timestamp": "2025-06-02T19:17:14.000Z",
  "database": "connected",
  "stories": {
    "totalStories": 5,
    "oldestStory": "montpellier",
    "newestStory": "sailing"
  },
  "languages": 10,
  "supportedLanguages": ["en", "zh", "hi", "es", "fr", "ar", "bn", "ru", "pt", "ur"],
  "schema": "single-entry-with-json-homepage-display"
}
```

#### POST - Story Gameplay

**Description:** Process story gameplay requests (choice selection, conversation management).

**Request Body:**

```json
{
  "sessionId": "session_1735847834000_abc123xyz",
  "choice": 2,
  "storyName": "montpellier",
  "language": "French",
  "forceRestart": false,
  "conversationHistory": [
    {
      "role": "user",
      "content": "Choice 1"
    },
    {
      "role": "assistant",
      "content": "{\"desc\":\"...\",\"options\":[\"...\",\"...\",\"...\"]}"
    }
  ]
}
```

**Response:**

```json
{
  "sessionId": "session_1735847834000_abc123xyz",
  "currentStep": {
    "step": 3,
    "desc": "You find yourself in the medieval marketplace...",
    "options": [
      "Approach the merchant selling apples",
      "Visit the blacksmith's forge",
      "Head towards the university"
    ],
    "action": "continue"
  },
  "nextSteps": [],
  "conversationHistory": [...],
  "success": true
}
```

### GET /api/admin/stories/homepage

**Description:** Get stories formatted for homepage display in a specific language.

**Query Parameters:**

- `language` (optional): Language code (default: 'fr')

**Example:**

```bash
GET /api/admin/stories/homepage?language=en
```

**Response:**

```json
{
  "success": true,
  "stories": [
    {
      "slug": "montpellier",
      "title": "Medieval Montpellier",
      "description": "Explore medieval life in 10th century Montpellier!"
    },
    {
      "slug": "cretace",
      "title": "Cretaceous Era",
      "description": "Discover the fascinating world of scallops!"
    }
  ],
  "count": 5,
  "language": "en",
  "message": "Retrieved 5 stories for homepage in en"
}
```

---

## Bulk Operations

### POST /api/admin/stories/bulk

**Description:** Perform bulk operations on multiple stories.

**Request Body:**

```json
{
  "operation": "activate|deactivate|delete",
  "slugs": ["story1", "story2", "story3"]
}
```

**Valid Operations:**

- `activate`: Set stories as active
- `deactivate`: Set stories as inactive
- `delete`: Soft delete stories (set is_active = false)

**Response:**

```json
{
  "success": true,
  "results": [
    {
      "slug": "story1",
      "success": true,
      "operation": "deleted"
    },
    {
      "slug": "story2",
      "success": true,
      "operation": "deleted"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "operation": "delete"
  },
  "message": "Bulk delete: 2/2 successful"
}
```

---

## Story Gameplay API

### POST /api/story

**Description:** Main story gameplay endpoint (same as `/api/admin/stories/[slug]` POST).

**Features:**

- Handles new story starts and conversation continuation
- Manages conversation history and Claude AI memory
- Supports all 10 languages with real-time translation
- Session management and choice processing

**Language Mapping:**

```json
{
  "English": "English",
  "Chinese": "中文 (Chinese)",
  "Hindi": "हिन्दी (Hindi)",
  "Spanish": "Español (Spanish)",
  "French": "Français (French)",
  "Arabic": "العربية (Arabic)",
  "Bengali": "বাংলা (Bengali)",
  "Russian": "Русский (Russian)",
  "Portuguese": "Português (Portuguese)",
  "Urdu": "اردو (Urdu)"
}
```

### GET /api/story

**Description:** Story API health check.

**Response:**

```json
{
  "status": "healthy - multilingual ready",
  "timestamp": "2025-06-02T19:17:14.000Z",
  "database": "connected",
  "stories": {
    "totalStories": 5,
    "oldestStory": "montpellier",
    "newestStory": "sailing"
  },
  "languages": 10,
  "supportedLanguages": [
    "English",
    "Chinese",
    "Hindi",
    "Spanish",
    "French",
    "Arabic",
    "Bengali",
    "Russian",
    "Portuguese",
    "Urdu"
  ]
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing parameters, validation errors)
- `404` - Not Found (story doesn't exist)
- `500` - Internal Server Error (database issues, AI API errors)
- `503` - Service Unavailable (database disconnected)

---

## Database Schema

### Stories Table Structure

```sql
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  homepage_display JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_stories_slug ON stories(slug);
CREATE INDEX idx_stories_active ON stories(is_active);
CREATE INDEX idx_stories_homepage_display ON stories USING GIN (homepage_display);
```

### Homepage Display JSON Structure

```json
{
  "en": {
    "title": "Story Title",
    "description": "Story description"
  },
  "fr": {
    "title": "Titre de l'Histoire",
    "description": "Description de l'histoire"
  }
}
```

---

## Authentication & Security

**Current Status:** No authentication required for admin routes.

**Important:** In production, implement proper authentication and authorization:

- API key authentication
- Role-based access control (RBAC)
- Rate limiting
- IP whitelisting for admin operations

---

## Examples & Testing

### Using cURL

```bash
# Health check
curl https://your-domain.com/api/health

# Get all stories
curl https://your-domain.com/api/admin/stories

# Search stories
curl "https://your-domain.com/api/admin/stories?search=medieval"

# Get homepage stories in French
curl "https://your-domain.com/api/admin/stories/homepage?language=fr"

# Create a new story
curl -X POST https://your-domain.com/api/admin/stories \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-story",
    "title": "Test Story",
    "content": "# Test\nThis is a test story.",
    "homepage_display": {
      "en": {
        "title": "Test Story",
        "description": "A test adventure"
      }
    }
  }'

# Start a story
curl -X POST https://your-domain.com/api/story \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session_123",
    "storyName": "montpellier",
    "language": "English",
    "forceRestart": true
  }'
```

### JavaScript/TypeScript Examples

```typescript
// Get all stories
const stories = await fetch('/api/admin/stories').then(r => r.json())

// Start a new story
const response = await fetch('/api/story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session_' + Date.now(),
    storyName: 'montpellier',
    language: 'English',
    forceRestart: true,
  }),
})

// Make a choice in story
const choiceResponse = await fetch('/api/story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: existingSessionId,
    choice: 2,
    storyName: 'montpellier',
    language: 'English',
    conversationHistory: previousHistory,
  }),
})
```

---

## Migration & Setup

### Database Migration

```bash
# Run the migration script
pnpm run db:migrate

# Or with custom DATABASE_URL
DATABASE_URL="your_url" pnpm run db:migrate
```

### Environment Variables Required

```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
ANTHROPIC_API_KEY=your_anthropic_api_key
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id
```

This completes the comprehensive documentation for all admin API routes in Avventura v2.
