import mongoose, { Document, Schema } from 'mongoose';
import { MultilingualField, multilingualFieldSchema } from './types/multilingual';

// Mayor message document interface
export interface IMayorMessage extends Document {
  text: MultilingualField;
  imageUrl?: string;
  scrollSpeed: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  activate(): void;
  deactivate(): void;
  updateScrollSpeed(speed: number): void;
  setImage(imageUrl: string): void;
  removeImage(): void;
  getLocalizedText(language?: 'en' | 'ne'): string;
  
  // Virtual population
  creator?: any;
}

// Mayor message schema definition
const mayorMessageSchema = new Schema<IMayorMessage>({
  text: {
    type: multilingualFieldSchema,
    required: [true, 'Mayor message text is required'],
    validate: {
      validator: function(text: MultilingualField) {
        return text.en && text.en.length >= 5 && text.en.length <= 1000;
      },
      message: 'Message text must be between 5 and 1000 characters'
    }
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        return urlRegex.test(url);
      },
      message: 'Image URL must be a valid URL ending in jpg, jpeg, png, gif, or webp'
    }
  },
  scrollSpeed: {
    type: Number,
    required: [true, 'Scroll speed is required'],
    min: [10, 'Scroll speed must be at least 10 pixels per second'],
    max: [500, 'Scroll speed cannot exceed 500 pixels per second'],
    default: 50,
    validate: {
      validator: function(speed: number) {
        return Number.isFinite(speed) && speed > 0;
      },
      message: 'Scroll speed must be a positive number'
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

// Indexes for performance
mayorMessageSchema.index({ isActive: 1, updatedAt: -1 }); // Active messages by update date
mayorMessageSchema.index({ createdBy: 1, createdAt: -1 }); // Creator's messages by date

// Virtual populate for creator data
mayorMessageSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Instance method to activate mayor message
mayorMessageSchema.methods.activate = function(): void {
  this.isActive = true;
};

// Instance method to deactivate mayor message
mayorMessageSchema.methods.deactivate = function(): void {
  this.isActive = false;
};

// Instance method to update scroll speed
mayorMessageSchema.methods.updateScrollSpeed = function(speed: number): void {
  if (speed < 10 || speed > 500 || !Number.isFinite(speed)) {
    throw new Error('Scroll speed must be between 10 and 500 pixels per second');
  }
  this.scrollSpeed = speed;
};

// Instance method to set image URL
mayorMessageSchema.methods.setImage = function(imageUrl: string): void {
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
  if (!urlRegex.test(imageUrl)) {
    throw new Error('Invalid image URL format');
  }
  this.imageUrl = imageUrl;
};

// Instance method to get localized text
mayorMessageSchema.methods.getLocalizedText = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.text.ne) {
    return this.text.ne;
  }
  return this.text.en;
};

// Instance method to remove image
mayorMessageSchema.methods.removeImage = function(): void {
  this.imageUrl = undefined;
};

// Pre-save middleware to ensure only one active message at a time
mayorMessageSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate all other messages when this one is activated
    await mongoose.model('MayorMessage').updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  
  // Round scroll speed to nearest integer
  if (this.scrollSpeed) {
    this.scrollSpeed = Math.round(this.scrollSpeed);
  }
  
  next();
});

// Create and export the MayorMessage model
export const MayorMessage = mongoose.model<IMayorMessage>('MayorMessage', mayorMessageSchema);