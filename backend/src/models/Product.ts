import mongoose, { Document, Schema } from 'mongoose';
import { MultilingualField, multilingualFieldSchema } from './types/multilingual';

// Product status enumeration
export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  INACTIVE = 'INACTIVE'
}

// Product document interface
export interface IProduct extends Document {
  farmerId: mongoose.Types.ObjectId;
  name: MultilingualField;
  description: MultilingualField;
  category: {
    en: string;
    ne?: string;
  };
  price: number;
  unit: string;
  stock: number;
  images: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isAvailable(): boolean;
  canBeOrderedBy(quantity: number): boolean;
  updateStock(quantity: number): void;
  getLocalizedName(language?: 'en' | 'ne'): string;
  getLocalizedDescription(language?: 'en' | 'ne'): string;
  getLocalizedCategory(language?: 'en' | 'ne'): string;
  
  // Virtual population
  farmer?: any;
}

// Product schema definition
const productSchema = new Schema<IProduct>({
  farmerId: {
    type: Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID is required'],
    index: true
  },
  name: {
    type: multilingualFieldSchema,
    required: [true, 'Product name is required'],
    validate: {
      validator: function(name: MultilingualField) {
        return name.en && name.en.length >= 2 && name.en.length <= 200;
      },
      message: 'Product name must be between 2 and 200 characters'
    }
  },
  description: {
    type: multilingualFieldSchema,
    required: [true, 'Product description is required'],
    validate: {
      validator: function(description: MultilingualField) {
        return description.en && description.en.length >= 10 && description.en.length <= 2000;
      },
      message: 'Product description must be between 10 and 2000 characters'
    }
  },
  category: {
    en: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      enum: {
        values: [
          'Vegetables',
          'Fruits',
          'Grains',
          'Dairy',
          'Meat',
          'Herbs',
          'Spices',
          'Nuts',
          'Seeds',
          'Other'
        ],
        message: 'Please select a valid category'
      }
    },
    ne: {
      type: String,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters']
    }
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [999999.99, 'Price cannot exceed 999,999.99'],
    validate: {
      validator: function(price: number) {
        // Ensure price is a valid number
        return Number.isFinite(price) && price > 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  unit: {
    type: String,
    required: [true, 'Product unit is required'],
    trim: true,
    enum: {
      values: ['kg', 'g', 'lb', 'piece', 'dozen', 'liter', 'ml', 'bunch', 'bag', 'box'],
      message: 'Please select a valid unit'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    max: [999999, 'Stock cannot exceed 999,999'],
    validate: {
      validator: function(stock: number) {
        return Number.isInteger(stock);
      },
      message: 'Stock must be a whole number'
    }
  },
  images: {
    type: [String],
    validate: {
      validator: function(images: string[]) {
        // Allow empty array or up to 10 images
        if (images.length > 10) return false;
        
        // Validate each URL format
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
        return images.every(url => urlRegex.test(url));
      },
      message: 'Images must be valid URLs ending in jpg, jpeg, png, gif, or webp (max 10 images)'
    },
    default: []
  },
  status: {
    type: String,
    enum: Object.values(ProductStatus),
    required: [true, 'Product status is required'],
    default: ProductStatus.DRAFT
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and search functionality
productSchema.index({ farmerId: 1, status: 1 }); // Farmer's products by status
productSchema.index({ status: 1, 'category.en': 1 }); // Public browsing by category
productSchema.index({ status: 1, createdAt: -1 }); // Latest products
productSchema.index({ 'name.en': 'text', 'description.en': 'text', 'name.ne': 'text', 'description.ne': 'text' }); // Multilingual text search
productSchema.index({ 'category.en': 1, status: 1, price: 1 }); // Category filtering with price sorting
productSchema.index({ 'name.en': 1, status: 1 }); // Name-based queries
productSchema.index({ 'name.ne': 1, status: 1 }); // Nepali name queries

// Virtual populate for farmer data
productSchema.virtual('farmer', {
  ref: 'Farmer',
  localField: 'farmerId',
  foreignField: '_id',
  justOne: true
});

// Instance method to get localized product name
productSchema.methods.getLocalizedName = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.name.ne) {
    return this.name.ne;
  }
  return this.name.en;
};

// Instance method to get localized product description
productSchema.methods.getLocalizedDescription = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.description.ne) {
    return this.description.ne;
  }
  return this.description.en;
};

// Instance method to get localized category
productSchema.methods.getLocalizedCategory = function(language: 'en' | 'ne' = 'en'): string {
  if (language === 'ne' && this.category.ne) {
    return this.category.ne;
  }
  return this.category.en;
};

// Instance method to check if product is available for purchase
productSchema.methods.isAvailable = function(): boolean {
  return this.status === ProductStatus.PUBLISHED && this.stock > 0;
};

// Instance method to check if a specific quantity can be ordered
productSchema.methods.canBeOrderedBy = function(quantity: number): boolean {
  return this.isAvailable() && quantity > 0 && quantity <= this.stock;
};

// Instance method to update stock (used during order processing)
productSchema.methods.updateStock = function(quantity: number): void {
  if (quantity < 0 && Math.abs(quantity) > this.stock) {
    throw new Error('Cannot reduce stock below zero');
  }
  
  this.stock += quantity; // Positive for restocking, negative for sales
  
  if (this.stock < 0) {
    this.stock = 0;
  }
};

// Pre-save middleware to ensure business rules
productSchema.pre('save', function(next) {
  // Ensure stock is 0 or positive
  if (this.stock < 0) {
    this.stock = 0;
  }
  
  // Round price to 2 decimal places
  if (this.price) {
    this.price = Math.round(this.price * 100) / 100;
  }
  
  next();
});

// Create and export the Product model
export const Product = mongoose.model<IProduct>('Product', productSchema);