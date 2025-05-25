// utils/sessionStorage.ts

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
   * Get or create a session ID for a story
   */
  static getOrCreateSessionId(storyName: string): string {
    const storageKey = `${this.SESSION_PREFIX}${storyName}`
    let sessionId = localStorage.getItem(storageKey)

    if (!sessionId) {
      sessionId = this.generateSessionId()
      localStorage.setItem(storageKey, sessionId)
    }

    return sessionId
  }

  /**
   * Store session data
   */
  static storeSessionData(sessionId: string, data: Partial<SessionData>): void {
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
  static clearSession(storyName: string): void {
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
    const data = this.getSessionData(sessionId)
    return data !== null
  }

  /**
   * Update the last updated timestamp
   */
  static updateLastAccessed(sessionId: string): void {
    const data = this.getSessionData(sessionId)
    if (data) {
      this.storeSessionData(sessionId, { lastUpdated: new Date().toISOString() })
    }
  }
}
