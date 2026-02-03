import { Schema } from 'mongoose';

/**
 * Interface for multilingual text fields
 * Supports English and Nepali languages with optional timestamp tracking
 */
export interface MultilingualField {
  en: string;
  ne?: string;
  _lastUpdated?: {
    en: Date;
    ne?: Date;
  };
}

/**
 * Mongoose schema definition for multilingual fields
 * Used as embedded schema in other models
 */
export const multilingualFieldSchema = new Schema<MultilingualField>({
  en: {
    type: String,
    required: [true, 'English text is required'],
    trim: true
  },
  ne: {
    type: String,
    trim: true,
    validate: {
      validator: function(value: string) {
        // If Nepali text is provided, it should not be empty
        return !value || value.length > 0;
      },
      message: 'Nepali text cannot be empty if provided'
    }
  },
  _lastUpdated: {
    en: {
      type: Date,
      default: Date.now
    },
    ne: {
      type: Date
    }
  }
}, {
  _id: false, // Don't create separate _id for embedded documents
  timestamps: false // We handle timestamps manually in _lastUpdated
});

/**
 * Pre-save middleware for multilingual fields
 * Updates the _lastUpdated timestamps when content changes
 */
multilingualFieldSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.isModified('en')) {
    if (!this._lastUpdated) {
      this._lastUpdated = { en: now };
    } else {
      this._lastUpdated.en = now;
    }
  }
  
  if (this.isModified('ne')) {
    if (!this._lastUpdated) {
      this._lastUpdated = { en: now, ne: now };
    } else {
      this._lastUpdated.ne = now;
    }
  }
  
  next();
});

/**
 * Helper function to create multilingual field with validation
 */
export function createMultilingualField(
  englishText: string,
  nepaliText?: string,
  options: {
    required?: boolean;
    maxLength?: number;
    minLength?: number;
  } = {}
): MultilingualField {
  const { required = true, maxLength, minLength } = options;
  
  if (required && !englishText) {
    throw new Error('English text is required for multilingual field');
  }
  
  if (maxLength && englishText && englishText.length > maxLength) {
    throw new Error(`English text exceeds maximum length of ${maxLength} characters`);
  }
  
  if (minLength && englishText && englishText.length < minLength) {
    throw new Error(`English text must be at least ${minLength} characters`);
  }
  
  if (nepaliText) {
    if (maxLength && nepaliText.length > maxLength) {
      throw new Error(`Nepali text exceeds maximum length of ${maxLength} characters`);
    }
    
    if (minLength && nepaliText.length < minLength) {
      throw new Error(`Nepali text must be at least ${minLength} characters`);
    }
  }
  
  const field: MultilingualField = {
    en: englishText.trim(),
    _lastUpdated: {
      en: new Date()
    }
  };
  
  if (nepaliText && nepaliText.trim()) {
    field.ne = nepaliText.trim();
    field._lastUpdated!.ne = new Date();
  }
  
  return field;
}

/**
 * Helper function to get text in preferred language with fallback
 */
export function getLocalizedText(
  field: MultilingualField,
  preferredLanguage: 'en' | 'ne' = 'en'
): string {
  if (preferredLanguage === 'ne' && field.ne) {
    return field.ne;
  }
  return field.en;
}

/**
 * Helper function to check if field has translation in specific language
 */
export function hasTranslation(
  field: MultilingualField,
  language: 'en' | 'ne'
): boolean {
  if (language === 'en') {
    return Boolean(field.en);
  }
  return Boolean(field.ne);
}

/**
 * Helper function to get translation completeness percentage
 */
export function getTranslationCompleteness(field: MultilingualField): number {
  const hasEnglish = Boolean(field.en);
  const hasNepali = Boolean(field.ne);
  
  if (hasEnglish && hasNepali) return 100;
  if (hasEnglish || hasNepali) return 50;
  return 0;
}