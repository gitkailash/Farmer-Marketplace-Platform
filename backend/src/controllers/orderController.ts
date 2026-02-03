import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Order, OrderStatus, Product, Farmer, User, UserRole } from '../models';
import mongoose from 'mongoose';

// Order request interfaces
interface CreateOrderRequest {
  farmerId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryAddress: string;
  notes?: string;
}

interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

interface OrderSearchQuery {
  status?: OrderStatus;
  farmerId?: string;
  buyerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Extended Request interfaces
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
  };
}

interface CreateOrderAuthRequest extends AuthenticatedRequest {
  body: CreateOrderRequest;
}

interface UpdateOrderAuthRequest extends AuthenticatedRequest {
  body: UpdateOrderStatusRequest;
  params: {
    id: string;
  };
}

interface OrderSearchRequest extends AuthenticatedRequest {
  query: OrderSearchQuery & { [key: string]: any };
}

/**
 * Create a new order
 * POST /api/orders
 * Requires: BUYER role
 */
export const createOrder = async (req: CreateOrderAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Verify user is a buyer
    if (req.user?.role !== UserRole.BUYER) {
      res.status(403).json({
        success: false,
        message: 'Only buyers can create orders'
      });
      return;
    }

    const { farmerId, items, deliveryAddress, notes } = req.body;

    // Validate farmer exists
    const farmer = await Farmer.findById(farmerId);
    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Farmer not found'
      });
      return;
    }

    // Validate and process order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
        return;
      }

      // Check if product belongs to the specified farmer
      if (!product.farmerId.equals(farmerId)) {
        res.status(400).json({
          success: false,
          message: `Product ${product.name} does not belong to the specified farmer`
        });
        return;
      }

      // Check if product is available and has sufficient stock
      if (!product.canBeOrderedBy(item.quantity)) {
        res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available or insufficient stock (requested: ${item.quantity}, available: ${product.stock})`
        });
        return;
      }

      const subtotal = item.quantity * product.price;
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtTime: product.price,
        subtotal
      });

      totalAmount += subtotal;
    }

    // Create order
    const order = new Order({
      buyerId: new mongoose.Types.ObjectId(userId),
      farmerId: new mongoose.Types.ObjectId(farmerId),
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      deliveryAddress,
      notes,
      status: OrderStatus.PENDING
    });

    await order.save();

    // Update product stock for all items
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.updateStock(-item.quantity); // Reduce stock
        await product.save();
      }
    }

    // Populate order data for response
    const populatedOrder = await Order.findById(order._id)
      .populate('buyer', 'profile.name email')
      .populate('farmer', 'location rating reviewCount')
      .populate('items.productId', 'name category unit images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get orders with filtering and pagination
 * GET /api/orders
 * Requires: Authentication (buyers see their orders, farmers see orders for their products, admins see all)
 */
export const getOrders = async (req: OrderSearchRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const {
      status,
      farmerId,
      buyerId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query based on user role
    const query: any = {};

    if (userRole === UserRole.ADMIN) {
      // Admin can see all orders
      if (status) query.status = status;
      if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
        query.farmerId = new mongoose.Types.ObjectId(farmerId);
      }
      if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
        query.buyerId = new mongoose.Types.ObjectId(buyerId);
      }
    } else if (userRole === UserRole.BUYER) {
      // Buyers can only see their own orders
      query.buyerId = new mongoose.Types.ObjectId(userId);
      if (status) query.status = status;
      if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
        query.farmerId = new mongoose.Types.ObjectId(farmerId);
      }
    } else if (userRole === UserRole.FARMER) {
      // Farmers can only see orders for their products
      const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!farmer) {
        res.status(404).json({
          success: false,
          message: 'Farmer profile not found'
        });
        return;
      }
      
      query.farmerId = farmer._id;
      if (status) query.status = status;
      if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
        query.buyerId = new mongoose.Types.ObjectId(buyerId);
      }
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'profile.name email')
        .populate('farmer', 'location rating reviewCount')
        .populate('items.productId', 'name category unit images')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single order by ID
 * GET /api/orders/:id
 * Requires: Authentication (access control based on user role)
 */
export const getOrderById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findById(id)
      .populate('buyer', 'profile.name email')
      .populate('farmer', 'location rating reviewCount')
      .populate('items.productId', 'name category unit images');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check access permissions
    let hasAccess = false;

    if (userRole === UserRole.ADMIN) {
      hasAccess = true;
    } else if (userRole === UserRole.BUYER && order.buyerId.toString() === userId) {
      hasAccess = true;
    } else if (userRole === UserRole.FARMER) {
      const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (farmer && order.farmerId.equals(farmer._id)) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update order status
 * PUT /api/orders/:id/status
 * Requires: FARMER role (for their orders) or ADMIN
 */
export const updateOrderStatus = async (req: UpdateOrderAuthRequest, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check permissions
    let canUpdate = false;

    if (userRole === UserRole.ADMIN) {
      canUpdate = true;
    } else if (userRole === UserRole.FARMER) {
      const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (farmer && order.farmerId.equals(farmer._id)) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only the farmer or admin can update order status'
      });
      return;
    }

    // Validate status transition
    try {
      order.updateStatus(status);
      await order.save();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Invalid status transition'
      });
      return;
    }

    // If order is cancelled, restore product stock
    if (status === OrderStatus.CANCELLED) {
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.updateStock(item.quantity); // Restore stock
          await product.save();
        }
      }
    }

    // Populate order data for response
    await order.populate([
      { path: 'buyer', select: 'profile.name email' },
      { path: 'farmer', select: 'location rating reviewCount' },
      { path: 'items.productId', select: 'name category unit images' }
    ]);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Cancel an order
 * DELETE /api/orders/:id
 * Requires: BUYER role (for their orders) or ADMIN
 */
export const cancelOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found'
      });
      return;
    }

    // Check permissions
    let canCancel = false;

    if (userRole === UserRole.ADMIN) {
      canCancel = true;
    } else if (userRole === UserRole.BUYER && order.buyerId.toString() === userId) {
      canCancel = true;
    }

    if (!canCancel) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only the buyer or admin can cancel orders'
      });
      return;
    }

    // Check if order can be cancelled
    if (!order.canBeCancelled()) {
      res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.status}`
      });
      return;
    }

    // Update order status to cancelled
    order.updateStatus(OrderStatus.CANCELLED);
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.updateStock(item.quantity); // Restore stock
        await product.save();
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get order history for the authenticated user
 * GET /api/orders/history
 * Requires: Authentication (buyers get their orders, farmers get orders for their products)
 */
export const getOrderHistory = async (req: OrderSearchRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query based on user role
    const query: any = {};

    if (userRole === UserRole.BUYER) {
      query.buyerId = new mongoose.Types.ObjectId(userId);
    } else if (userRole === UserRole.FARMER) {
      const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(userId) });
      if (!farmer) {
        res.status(404).json({
          success: false,
          message: 'Farmer profile not found'
        });
        return;
      }
      query.farmerId = farmer._id;
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied'
      });
      return;
    }

    if (status) query.status = status;

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('buyer', 'profile.name email')
        .populate('farmer', 'location rating reviewCount')
        .populate('items.productId', 'name category unit images')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};