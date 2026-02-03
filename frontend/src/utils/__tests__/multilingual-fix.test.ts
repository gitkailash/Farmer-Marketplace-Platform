import { getLocalizedText, hasTranslation, getTranslationCompleteness, getLanguageIndicator, getLocalizedCategory } from '../multilingual'

describe('Multilingual Utils - Null/Undefined Safety', () => {
  describe('getLocalizedText', () => {
    it('should handle undefined field gracefully', () => {
      expect(getLocalizedText(undefined, 'en')).toBe('')
      expect(getLocalizedText(undefined, 'ne')).toBe('')
    })

    it('should handle null field gracefully', () => {
      expect(getLocalizedText(null, 'en')).toBe('')
      expect(getLocalizedText(null, 'ne')).toBe('')
    })

    it('should handle valid multilingual field', () => {
      const field = { en: 'Hello', ne: 'नमस्ते' }
      expect(getLocalizedText(field, 'en')).toBe('Hello')
      expect(getLocalizedText(field, 'ne')).toBe('नमस्ते')
    })

    it('should handle string field', () => {
      expect(getLocalizedText('Hello World', 'en')).toBe('Hello World')
      expect(getLocalizedText('Hello World', 'ne')).toBe('Hello World')
    })

    it('should fallback to English when Nepali is not available', () => {
      const field = { en: 'Hello' }
      expect(getLocalizedText(field, 'ne')).toBe('Hello')
    })

    it('should return empty string when field has no content', () => {
      const field = { en: '' }
      expect(getLocalizedText(field, 'en')).toBe('')
    })
  })

  describe('hasTranslation', () => {
    it('should return false for undefined/null fields', () => {
      expect(hasTranslation(undefined, 'en')).toBe(false)
      expect(hasTranslation(null, 'ne')).toBe(false)
    })

    it('should correctly identify translations', () => {
      const field = { en: 'Hello', ne: 'नमस्ते' }
      expect(hasTranslation(field, 'en')).toBe(true)
      expect(hasTranslation(field, 'ne')).toBe(true)
    })
  })

  describe('getTranslationCompleteness', () => {
    it('should return 0 for undefined/null fields', () => {
      expect(getTranslationCompleteness(undefined)).toBe(0)
      expect(getTranslationCompleteness(null)).toBe(0)
    })

    it('should return correct completeness percentages', () => {
      expect(getTranslationCompleteness({ en: 'Hello', ne: 'नमस्ते' })).toBe(100)
      expect(getTranslationCompleteness({ en: 'Hello' })).toBe(50)
      expect(getTranslationCompleteness('Hello')).toBe(50)
    })
  })

  describe('getLanguageIndicator', () => {
    it('should handle undefined/null fields gracefully', () => {
      const result = getLanguageIndicator(undefined, 'en')
      expect(result).toEqual({ show: false, language: null, isComplete: false })
    })
  })

  describe('getLocalizedCategory', () => {
    it('should handle undefined/null categories gracefully', () => {
      expect(getLocalizedCategory(undefined, 'en')).toBe('')
      expect(getLocalizedCategory(null, 'ne')).toBe('')
    })

    it('should handle string categories', () => {
      expect(getLocalizedCategory('Vegetables', 'en')).toBe('Vegetables')
    })

    it('should handle multilingual categories', () => {
      const category = { en: 'Vegetables', ne: 'तरकारी' }
      expect(getLocalizedCategory(category, 'en')).toBe('Vegetables')
      expect(getLocalizedCategory(category, 'ne')).toBe('तरकारी')
    })
  })
})