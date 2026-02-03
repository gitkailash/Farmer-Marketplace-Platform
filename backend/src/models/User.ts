import mongoose, { Document, Schema } from 'mongoose';
import * as bcrypt from 'bcrypt';

// User role enumeration
export enum UserRole {
  VISITOR = 'VISITOR',
  BUYER = 'BUYER',
  FARMER = 'FARMER',
  ADMIN = 'ADMIN'
}

// User locale preferences interface
export interface ILocalePreferences {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

// User profile interface
export interface IUserProfile {
  name: string;
  phone?: string;
  address?: string;
}

// User document interface
export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  profile: IUserProfile;
  language: 'en' | 'ne';
  localePreferences: ILocalePreferences;
  lastLanguageUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toJSON(): any;
}

// User schema definition
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: [true, 'User role is required'],
    default: UserRole.VISITOR
  },
  profile: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    }
  },
  language: {
    type: String,
    enum: ['en', 'ne'],
    required: [true, 'Language preference is required'],
    default: 'en',
    validate: {
      validator: function(lang: string) {
        return ['en', 'ne'].includes(lang);
      },
      message: 'Language must be either "en" (English) or "ne" (Nepali)'
    }
  },
  localePreferences: {
    dateFormat: {
      type: String,
      required: [true, 'Date format is required'],
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'],
      default: 'DD/MM/YYYY'
    },
    timeFormat: {
      type: String,
      required: [true, 'Time format is required'],
      enum: ['12h', '24h'],
      default: '24h'
    },
    numberFormat: {
      type: String,
      required: [true, 'Number format is required'],
      enum: ['1,234.56', '1.234,56', '1 234,56', '1234.56'],
      default: '1,234.56'
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      enum: ['NPR', 'USD', 'EUR'],
      default: 'NPR'
    }
  },
  lastLanguageUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and uniqueness
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.name': 1 });
userSchema.index({ language: 1 });
userSchema.index({ lastLanguageUpdate: -1 });

// Pre-save middleware to hash password and update language timestamp
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (this.isModified('password')) {
    try {
      // Hash password with cost of 12
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (error) {
      return next(error as Error);
    }
  }

  // Update lastLanguageUpdate if language was modified
  if (this.isModified('language')) {
    this.lastLanguageUpdate = new Date();
  }

  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Override toJSON to exclude password from responses
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Create and export the User model
export const User = mongoose.model<IUser>('User', userSchema);