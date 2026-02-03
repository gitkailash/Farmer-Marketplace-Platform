import mongoose, { Document, Schema } from 'mongoose';

// Translation history document interface
export interface ITranslationHistory extends Document {
  translationKey: mongoose.Types.ObjectId;
  key: string;
  namespace: string;
  version: number;
  translations: {
    en: string;
    ne?: string;
  };
  context?: string;
  isRequired: boolean;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  changedBy: mongoose.Types.ObjectId;
  changeReason?: string;
  createdAt: Date;
  
  // Methods
  getChangeSummary(): string;
  compareWith(other: ITranslationHistory): string[];
}

// Translation history schema definition
const translationHistorySchema = new Schema<ITranslationHistory>({
  translationKey: {
    type: Schema.Types.ObjectId,
    ref: 'TranslationKey',
    required: [true, 'Translation key reference is required'],
    index: true
  },
  key: {
    type: String,
    required: [true, 'Translation key is required'],
    trim: true,
    maxlength: [200, 'Translation key cannot exceed 200 characters'],
    index: true
  },
  namespace: {
    type: String,
    required: [true, 'Namespace is required'],
    trim: true,
    lowercase: true,
    index: true
  },
  version: {
    type: Number,
    required: [true, 'Version number is required'],
    min: [1, 'Version must be at least 1'],
    index: true
  },
  translations: {
    en: {
      type: String,
      required: [true, 'English translation is required'],
      trim: true,
      maxlength: [2000, 'English translation cannot exceed 2000 characters']
    },
    ne: {
      type: String,
      trim: true,
      maxlength: [2000, 'Nepali translation cannot exceed 2000 characters']
    }
  },
  context: {
    type: String,
    trim: true,
    maxlength: [500, 'Context cannot exceed 500 characters']
  },
  isRequired: {
    type: Boolean,
    required: [true, 'Required status is required'],
    default: false
  },
  changeType: {
    type: String,
    required: [true, 'Change type is required'],
    enum: {
      values: ['CREATE', 'UPDATE', 'DELETE'],
      message: 'Change type must be CREATE, UPDATE, or DELETE'
    },
    index: true
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Changed by user ID is required'],
    index: true
  },
  changeReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Change reason cannot exceed 500 characters']
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
translationHistorySchema.index({ translationKey: 1, version: -1 }); // Latest versions first
translationHistorySchema.index({ key: 1, version: -1 }); // History by key
translationHistorySchema.index({ namespace: 1, createdAt: -1 }); // Recent changes by namespace
translationHistorySchema.index({ changedBy: 1, createdAt: -1 }); // User's recent changes
translationHistorySchema.index({ changeType: 1, createdAt: -1 }); // Changes by type

// Virtual populate for user data
translationHistorySchema.virtual('changer', {
  ref: 'User',
  localField: 'changedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for translation key data
translationHistorySchema.virtual('translationKeyData', {
  ref: 'TranslationKey',
  localField: 'translationKey',
  foreignField: '_id',
  justOne: true
});

// Instance method to get change summary
translationHistorySchema.methods.getChangeSummary = function(): string {
  const changeType = this.changeType.toLowerCase();
  const hasNepali = Boolean(this.translations.ne);
  
  switch (this.changeType) {
    case 'CREATE':
      return `Created translation key "${this.key}" with ${hasNepali ? 'both English and Nepali' : 'English only'} translations`;
    case 'UPDATE':
      return `Updated translation key "${this.key}" (version ${this.version})`;
    case 'DELETE':
      return `Deleted translation key "${this.key}"`;
    default:
      return `Modified translation key "${this.key}"`;
  }
};

// Instance method to compare with another version
translationHistorySchema.methods.compareWith = function(other: ITranslationHistory): string[] {
  const changes: string[] = [];
  
  if (this.translations.en !== other.translations.en) {
    changes.push('English translation changed');
  }
  
  if (this.translations.ne !== other.translations.ne) {
    if (!this.translations.ne && other.translations.ne) {
      changes.push('Nepali translation removed');
    } else if (this.translations.ne && !other.translations.ne) {
      changes.push('Nepali translation added');
    } else {
      changes.push('Nepali translation changed');
    }
  }
  
  if (this.context !== other.context) {
    changes.push('Context changed');
  }
  
  if (this.isRequired !== other.isRequired) {
    changes.push(`Required status changed to ${this.isRequired ? 'required' : 'optional'}`);
  }
  
  return changes;
};

// Static method to get version history for a translation key
translationHistorySchema.statics.getVersionHistory = async function(
  translationKeyId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({ translationKey: translationKeyId })
    .sort({ version: -1 })
    .limit(limit)
    .populate('changer', 'profile.name email')
    .lean();
};

// Static method to get recent changes
translationHistorySchema.statics.getRecentChanges = async function(
  namespace?: string,
  limit: number = 50
) {
  const query: any = {};
  if (namespace && namespace.trim() !== '') {
    query.namespace = namespace;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('changer', 'profile.name email')
    .lean();
};

// Static method to create history entry
translationHistorySchema.statics.createHistoryEntry = async function(
  translationKey: any,
  changeType: 'CREATE' | 'UPDATE' | 'DELETE',
  changedBy: mongoose.Types.ObjectId,
  changeReason?: string
) {
  // Get the next version number
  const lastVersion = await this.findOne({ 
    translationKey: translationKey._id 
  }).sort({ version: -1 });
  
  const nextVersion = lastVersion ? lastVersion.version + 1 : 1;
  
  const historyEntry = new this({
    translationKey: translationKey._id,
    key: translationKey.key,
    namespace: translationKey.namespace,
    version: nextVersion,
    translations: {
      en: translationKey.translations.en,
      ne: translationKey.translations.ne
    },
    context: translationKey.context,
    isRequired: translationKey.isRequired,
    changeType,
    changedBy,
    changeReason
  });
  
  return await historyEntry.save();
};

// Create and export the TranslationHistory model
export const TranslationHistory = mongoose.model<ITranslationHistory>('TranslationHistory', translationHistorySchema);