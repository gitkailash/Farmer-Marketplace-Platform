import mongoose, { Document, Schema } from 'mongoose';
import { MultilingualField, multilingualFieldSchema } from './types/multilingual';

// Gallery item document interface
export interface IGalleryItem extends Document {
  title: MultilingualField;
  description?: MultilingualField;
  imageUrl: string;
  category: {
    en: string;
    ne?: string;
  };
  order: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  activate(): void;
  deactivate(): void;
  updateOrder(newOrder: number): void;
  getLocalizedTitle(language?: 'en' | 'ne'): string;
  getLocalizedDescription(language?: 'en' | 'ne'): string | undefined;
  getLocalizedCategory(language?: 'en' | 'ne'): string;
  hasTranslation(language: 'en' | 'ne'): boolean;
  
  // Virtual population
  creator?: any;
}

// Gallery item schema definition
const galleryItemSchema = new Schema<IGalleryItem>({
  title: {
    type: multilingualFieldSchema,
    required: [true, 'Gallery item title is required'],
    validate: {
      validator: function(title: MultilingualField) {
        return title.en && title.en.length >= 2 && title.en.length <= 200;
      },
      message: 'Title must be between 2 and 200 characters'
    }
  },
  description: {
    type: multilingualFieldSchema,
    validate: {
      validator: function(description: MultilingualField) {
        if (!description) return true; // Optional field
        return !description.en || (description.en.length >= 5 && description.en.length <= 1000);
      },
      message: 'Description must be between 5 and 1000 characters if provided'
    }
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true,
    validate: {
      validator: function(url: string) {
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        return urlRegex.test(url);
      },
      message: 'Image URL must be a valid URL ending in jpg, jpeg, png, gif, or webp'
    }
  },
  category: {
    en: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
      enum: {
        values: [
          'Featured Products',
          'Farm Life',
          'Community Events',
          'Seasonal Highlights',
          'Success Stories',
          'Educational',
          'Other'
        ],
        message: 'Please select a valid category'
      }
    },
    ne: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    }
  },
  order: {
    type: Number,
    required: [true, 'Display order is required'],
    min: [0, 'Order cannot be negative'],
    max: [9999, 'Order cannot exceed 9999'],
    validate: {
      validator: function(order: number) {
        return Number.isInteger(order);
      },
      message: 'Order must be a whole number'
    }
  },
  isActive: {
    type: Boolean,
    required: [true, 'Active status is required'],
    default: true
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

// Indexes for performance and ordering
galleryItemSchema.index({ isActive: 1, order: 1 }); // Active items by display order
galleryItemSchema.index({ 'category.en': 1, isActive: 1 }); // Category filtering
galleryItemSchema.index({ createdBy: 1, createdAt: -1 }); // Creator's items by date
galleryItemSchema.index({ order: 1 }, { unique: true }); // Ensure unique ordering
galleryItemSchema.index({ 'title.en': 'text', 'description.en': 'text', 'title.ne': 'text', 'description.ne': 'text' }); // Multilingual text search

// Virtual populate for creator data
galleryItemSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to get localized title
galleryItemSchema.methods.getLocalizedTitle = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.title.ne) {
    return this.title.ne;
  }
  return this.title.en;
};

// Instance method to get localized description
galleryItemSchema.methods.getLocalizedDescription = function(language: 'en' | 'ne' = 'en'): string | undefined {
  if (!this.description) return undefined;
  
  if (language === 'ne' && this.description.ne) {
    return this.description.ne;
  }
  return this.description.en;
};

// Instance method to get localized category
galleryItemSchema.methods.getLocalizedCategory = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.category.ne) {
    return this.category.ne;
  }
  return this.category.en;
};

// Instance method to check if translation exists
galleryItemSchema.methods.hasTranslation = function(language: 'en' | 'ne'): boolean {
  if (language === 'en') {
    return Boolean(this.title.en);
  }
  return Boolean(this.title.ne);
};

// Instance method to activate gallery item
galleryItemSchema.methods.activate = function(): void {
  this.isActive = true;
};

// Instance method to deactivate gallery item
galleryItemSchema.methods.deactivate = function(): void {
  this.isActive = false;
};

// Instance method to update display order
galleryItemSchema.methods.updateOrder = function(newOrder: number): void {
  if (newOrder < 0 || !Number.isInteger(newOrder)) {
    throw new Error('Order must be a non-negative integer');
  }
  this.order = newOrder;
};

// Pre-save middleware to handle ordering conflicts
galleryItemSchema.pre('save', async function(next) {
  if (this.isModified('order')) {
    // Check if another item has the same order
    const existingItem = await mongoose.model('GalleryItem').findOne({
      order: this.order,
      _id: { $ne: this._id }
    });
    
    if (existingItem) {
      // Shift other items to make room
      await mongoose.model('GalleryItem').updateMany(
        { order: { $gte: this.order }, _id: { $ne: this._id } },
        { $inc: { order: 1 } }
      );
    }
  }
  
  next();
});

// Create and export the GalleryItem model
export const GalleryItem = mongoose.model<IGalleryItem>('GalleryItem', galleryItemSchema);