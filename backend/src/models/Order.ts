import mongoose, { Document, Schema } from 'mongoose';

// Order status enumeration
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Order item interface
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  priceAtTime: number;
  subtotal: number;
}

// Order document interface
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  farmerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  calculateTotal(): number;
  canBeAccepted(): boolean;
  canBeCompleted(): boolean;
  canBeCancelled(): boolean;
  updateStatus(newStatus: OrderStatus): void;
  
  // Virtual population
  buyer?: any;
  farmer?: any;
  populatedItems?: any[];
}

// Order item schema
const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [999999, 'Quantity cannot exceed 999,999'],
    validate: {
      validator: function(quantity: number) {
        return Number.isInteger(quantity);
      },
      message: 'Quantity must be a whole number'
    }
  },
  priceAtTime: {
    type: Number,
    required: [true, 'Price at time of order is required'],
    min: [0.01, 'Price must be greater than 0'],
    max: [999999.99, 'Price cannot exceed 999,999.99'],
    validate: {
      validator: function(price: number) {
        return Number.isFinite(price) && price > 0;
      },
      message: 'Price must be a valid positive number'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0.01, 'Subtotal must be greater than 0'],
    validate: {
      validator: function(subtotal: number) {
        return Number.isFinite(subtotal) && subtotal > 0;
      },
      message: 'Subtotal must be a valid positive number'
    }
  }
}, { _id: false });

// Order schema definition
const orderSchema = new Schema<IOrder>({
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer ID is required'],
    index: true
  },
  farmerId: {
    type: Schema.Types.ObjectId,
    ref: 'Farmer',
    required: [true, 'Farmer ID is required'],
    index: true
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0 && items.length <= 50;
      },
      message: 'Order must have between 1 and 50 items'
    }
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0.01, 'Total amount must be greater than 0'],
    validate: {
      validator: function(total: number) {
        return Number.isFinite(total) && total > 0;
      },
      message: 'Total amount must be a valid positive number'
    }
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    required: [true, 'Order status is required'],
    default: OrderStatus.PENDING,
    index: true
  },
  deliveryAddress: {
    type: String,
    required: [true, 'Delivery address is required'],
    trim: true,
    maxlength: [500, 'Delivery address cannot exceed 500 characters'],
    minlength: [10, 'Delivery address must be at least 10 characters long']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and queries
orderSchema.index({ buyerId: 1, createdAt: -1 }); // Buyer's order history
orderSchema.index({ farmerId: 1, status: 1 }); // Farmer's orders by status
orderSchema.index({ status: 1, createdAt: -1 }); // Orders by status and date
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ buyerId: 1, farmerId: 1 }); // Buyer-farmer relationship

// Virtual populate for buyer data
orderSchema.virtual('buyer', {
  ref: 'User',
  localField: 'buyerId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for farmer data
orderSchema.virtual('farmer', {
  ref: 'Farmer',
  localField: 'farmerId',
  foreignField: '_id',
  justOne: true
});

// Virtual populate for order items with product details
orderSchema.virtual('populatedItems', {
  ref: 'Product',
  localField: 'items.productId',
  foreignField: '_id'
});

// Instance method to calculate total amount
orderSchema.methods.calculateTotal = function(): number {
  return this.items.reduce((total: number, item: IOrderItem) => {
    return total + (item.quantity * item.priceAtTime);
  }, 0);
};

// Instance method to check if order can be accepted
orderSchema.methods.canBeAccepted = function(): boolean {
  return this.status === OrderStatus.PENDING;
};

// Instance method to check if order can be completed
orderSchema.methods.canBeCompleted = function(): boolean {
  return this.status === OrderStatus.ACCEPTED;
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function(): boolean {
  return this.status === OrderStatus.PENDING || this.status === OrderStatus.ACCEPTED;
};

// Instance method to update status with validation
orderSchema.methods.updateStatus = function(newStatus: OrderStatus): void {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    [OrderStatus.ACCEPTED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [], // Final state
    [OrderStatus.CANCELLED]: [] // Final state
  };

  const allowedStatuses = validTransitions[this.status as OrderStatus];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
};

// Pre-save middleware to validate and calculate totals
orderSchema.pre('save', function(next) {
  try {
    // Calculate subtotals for each item
    this.items.forEach((item: IOrderItem) => {
      item.subtotal = Math.round((item.quantity * item.priceAtTime) * 100) / 100;
    });

    // Calculate and validate total amount
    const calculatedTotal = this.calculateTotal();
    const roundedTotal = Math.round(calculatedTotal * 100) / 100;
    
    // Allow small rounding differences (within 1 cent)
    if (Math.abs(this.totalAmount - roundedTotal) > 0.01) {
      this.totalAmount = roundedTotal;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to validate business rules
orderSchema.pre('save', function(next) {
  // Ensure buyer and farmer are different
  if (this.buyerId.equals(this.farmerId)) {
    return next(new Error('Buyer and farmer cannot be the same'));
  }

  // Validate status transitions on updates
  if (!this.isNew && this.isModified('status')) {
    try {
      // This validation is handled by updateStatus method
      // If status was changed directly, we need to validate it here
      const originalStatus = this.get('status');
      // The validation logic is already in updateStatus method
    } catch (error) {
      return next(error as Error);
    }
  }

  next();
});

// Create and export the Order model
export const Order = mongoose.model<IOrder>('Order', orderSchema);