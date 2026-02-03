import mongoose, { Document, Schema } from 'mongoose';

// Translation key document interface
export interface ITranslationKey extends Document {
  key: string;
  namespace: string;
  translations: {
    en: string;
    ne?: string;
  };
  context?: string;
  isRequired: boolean;
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateTranslation(language: 'en' | 'ne', text: string, updatedBy: mongoose.Types.ObjectId): void;
  hasTranslation(language: 'en' | 'ne'): boolean;
  getTranslation(language: 'en' | 'ne'): string;
  getCompleteness(): number;
  markAsRequired(): void;
  markAsOptional(): void;
  
  // Virtual population
  updater?: any;
}

// Valid namespaces for translation keys
export const VALID_NAMESPACES = [
  'common',
  'auth',
  'products',
  'admin',
  'navigation',
  'forms',
  'errors',
  'messages',
  'notifications',
  'gallery',
  'news',
  'reviews',
  'orders',
  'dashboard',
  'buyer',
  'farmer',
  'home'
] as const;

export type TranslationNamespace = typeof VALID_NAMESPACES[number];

// Translation key schema definition
const translationKeySchema = new Schema<ITranslationKey>({
  key: {
    type: String,
    required: [true, 'Translation key is required'],
    trim: true,
    maxlength: [200, 'Translation key cannot exceed 200 characters'],
    minlength: [3, 'Translation key must be at least 3 characters long'],
    validate: {
      validator: function(key: string) {
        // Key format: namespace.section.item (e.g., "common.buttons.save", "common.buttons.confirmDelete")
        const keyRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-z][a-zA-Z0-9_]*)*$/;
        return keyRegex.test(key);
      },
      message: 'Translation key must follow format: namespace.section.item (lowercase start, alphanumeric, underscores, camelCase allowed)'
    }
  },
  namespace: {
    type: String,
    required: [true, 'Namespace is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: VALID_NAMESPACES,
      message: `Namespace must be one of: ${VALID_NAMESPACES.join(', ')}`
    },
    validate: {
      validator: function(this: ITranslationKey, namespace: string): boolean {
        // Ensure namespace matches the beginning of the key
        return Boolean(this.key && this.key.startsWith(namespace + '.'));
      },
      message: 'Namespace must match the beginning of the translation key'
    }
  },
  translations: {
    en: {
      type: String,
      required: [true, 'English translation is required'],
      trim: true,
      maxlength: [2000, 'English translation cannot exceed 2000 characters'],
      minlength: [1, 'English translation cannot be empty']
    },
    ne: {
      type: String,
      trim: true,
      maxlength: [2000, 'Nepali translation cannot exceed 2000 characters'],
      validate: {
        validator: function(text: string) {
          // If Nepali translation is provided, it should not be empty
          return !text || text.length > 0;
        },
        message: 'Nepali translation cannot be empty if provided'
      }
    }
  },
  context: {
    type: String,
    trim: true,
    maxlength: [500, 'Context cannot exceed 500 characters'],
    validate: {
      validator: function(context: string) {
        // Context is optional but should be meaningful if provided
        return !context || context.length >= 5;
      },
      message: 'Context must be at least 5 characters long if provided'
    }
  },
  isRequired: {
    type: Boolean,
    required: [true, 'Required status is required'],
    default: false
  },
  lastUpdated: {
    type: Date,
    required: [true, 'Last updated date is required'],
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user ID is required'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient translation queries
translationKeySchema.index({ key: 1 }, { unique: true }); // Unique translation keys
translationKeySchema.index({ namespace: 1, key: 1 }); // Namespace-based queries
translationKeySchema.index({ namespace: 1, isRequired: 1 }); // Required translations by namespace
translationKeySchema.index({ lastUpdated: -1 }); // Recently updated translations
translationKeySchema.index({ updatedBy: 1, lastUpdated: -1 }); // User's recent updates
translationKeySchema.index({ 'translations.en': 'text', 'translations.ne': 'text' }); // Text search in translations
translationKeySchema.index({ isRequired: 1, 'translations.ne': 1 }); // Required translations missing Nepali

// Virtual populate for updater data
translationKeySchema.virtual('updater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to update translation
translationKeySchema.methods.updateTranslation = function(
  language: 'en' | 'ne',
  text: string,
  updatedBy: mongoose.Types.ObjectId
): void {
  if (!['en', 'ne'].includes(language)) {
    throw new Error('Language must be either "en" or "ne"');
  }
  
  if (!text || text.trim().length === 0) {
    throw new Error('Translation text cannot be empty');
  }
  
  if (text.length > 2000) {
    throw new Error('Translation text cannot exceed 2000 characters');
  }
  
  this.translations[language] = text.trim();
  this.lastUpdated = new Date();
  this.updatedBy = updatedBy;
};

// Instance method to check if translation exists
translationKeySchema.methods.hasTranslation = function(language: 'en' | 'ne'): boolean {
  return Boolean(this.translations[language]);
};

// Instance method to get translation
translationKeySchema.methods.getTranslation = function(language: 'en' | 'ne'): string {
  const translation = this.translations[language];
  if (!translation) {
    // Fallback to English if Nepali is not available
    if (language === 'ne' && this.translations.en) {
      return this.translations.en;
    }
    throw new Error(`Translation not available for language: ${language}`);
  }
  return translation;
};

// Instance method to get translation completeness percentage
translationKeySchema.methods.getCompleteness = function(): number {
  const hasEnglish = Boolean(this.translations.en);
  const hasNepali = Boolean(this.translations.ne);
  
  if (hasEnglish && hasNepali) return 100;
  if (hasEnglish || hasNepali) return 50;
  return 0;
};

// Instance method to mark as required
translationKeySchema.methods.markAsRequired = function(): void {
  this.isRequired = true;
  this.lastUpdated = new Date();
};

// Instance method to mark as optional
translationKeySchema.methods.markAsOptional = function(): void {
  this.isRequired = false;
  this.lastUpdated = new Date();
};

// Pre-save middleware to ensure data consistency
translationKeySchema.pre('save', function(next) {
  // Extract namespace from key if not set
  if (this.key && !this.namespace) {
    const keyParts = this.key.split('.');
    if (keyParts.length > 0 && VALID_NAMESPACES.includes(keyParts[0] as TranslationNamespace)) {
      this.namespace = keyParts[0] as TranslationNamespace;
    }
  }
  
  // Validate namespace matches key
  if (this.key && this.namespace && !this.key.startsWith(this.namespace + '.')) {
    return next(new Error('Namespace must match the beginning of the translation key'));
  }
  
  // Trim translations
  if (this.translations.en) {
    this.translations.en = this.translations.en.trim();
  }
  if (this.translations.ne) {
    this.translations.ne = this.translations.ne.trim();
    // Remove empty Nepali translations
    if (this.translations.ne.length === 0) {
      delete this.translations.ne;
    }
  }
  
  // Update lastUpdated if translations were modified
  if (this.isModified('translations')) {
    this.lastUpdated = new Date();
  }
  
  next();
});

// Static method to get translation completeness by namespace
translationKeySchema.statics.getNamespaceCompleteness = async function(namespace: TranslationNamespace) {
  const pipeline = [
    { $match: { namespace } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        withNepali: {
          $sum: {
            $cond: [{ $ne: ['$translations.ne', null] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        withNepali: 1,
        completeness: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$withNepali', '$total'] }, 100] }
          ]
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || { total: 0, withNepali: 0, completeness: 0 };
};

// Static method to get missing translations
translationKeySchema.statics.getMissingTranslations = async function(
  namespace?: TranslationNamespace,
  language: 'ne' = 'ne'
) {
  const match: any = {};
  if (namespace) {
    match.namespace = namespace;
  }
  
  // Find keys missing the specified language translation
  match[`translations.${language}`] = { $exists: false };
  
  return this.find(match)
    .select('key namespace translations.en isRequired lastUpdated')
    .sort({ namespace: 1, key: 1 });
};

// Create and export the TranslationKey model
export const TranslationKey = mongoose.model<ITranslationKey>('TranslationKey', translationKeySchema);