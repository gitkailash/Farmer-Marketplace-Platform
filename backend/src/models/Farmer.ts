import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

// Location interface
export interface ILocation {
  district: string;
  municipality: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

// Farmer document interface
export interface IFarmer extends Document {
  userId: mongoose.Types.ObjectId;
  location: ILocation;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateRating(newRating: number, isNewReview?: boolean): void;
  
  // Virtual population
  user?: IUser;
}

// Farmer schema definition
const farmerSchema = new Schema<IFarmer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  location: {
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      maxlength: [100, 'District name cannot exceed 100 characters']
    },
    municipality: {
      type: String,
      required: [true, 'Municipality is required'],
      trim: true,
      maxlength: [100, 'Municipality name cannot exceed 100 characters']
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(coords: number[]) {
          return !coords || (coords.length === 2 && 
            coords[0] != null && coords[1] != null &&
            coords[0] >= -180 && coords[0] <= 180 && // longitude
            coords[1] >= -90 && coords[1] <= 90);    // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(rating: number) {
        // Allow 0 for new farmers, or valid ratings between 1-5
        return rating === 0 || (rating >= 1 && rating <= 5);
      },
      message: 'Rating must be between 1 and 5, or 0 for new farmers'
    }
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
farmerSchema.index({ userId: 1 }, { unique: true });
farmerSchema.index({ 'location.district': 1 });
farmerSchema.index({ 'location.municipality': 1 });
farmerSchema.index({ rating: -1 }); // Descending for top-rated farmers
farmerSchema.index({ isVerified: 1 });

// Geospatial index for location-based queries (if coordinates are provided)
farmerSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual populate for user data
farmerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to update rating based on reviews
farmerSchema.methods.updateRating = function(newRating: number, isNewReview: boolean = true) {
  if (isNewReview) {
    // Add new review to calculation
    const totalRating = (this.rating * this.reviewCount) + newRating;
    this.reviewCount += 1;
    this.rating = totalRating / this.reviewCount;
  } else {
    // Recalculate from all reviews (used when review is removed)
    // This would typically be called with the new calculated values
    this.rating = newRating;
  }
  
  // Round to 2 decimal places
  this.rating = Math.round(this.rating * 100) / 100;
};

// Create and export the Farmer model
export const Farmer = mongoose.model<IFarmer>('Farmer', farmerSchema);