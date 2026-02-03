import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Product, ProductStatus, Farmer } from '../models';
import { UserRole } from '../models/User';
import mongoose from 'mongoose';

// Product request interfaces
interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  images?: string[];
}

interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: ProductStatus;
}

interface ProductSearchQuery {
  category?: string;
  search?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  farmerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
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

interface CreateProductAuthRequest extends AuthenticatedRequest {
  body: CreateProductRequest;
}

interface UpdateProductAuthRequest extends AuthenticatedRequest {
  body: UpdateProductRequest;
  params: {
    id: string;
  };
}

interface ProductSearchRequest extends Request {
  query: ProductSearchQuery & { [key: string]: any };
}

// Export all controller functions individually
export const createProduct = async (req: CreateProductAuthRequest, res: Response): Promise<void> => {
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

    // Get farmer ID from authenticated user
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Find farmer record
    const farmer = await Farmer.findOne({ userId });
    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Farmer profile not found'
      });
      return;
    }

    // Create product
    const productData = {
      ...req.body,
      farmerId: farmer._id,
      status: ProductStatus.DRAFT // Always start as draft
    };

    const product = new Product(productData);
    await product.save();

    // Populate farmer data for response
    await product.populate('farmer');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all products with search and filtering
 * GET /api/products
 * Public endpoint (no authentication required)
 */
export const getProducts = async (req: ProductSearchRequest, res: Response): Promise<void> => {
  try {
    const {
      category,
      search,
      status = ProductStatus.PUBLISHED, // Default to published for public access
      minPrice,
      maxPrice,
      farmerId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query: any = {};

    // Status filter - only show published products for public access
    // Admin and farmers can see all statuses
    const user = (req as AuthenticatedRequest).user;
    if (user?.role === UserRole.ADMIN) {
      // Admin can see all products
      if (status) query.status = status;
    } else if (user?.role === UserRole.FARMER && user.userId) {
      // Farmers can see their own products in any status
      try {
        const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(user.userId) });
        if (farmer && farmerId === farmer._id.toString()) {
          if (status) query.status = status;
        } else {
          query.status = ProductStatus.PUBLISHED;
        }
      } catch (error) {
        query.status = ProductStatus.PUBLISHED;
      }
    } else {
      // Public access - only published products
      query.status = ProductStatus.PUBLISHED;
    }

    // Category filter
    if (category && category !== '' && category !== 'All') {
      query.category = category;
    }

    // Farmer filter
    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      query.farmerId = new mongoose.Types.ObjectId(farmerId);
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Multilingual text search
    if (search) {
      // Create a comprehensive search that covers both languages
      const searchRegex = new RegExp(search.split(' ').map(term => 
        term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join('|'), 'i');
      
      query.$or = [
        // Text search using MongoDB text index (covers both languages)
        { $text: { $search: search } },
        // Regex search for partial matches in both languages
        { 'name.en': searchRegex },
        { 'name.ne': searchRegex },
        { 'description.en': searchRegex },
        { 'description.ne': searchRegex },
        { 'category.en': searchRegex },
        { 'category.ne': searchRegex }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Sorting with language preference consideration
    const sortOptions: any = {};
    
    // Get user's preferred language from request headers or user profile
    const preferredLanguage = req.headers['accept-language']?.includes('ne') ? 'ne' : 'en';
    
    if (search) {
      // When searching, sort by text score first, then by language preference
      sortOptions.score = { $meta: 'textScore' };
      
      // Add language preference boost in aggregation pipeline if needed
      // For now, we'll use the existing sort and let text score handle relevance
    }
    
    // Apply secondary sorting
    if (sortBy === 'name') {
      // Sort by name in preferred language, fallback to English
      sortOptions[`name.${preferredLanguage}`] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'farmer',
          select: 'location rating reviewCount isVerified userId',
          populate: {
            path: 'userId',
            select: 'profile.name profile.phone profile.address'
          }
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: products,
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
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get a single product by ID
 * GET /api/products/:id
 * Public endpoint
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
      return;
    }

    const product = await Product.findById(id)
      .populate({
        path: 'farmer',
        select: 'location rating reviewCount isVerified userId',
        populate: {
          path: 'userId',
          select: 'profile.name profile.phone profile.address'
        }
      });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    // Check if user can view this product
    const user = (req as AuthenticatedRequest).user;
    const canView = 
      product.status === ProductStatus.PUBLISHED || // Public can see published
      user?.role === UserRole.ADMIN || // Admin can see all
      (user?.role === UserRole.FARMER && user.userId && await isProductOwner(user.userId, product.farmerId)); // Farmer can see own

    if (!canView) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update a product
 * PUT /api/products/:id
 * Requires: FARMER role (owner) or ADMIN
 */
export const updateProduct = async (req: UpdateProductAuthRequest, res: Response): Promise<void> => {
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
    const userId = req.user?.userId;

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
        message: 'Invalid product ID'
      });
      return;
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    // Check ownership (farmer can only update own products, admin can update any)
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const isOwner = await isProductOwner(userId, product.farmerId);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products'
      });
      return;
    }

    // Update product
    Object.assign(product, req.body);
    await product.save();

    // Populate farmer data for response
    await product.populate('farmer');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a product
 * DELETE /api/products/:id
 * Requires: FARMER role (owner) or ADMIN
 */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

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
        message: 'Invalid product ID'
      });
      return;
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    // Check ownership (farmer can only delete own products, admin can delete any)
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const isOwner = await isProductOwner(userId, product.farmerId);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products'
      });
      return;
    }

    // Delete product
    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get products by farmer
 * GET /api/products/farmer/:farmerId
 * Public endpoint for published products, authenticated for own products
 */
