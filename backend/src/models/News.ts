import mongoose, { Document, Schema } from 'mongoose';
import { MultilingualField, multilingualFieldSchema } from './types/multilingual';

// News priority enumeration
export enum NewsPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH'
}

// News item document interface
export interface INewsItem extends Document {
  headline: MultilingualField;
  content?: MultilingualField;
  summary?: MultilingualField;
  link?: string;
  priority: NewsPriority;
  language: 'en' | 'ne'; // Primary language for the news item
  isActive: boolean;
  publishedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  activate(): void;
  deactivate(): void;
  setPriority(priority: NewsPriority): void;
  setLanguage(language: 'en' | 'ne'): void;
  publish(): void;
  getLocalizedHeadline(language?: 'en' | 'ne'): string;
  getLocalizedContent(language?: 'en' | 'ne'): string | undefined;
  getLocalizedSummary(language?: 'en' | 'ne'): string | undefined;
  hasTranslation(language: 'en' | 'ne'): boolean;
  
  // Virtual population
  creator?: any;
}

// News item schema definition
const newsItemSchema = new Schema<INewsItem>({
  headline: {
    type: multilingualFieldSchema,
    required: [true, 'News headline is required'],
    validate: {
      validator: function(headline: MultilingualField) {
        return headline.en && headline.en.length >= 5 && headline.en.length <= 200;
      },
      message: 'Headline must be between 5 and 200 characters'
    }
  },
  content: {
    type: multilingualFieldSchema,
    validate: {
      validator: function(content: MultilingualField) {
        if (!content) return true; // Optional field
        return !content.en || (content.en.length >= 10 && content.en.length <= 5000);
      },
      message: 'Content must be between 10 and 5000 characters if provided'
    }
  },
  summary: {
    type: multilingualFieldSchema,
    validate: {
      validator: function(summary: MultilingualField) {
        if (!summary) return true; // Optional field
        return !summary.en || (summary.en.length >= 10 && summary.en.length <= 500);
      },
      message: 'Summary must be between 10 and 500 characters if provided'
    }
  },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        const urlRegex = /^https?:\/\/.+/i;
        return urlRegex.test(url);
      },
      message: 'Link must be a valid URL starting with http:// or https://'
    }
  },
  priority: {
    type: String,
    enum: Object.values(NewsPriority),
    required: [true, 'News priority is required'],
    default: NewsPriority.NORMAL
  },
  language: {
    type: String,
    required: [true, 'Primary language is required'],
    enum: ['en', 'ne'],
    default: 'en',
    validate: {
      validator: function(lang: string) {
        return ['en', 'ne'].includes(lang);
      },
      message: 'Language must be either "en" (English) or "ne" (Nepali)'
    }
  },
  isActive: {
    type: Boolean,
    required: [true, 'Active status is required'],
    default: true
  },
  publishedAt: {
    type: Date,
    required: [true, 'Published date is required'],
    default: Date.now,
    validate: {
      validator: function(date: Date) {
        // Published date cannot be more than 1 year in the future
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        return date <= oneYearFromNow;
      },
      message: 'Published date cannot be more than 1 year in the future'
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required'],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and filtering
newsItemSchema.index({ isActive: 1, priority: -1, publishedAt: -1 });
newsItemSchema.index({ language: 1, isActive: 1, publishedAt: -1 });
newsItemSchema.index({ createdBy: 1, createdAt: -1 });
newsItemSchema.index({ publishedAt: -1 });
newsItemSchema.index({ priority: 1, isActive: 1 });
newsItemSchema.index({ 'headline.en': 'text', 'content.en': 'text', 'headline.ne': 'text', 'content.ne': 'text' }); // Multilingual text search

// Virtual populate for creator data
newsItemSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to activate news item
newsItemSchema.methods.activate = function(): void {
  this.isActive = true;
};

// Instance method to deactivate news item
newsItemSchema.methods.deactivate = function(): void {
  this.isActive = false;
};

// Instance method to set priority
newsItemSchema.methods.setPriority = function(priority: NewsPriority): void {
  if (!Object.values(NewsPriority).includes(priority)) {
    throw new Error('Invalid priority level');
  }
  this.priority = priority;
};

// Instance method to set language
newsItemSchema.methods.setLanguage = function(language: 'en' | 'ne'): void {
  if (!['en', 'ne'].includes(language)) {
    throw new Error('Invalid language code. Must be "en" or "ne"');
  }
  
  this.language = language;
};

// Instance method to get localized headline
newsItemSchema.methods.getLocalizedHeadline = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.headline.ne) {
    return this.headline.ne;
  }
  return this.headline.en;
};

// Instance method to get localized content
newsItemSchema.methods.getLocalizedContent = function(language: 'en' | 'ne' = 'en'): string | undefined {
  if (!this.content) return undefined;
  
  if (language === 'ne' && this.content.ne) {
    return this.content.ne;
  }
  return this.content.en;
};

// Instance method to get localized summary
newsItemSchema.methods.getLocalizedSummary = function(language: 'en' | 'ne' = 'en'): string | undefined {
  if (!this.summary) return undefined;
  
  if (language === 'ne' && this.summary.ne) {
    return this.summary.ne;
  }
  return this.summary.en;
};

// Instance method to check if translation exists
newsItemSchema.methods.hasTranslation = function(language: 'en' | 'ne'): boolean {
  if (language === 'en') {
    return Boolean(this.headline.en);
  }
  return Boolean(this.headline.ne);
};

// Instance method to publish news item
newsItemSchema.methods.publish = function(): void {
  this.publishedAt = new Date();
  this.isActive = true;
};

// Pre-save middleware to ensure data consistency
newsItemSchema.pre('save', function(next) {
  // Ensure language is valid
  if (this.language && !['en', 'ne'].includes(this.language)) {
    this.language = 'en'; // Default to English
  }
  
  // If no published date is set and item is active, set it to now
  if (this.isActive && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Create and export the NewsItem model
export const NewsItem = mongoose.model<INewsItem>('NewsItem', newsItemSchema);