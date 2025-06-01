/**
 * Translation system for the application
 * Contains all text strings organized by language
 */

import { Language } from '@/utils/i18n'

// Define the structure of our translations
type TranslationKeys = {
  common: {
    login: string
    logout: string
    back: string
    loading: string
    error: string
    success: string
  }
  home: {
    title: string
    sendEth: string
    transactionSuccess: string
    transactionFailed: string
    notConnected: string
    insufficientBalance: string
  }
  navigation: {
    newPage: string
    walletGenerator: string
    referral: string
  }
}

// Default translations (French as fallback)
const defaultTranslations: TranslationKeys = {
  common: {
    login: 'Connexion',
    logout: 'Déconnexion',
    back: 'Retour',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
  },
  home: {
    title: 'Avventura',
    sendEth: 'Envoyer ETH',
    transactionSuccess: 'Transaction réussie',
    transactionFailed: 'Transaction échouée',
    notConnected: 'Portefeuille non connecté',
    insufficientBalance: 'Solde insuffisant',
  },
  navigation: {
    newPage: 'Nouvelle Page',
    walletGenerator: 'Générateur de Portefeuille',
    referral: 'Parrainage',
  },
}

// English translations
const englishTranslations: TranslationKeys = {
  common: {
    login: 'Login',
    logout: 'Logout',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  home: {
    title: 'Avventura',
    sendEth: 'Send ETH',
    transactionSuccess: 'Transaction successful',
    transactionFailed: 'Transaction failed',
    notConnected: 'Wallet not connected',
    insufficientBalance: 'Insufficient balance',
  },
  navigation: {
    newPage: 'New Page',
    walletGenerator: 'Wallet Generator',
    referral: 'Referral',
  },
}

// Spanish translations
const spanishTranslations: TranslationKeys = {
  common: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    back: 'Atrás',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
  home: {
    title: 'Avventura',
    sendEth: 'Enviar ETH',
    transactionSuccess: 'Transacción exitosa',
    transactionFailed: 'Transacción fallida',
    notConnected: 'Billetera no conectada',
    insufficientBalance: 'Saldo insuficiente',
  },
  navigation: {
    newPage: 'Nueva Página',
    walletGenerator: 'Generador de Billetera',
    referral: 'Referido',
  },
}

// All translations
const translations: Record<Language, TranslationKeys> = {
  fr: defaultTranslations,
  en: englishTranslations,
  es: spanishTranslations,
  zh: defaultTranslations, // Fallback to French for now
  hi: defaultTranslations, // Fallback to French for now
  ar: defaultTranslations, // Fallback to French for now
  bn: defaultTranslations, // Fallback to French for now
  ru: defaultTranslations, // Fallback to French for now
  pt: defaultTranslations, // Fallback to French for now
  ur: defaultTranslations, // Fallback to French for now
}

/**
 * Get translations for a specific language
 * @param language Language code
 * @returns Translation object for the language
 */
export function getTranslations(language: Language): TranslationKeys {
  try {
    return translations[language] || defaultTranslations
  } catch (error) {
    console.error('Error getting translations for language:', language, error)
    return defaultTranslations
  }
}

/**
 * Get a specific translation key with fallback
 * @param language Language code
 * @param key Translation key path (e.g., 'common.login')
 * @returns Translation string
 */
export function getTranslation(language: Language, key: string): string {
  try {
    const translationObj = getTranslations(language)
    const keys = key.split('.')
    let value: any = translationObj

    for (const k of keys) {
      value = value?.[k]
    }

    return typeof value === 'string' ? value : key
  } catch (error) {
    console.error('Error getting translation for key:', key, error)
    return key
  }
}