export const getProductsByFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Validate ObjectId
    if (!farmerId || !mongoose.Types.ObjectId.isValid(farmerId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid farmer ID'
      });
      return;
    }

    // Build query
    const query: any = { farmerId: new mongoose.Types.ObjectId(farmerId) };

    // Status filter based on user permissions
    const user = (req as AuthenticatedRequest).user;
    const isAdmin = user?.role === UserRole.ADMIN;
    const isOwner = user?.userId ? await isProductOwner(user.userId, farmerId) : false;

    if (isAdmin || isOwner) {
      // Admin or owner can see all statuses
      if (status) query.status = status;
    } else {
      // Public can only see published products
      query.status = ProductStatus.PUBLISHED;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'location rating reviewCount isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: products,
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
    console.error('Get products by farmer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farmer products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get current farmer's products
 * GET /api/products/my-products
 * Requires: FARMER role
 */
export const getMyProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const user = (req as AuthenticatedRequest).user;

    if (!user?.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Find farmer record for the authenticated user
    const farmer = await Farmer.findOne({ userId: new mongoose.Types.ObjectId(user.userId) });
    if (!farmer) {
      res.status(404).json({
        success: false,
        message: 'Farmer profile not found'
      });
      return;
    }

    // Build query for farmer's products
    const query: any = { farmerId: farmer._id };

    // Status filter - farmer can see all their products in any status
    if (status) {
      query.status = status;
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'location rating reviewCount isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: products,
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
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper function to check if user owns a product
 */
async function isProductOwner(userId: string, farmerId: string | mongoose.Types.ObjectId): Promise<boolean> {
  try {
    const farmerObjectId = typeof farmerId === 'string' ? new mongoose.Types.ObjectId(farmerId) : farmerId;
    const farmer = await Farmer.findOne({ 
      _id: farmerObjectId, 
      userId: new mongoose.Types.ObjectId(userId) 
    });
    return !!farmer;
  } catch (error) {
    return false;
  }
}

/**
 * Advanced multilingual product search
 * GET /api/products/search
 * Public endpoint with enhanced multilingual capabilities
 */
export const searchProducts = async (req: ProductSearchRequest, res: Response): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      farmerId,
      page = 1,
      limit = 20,
      language = 'both', // 'en', 'ne', or 'both'
      sortBy = 'relevance'
    } = req.query;

    // Get user's preferred language
    const preferredLanguage = (req.headers['accept-language']?.includes('ne') ? 'ne' : 'en') as 'en' | 'ne';
    const searchLanguage = language === 'both' ? preferredLanguage : language as 'en' | 'ne';

    // Build base query
    const baseQuery: any = {
      status: ProductStatus.PUBLISHED // Only published products for search
    };

    // Category filter with multilingual support
    if (category && category !== '' && category !== 'All') {
      baseQuery.$or = [
        { 'category.en': category },
        { 'category.ne': category }
      ];
    }

    // Farmer filter
    if (farmerId && mongoose.Types.ObjectId.isValid(farmerId)) {
      baseQuery.farmerId = new mongoose.Types.ObjectId(farmerId);
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      baseQuery.price = {};
      if (minPrice !== undefined) baseQuery.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) baseQuery.price.$lte = Number(maxPrice);
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let products: any[] = [];
    let total = 0;

    if (search && search.trim()) {
      // Advanced multilingual search using aggregation pipeline
      const searchPipeline: any[] = [
        { $match: baseQuery },
        {
          $addFields: {
            // Calculate relevance score based on language preference and text matches
            relevanceScore: {
              $add: [
                // Text search score (if using $text)
                { $cond: [{ $gt: [{ $meta: 'textScore' }, 0] }, { $meta: 'textScore' }, 0] },
                
                // Language preference boost
                {
                  $cond: [
                    { $or: [
                      { $regexMatch: { input: `$name.${searchLanguage}`, regex: search, options: 'i' } },
                      { $regexMatch: { input: `$description.${searchLanguage}`, regex: search, options: 'i' } }
                    ]},
                    10, // Boost for preferred language matches
                    0
                  ]
                },
                
                // Exact name match boost
                {
                  $cond: [
                    { $or: [
                      { $regexMatch: { input: '$name.en', regex: `^${search}$`, options: 'i' } },
                      { $regexMatch: { input: '$name.ne', regex: `^${search}$`, options: 'i' } }
                    ]},
                    20, // High boost for exact name matches
                    0
                  ]
                },
                
                // Partial name match boost
                {
                  $cond: [
                    { $or: [
                      { $regexMatch: { input: '$name.en', regex: search, options: 'i' } },
                      { $regexMatch: { input: '$name.ne', regex: search, options: 'i' } }
                    ]},
                    5, // Medium boost for name matches
                    0
                  ]
                }
              ]
            }
          }
        },
        {
          $match: {
            $or: [
              { $text: { $search: search } },
              { 'name.en': { $regex: search, $options: 'i' } },
              { 'name.ne': { $regex: search, $options: 'i' } },
              { 'description.en': { $regex: search, $options: 'i' } },
              { 'description.ne': { $regex: search, $options: 'i' } },
              { 'category.en': { $regex: search, $options: 'i' } },
              { 'category.ne': { $regex: search, $options: 'i' } }
            ]
          }
        },
        {
          $lookup: {
            from: 'farmers',
            localField: 'farmerId',
            foreignField: '_id',
            as: 'farmer'
          }
        },
        { $unwind: { path: '$farmer', preserveNullAndEmptyArrays: true } }
      ];

      // Add sorting
      if (sortBy === 'relevance') {
        searchPipeline.push({ $sort: { relevanceScore: -1, createdAt: -1 } });
      } else if (sortBy === 'name') {
        searchPipeline.push({ 
          $sort: { 
            [`name.${searchLanguage}`]: 1,
            'name.en': 1 // Fallback sort
          } 
        });
      } else {
        searchPipeline.push({ $sort: { [sortBy]: -1 } });
      }

      // Add pagination
      searchPipeline.push({ $skip: skip }, { $limit: limitNum });

      // Execute search
      products = await Product.aggregate(searchPipeline);
      
      // Get total count for pagination
      const countPipeline = searchPipeline.slice(0, -2); // Remove skip and limit
      countPipeline.push({ $count: 'total' });
      const countResult = await Product.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

    } else {
      // No search term - use regular find with multilingual sorting
      const sortOptions: any = {};
      if (sortBy === 'name') {
        sortOptions[`name.${searchLanguage}`] = 1;
      } else {
        sortOptions[sortBy] = -1;
      }

      [products, total] = await Promise.all([
        Product.find(baseQuery)
          .populate('farmer', 'location rating reviewCount isVerified')
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Product.countDocuments(baseQuery)
      ]);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      searchInfo: {
        query: search,
        language: searchLanguage,
        preferredLanguage,
        resultsFound: products.length
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get featured products
 * GET /api/products/featured
 * Public endpoint
 */
export const getFeaturedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 8 } = req.query;

    // Validate limit parameter
    const limitNum = Math.min(20, Math.max(1, Number(limit)));

    // Get featured products - prioritize by farmer rating and recent activity
    const products = await Product.find({ 
      status: ProductStatus.PUBLISHED,
      stock: { $gt: 0 } // Only products in stock
    })
      .populate({
        path: 'farmer',
        select: 'location rating reviewCount isVerified userId',
        populate: {
          path: 'userId',
          select: 'profile.name'
        }
      })
      .sort({ 
        'farmer.rating': -1,  // Higher rated farmers first
        'farmer.reviewCount': -1,  // More reviewed farmers
        createdAt: -1  // Recent products
      })
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};