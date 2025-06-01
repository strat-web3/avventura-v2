/**
 * i18n utility for language detection and translation support
 * This file provides functions for detecting user language and managing translations
 */

// Define supported languages in order of number of speakers
export const SUPPORTED_LANGUAGES = {
  en: 'English', // ~1.5 billion speakers
  zh: '中文', // Mandarin Chinese, ~1.1 billion speakers
  hi: 'हिन्दी', // Hindi, ~650 million speakers
  es: 'Español', // Spanish, ~550 million speakers
  fr: 'Français', // French, ~300 million speakers
  ar: 'العربية', // Arabic, ~280 million speakers
  bn: 'বাংলা', // Bengali, ~270 million speakers
  ru: 'Русский', // Russian, ~260 million speakers
  pt: 'Português', // Portuguese, ~250 million speakers
  ur: 'اردو', // Urdu, ~230 million speakers
}

export type Language = keyof typeof SUPPORTED_LANGUAGES

export const DEFAULT_LANGUAGE: Language = 'fr' // Changed default to French as fallback

export function detectUserLanguage(): Language {
  if (typeof window === 'undefined' || !navigator || !navigator.language) {
    console.log('Server-side or no navigator, returning default language:', DEFAULT_LANGUAGE)
    return DEFAULT_LANGUAGE // Default for server-side rendering or if browser detection fails
  }

  try {
    // Get browser language and normalize it
    const browserLang = navigator.language.toLowerCase()
    console.log('Browser language detected:', browserLang)

    // Extract the primary language code (before any country/region code)
    const primaryLang = browserLang.split('-')[0]
    console.log('Primary language code:', primaryLang)

    // Check if primary language is directly supported
    if (primaryLang in SUPPORTED_LANGUAGES) {
      console.log('Direct language match found:', primaryLang)
      return primaryLang as Language
    }

    // Handle special cases and language variants
    const languageMap: Record<string, Language> = {
      'zh-cn': 'zh', // Simplified Chinese
      'zh-tw': 'zh', // Traditional Chinese
      'zh-hk': 'zh', // Hong Kong Chinese
      'pt-br': 'pt', // Brazilian Portuguese
      'pt-pt': 'pt', // European Portuguese
      'es-es': 'es', // Spanish (Spain)
      'es-mx': 'es', // Spanish (Mexico)
      'en-us': 'en', // American English
      'en-gb': 'en', // British English
      'fr-fr': 'fr', // French (France)
      'fr-ca': 'fr', // French (Canada)
      'ar-sa': 'ar', // Arabic (Saudi Arabia)
      'ar-eg': 'ar', // Arabic (Egypt)
    }

    // Check for specific variants
    if (browserLang in languageMap) {
      console.log('Language variant match found:', browserLang, '→', languageMap[browserLang])
      return languageMap[browserLang]
    }

    // Also check navigator.languages array for better detection
    if (navigator.languages && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const normalizedLang = lang.toLowerCase()
        const primaryLangCode = normalizedLang.split('-')[0]

        if (primaryLangCode in SUPPORTED_LANGUAGES) {
          console.log('Found supported language in languages array:', primaryLangCode)
          return primaryLangCode as Language
        }

        if (normalizedLang in languageMap) {
          console.log(
            'Found variant in languages array:',
            normalizedLang,
            '→',
            languageMap[normalizedLang]
          )
          return languageMap[normalizedLang]
        }
      }
    }

    console.log('No matching language found, using default:', DEFAULT_LANGUAGE)
  } catch (error) {
    console.warn('Error detecting browser language:', error)
  }

  // Fall back to default language
  return DEFAULT_LANGUAGE
}

/**
 * Validates if a language code is supported
 * @param lang Language code to validate
 * @returns Boolean indicating if language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
  return lang in SUPPORTED_LANGUAGES
}

/**
 * Gets a safe language code, falling back to default if necessary
 * @param lang Language code to validate
 * @returns Valid language code
 */
export function getSafeLanguage(lang: string | undefined): Language {
  if (!lang || !isValidLanguage(lang)) {
    return DEFAULT_LANGUAGE
  }
  return lang
}

/**
 * Gets the full language name for a language code
 * @param lang Language code
 * @returns Full language name
 */
export function getLanguageName(lang: Language): string {
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]
}

/**
 * Detects language with detailed logging for debugging
 * @returns Detected language with debug information
 */
export function detectUserLanguageWithDebug(): { language: Language; debug: any } {
  const debug = {
    hasNavigator: typeof navigator !== 'undefined',
    navigatorLanguage: typeof navigator !== 'undefined' ? navigator.language : null,
    navigatorLanguages: typeof navigator !== 'undefined' ? navigator.languages : null,
    detectedLanguage: null as Language | null,
    fallbackUsed: false,
  }

  const detectedLang = detectUserLanguage()
  debug.detectedLanguage = detectedLang
  debug.fallbackUsed = detectedLang === DEFAULT_LANGUAGE

  return {
    language: detectedLang,
    debug,
  }
}
