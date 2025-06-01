export interface SessionData {
  sessionId: string
  storyName: string
  currentStep: number
  createdAt: string
  lastUpdated: string
}

export class SessionManager {
  private static readonly SESSION_PREFIX = 'avventura_session_'
  private static readonly SESSION_DATA_PREFIX = 'avventura_data_'

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get session ID for a specific story from localStorage
   */
  static getSessionForStory(storyName: string): string | null {
    if (typeof window === 'undefined') return null

    const storageKey = `${this.SESSION_PREFIX}${storyName}`
    return localStorage.getItem(storageKey)
  }

  /**
   * Create new session for a story (used when clicking from homepage)
   */
  static createNewSessionForStory(storyName: string): string {
    if (typeof window === 'undefined') {
      return this.generateSessionId()
    }

    const sessionId = this.generateSessionId()
    const storageKey = `${this.SESSION_PREFIX}${storyName}`

    // Store session ID for the story
    localStorage.setItem(storageKey, sessionId)

    // Store session data
    this.storeSessionData(sessionId, {
      sessionId,
      storyName,
      currentStep: 1,
    })

    return sessionId
  }

  /**
   * Get or create a session ID for a story (used on page load/refresh)
   */
  static getOrCreateSessionId(storyName: string): string {
    if (typeof window === 'undefined') {
      return this.generateSessionId()
    }

    // Try to get existing session
    let sessionId = this.getSessionForStory(storyName)

    // If no existing session or session data is invalid, create new one
    if (!sessionId || !this.isValidSession(sessionId)) {
      sessionId = this.createNewSessionForStory(storyName)
    }

    return sessionId
  }

  /**
   * Store session data
   */
  static storeSessionData(sessionId: string, data: Partial<SessionData>): void {
    if (typeof window === 'undefined') return

    const storageKey = `${this.SESSION_DATA_PREFIX}${sessionId}`
    const existing = this.getSessionData(sessionId)

    const sessionData: SessionData = {
      sessionId,
      storyName: data.storyName || existing?.storyName || '',
      currentStep: data.currentStep || existing?.currentStep || 1,
      createdAt: existing?.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      ...data,
    }

    localStorage.setItem(storageKey, JSON.stringify(sessionData))
  }

  /**
   * Get session data
   */
  static getSessionData(sessionId: string): SessionData | null {
    if (typeof window === 'undefined') return null

    const storageKey = `${this.SESSION_DATA_PREFIX}${sessionId}`
    const data = localStorage.getItem(storageKey)

    if (!data) return null

    try {
      return JSON.parse(data) as SessionData
    } catch (error) {
      console.error('Error parsing session data:', error)
      return null
    }
  }

  /**
   * Clear session for a specific story
   */
  static clearSessionForStory(storyName: string): void {
    if (typeof window === 'undefined') return

    const sessionKey = `${this.SESSION_PREFIX}${storyName}`
    const sessionId = localStorage.getItem(sessionKey)

    if (sessionId) {
      const dataKey = `${this.SESSION_DATA_PREFIX}${sessionId}`
      localStorage.removeItem(dataKey)
    }

    localStorage.removeItem(sessionKey)
  }

  /**
   * Clear all sessions (for debugging or reset)
   */
  static clearAllSessions(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)

    keys.forEach(key => {
      if (key.startsWith(this.SESSION_PREFIX) || key.startsWith(this.SESSION_DATA_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Get all active sessions
   */
  static getAllSessions(): SessionData[] {
    if (typeof window === 'undefined') return []

    const keys = Object.keys(localStorage)
    const sessions: SessionData[] = []

    keys.forEach(key => {
      if (key.startsWith(this.SESSION_DATA_PREFIX)) {
        const sessionId = key.replace(this.SESSION_DATA_PREFIX, '')
        const data = this.getSessionData(sessionId)
        if (data) {
          sessions.push(data)
        }
      }
    })

    return sessions.sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
  }

  /**
   * Check if a session exists and is valid
   */
  static isValidSession(sessionId: string): boolean {
    if (typeof window === 'undefined') return false

    const data = this.getSessionData(sessionId)
    return data !== null
  }

  /**
   * Update the last updated timestamp
   */
  static updateLastAccessed(sessionId: string): void {
    if (typeof window === 'undefined') return

    const data = this.getSessionData(sessionId)
    if (data) {
      this.storeSessionData(sessionId, { lastUpdated: new Date().toISOString() })
    }
  }

  /**
   * Check if session has server-side data (for validation)
   * This method can be extended to make API calls to validate server sessions
   */
  static async validateServerSession(sessionId: string): Promise<boolean> {
    try {
      // You could add an API endpoint to validate if server has this session
      // For now, we just check if localStorage has the session data
      return this.isValidSession(sessionId)
    } catch (error) {
      console.error('Error validating server session:', error)
      return false
    }
  }

  /**
   * Get session summary for debugging
   */
  static getSessionSummary(): {
    totalSessions: number
    sessionsByStory: Record<string, number>
    oldestSession: string | null
    newestSession: string | null
  } {
    if (typeof window === 'undefined') {
      return {
        totalSessions: 0,
        sessionsByStory: {},
        oldestSession: null,
        newestSession: null,
      }
    }

    const sessions = this.getAllSessions()
    const sessionsByStory: Record<string, number> = {}

    sessions.forEach(session => {
      sessionsByStory[session.storyName] = (sessionsByStory[session.storyName] || 0) + 1
    })

    return {
      totalSessions: sessions.length,
      sessionsByStory,
      oldestSession: sessions.length > 0 ? sessions[sessions.length - 1].sessionId : null,
      newestSession: sessions.length > 0 ? sessions[0].sessionId : null,
    }
  }

  /**
   * Cleanup old sessions (remove sessions older than specified days)
   */
  static cleanupOldSessions(daysOld: number = 7): number {
    if (typeof window === 'undefined') return 0

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const sessions = this.getAllSessions()
    let removedCount = 0

    sessions.forEach(session => {
      const sessionDate = new Date(session.lastUpdated)
      if (sessionDate < cutoffDate) {
        // Remove session data
        const dataKey = `${this.SESSION_DATA_PREFIX}${session.sessionId}`
        localStorage.removeItem(dataKey)

        // Remove session ID reference
        const sessionKey = `${this.SESSION_PREFIX}${session.storyName}`
        const storedSessionId = localStorage.getItem(sessionKey)
        if (storedSessionId === session.sessionId) {
          localStorage.removeItem(sessionKey)
        }

        removedCount++
      }
    })

    return removedCount
  }
}
