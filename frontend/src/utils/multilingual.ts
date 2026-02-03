import { MultilingualField } from '../types/api'

/**
 * Get localized text from a multilingual field with fallback
 */
export function getLocalizedText(
  field: string | MultilingualField | undefined | null,
  preferredLanguage: 'en' | 'ne' = 'en'
): string {
  // Handle null/undefined fields
  if (!field) {
    return ''
  }

  // Handle legacy string fields
  if (typeof field === 'string') {
    return field
  }

  // Handle multilingual fields
  if (preferredLanguage === 'ne' && field.ne) {
    return field.ne
  }
  
  return field.en || ''
}

/**
 * Check if a multilingual field has content in a specific language
 */
export function hasTranslation(
  field: string | MultilingualField | undefined | null,
  language: 'en' | 'ne'
): boolean {
  if (!field) {
    return false
  }

  if (typeof field === 'string') {
    return language === 'en' // Assume legacy strings are English
  }

  if (language === 'en') {
    return Boolean(field.en)
  }
  
  return Boolean(field.ne)
}

/**
 * Get translation completeness percentage for a multilingual field
 */
export function getTranslationCompleteness(field: string | MultilingualField | undefined | null): number {
  if (!field) {
    return 0
  }

  if (typeof field === 'string') {
    return 50 // Legacy string fields are 50% complete (English only)
  }

  const hasEnglish = Boolean(field.en)
  const hasNepali = Boolean(field.ne)
  
  if (hasEnglish && hasNepali) return 100
  if (hasEnglish || hasNepali) return 50
  return 0
}

/**
 * Get language indicator for partial translations
 */
export function getLanguageIndicator(
  field: string | MultilingualField | undefined | null,
  currentLanguage: 'en' | 'ne'
): { show: boolean; language: 'en' | 'ne' | null; isComplete: boolean } {
  if (!field) {
    return { show: false, language: null, isComplete: false }
  }

  if (typeof field === 'string') {
    return {
      show: currentLanguage === 'ne', // Show indicator when viewing in Nepali but content is English
      language: 'en',
      isComplete: false
    }
  }

  const hasEnglish = Boolean(field.en)
  const hasNepali = Boolean(field.ne)
  const isComplete = hasEnglish && hasNepali

  if (isComplete) {
    return { show: false, language: null, isComplete: true }
  }

  // Show indicator when content is not available in current language
  if (currentLanguage === 'ne' && !hasNepali && hasEnglish) {
    return { show: true, language: 'en', isComplete: false }
  }

  if (currentLanguage === 'en' && !hasEnglish && hasNepali) {
    return { show: true, language: 'ne', isComplete: false }
  }

  return { show: false, language: null, isComplete: false }
}

/**
 * Create a multilingual field from separate language inputs
 */
export function createMultilingualField(
  englishText: string,
  nepaliText?: string
): MultilingualField {
  const field: MultilingualField = {
    en: englishText.trim()
  }

  if (nepaliText && nepaliText.trim()) {
    field.ne = nepaliText.trim()
  }

  return field
}

/**
 * Extract category name with localization support
 */
export function getLocalizedCategory(
  category: string | { en: string; ne?: string } | undefined | null,
  language: 'en' | 'ne' = 'en'
): string {
  if (!category) {
    return ''
  }

  if (typeof category === 'string') {
    return category
  }

  if (language === 'ne' && category.ne) {
    return category.ne
  }

  return category.en || ''
}