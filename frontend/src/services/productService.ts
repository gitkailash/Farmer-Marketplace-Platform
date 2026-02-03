import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './api';
import { Product, ApiResponse, PaginatedResponse, MultilingualField } from '../types/api';

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  farmerId?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
  language?: 'en' | 'ne' | 'both';
  sortBy?: 'relevance' | 'name' | 'price' | 'createdAt';
}

export interface ProductCreateRequest {
  name: MultilingualField;
  description: MultilingualField;
  category: string;
  price: number;
  unit: string;
  stock: number;
  images: string[];
}

export const productService = {
  // Get all products with filters and pagination
  getProducts: async (
    filters?: ProductFilters,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Product>> => {
    const queryParams: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    
    // Add filters to query params
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = value.toString();
        }
      });
    }
    
    const params = new URLSearchParams(queryParams);
    
    return apiGet<Product[]>(`/products?${params.toString()}`) as Promise<PaginatedResponse<Product>>;
  },

  // Get single product by ID
  getProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiGet<Product>(`/products/${id}`);
  },

  // Create new product (farmer only)
  createProduct: async (productData: ProductCreateRequest): Promise<ApiResponse<Product>> => {
    return apiPost<Product>('/products', productData);
  },

  // Update product (farmer only)
  updateProduct: async (id: string, productData: Partial<ProductCreateRequest>): Promise<ApiResponse<Product>> => {
    return apiPut<Product>(`/products/${id}`, productData);
  },

  // Delete product (farmer only)
  deleteProduct: async (id: string): Promise<ApiResponse<void>> => {
    return apiDelete<void>(`/products/${id}`);
  },

  // Publish product (change status to PUBLISHED)
  publishProduct: async (id: string): Promise<ApiResponse<Product>> => {
    return apiPut<Product>(`/products/${id}`, { status: 'PUBLISHED' });
  },

  // Update product status
  updateProductStatus: async (id: string, status: 'DRAFT' | 'PUBLISHED' | 'INACTIVE'): Promise<ApiResponse<Product>> => {
    return apiPut<Product>(`/products/${id}`, { status });
  },

  // Update product stock
  updateStock: async (id: string, stock: number): Promise<ApiResponse<Product>> => {
    return apiPut<Product>(`/products/${id}`, { stock });
  },

  // Get farmer's products
  getFarmerProducts: async (farmerId?: string): Promise<ApiResponse<Product[]>> => {
    const url = farmerId ? `/products/farmer/${farmerId}` : '/products/my-products';
    return apiGet<Product[]>(url);
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8): Promise<ApiResponse<Product[]>> => {
    return apiGet<Product[]>(`/products/featured?limit=${limit}`);
  },

  // Search products with multilingual support
  searchProducts: async (
    query: string, 
    filters?: ProductFilters & { 
      language?: 'en' | 'ne' | 'both';
      sortBy?: 'relevance' | 'name' | 'price' | 'createdAt';
    }
  ): Promise<ApiResponse<Product[]>> => {
    const queryParams: Record<string, string> = {
      search: query,
    };
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = value.toString();
        }
      });
    }
    
    const params = new URLSearchParams(queryParams);
    return apiGet<Product[]>(`/products/search?${params.toString()}`);
  },

  // Advanced multilingual search with enhanced options
  advancedSearch: async (options: {
    query?: string;
    language?: 'en' | 'ne' | 'both';
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    farmerId?: string;
    sortBy?: 'relevance' | 'name' | 'price' | 'createdAt';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const queryParams: Record<string, string> = {};
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value.toString();
      }
    });
    
    const params = new URLSearchParams(queryParams);
    return apiGet<Product[]>(`/products/search?${params.toString()}`) as Promise<PaginatedResponse<Product>>;
  },

  // Get product categories
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return apiGet<string[]>('/products/categories');
  },

  // Bulk update products (farmer only)
  bulkUpdateProducts: async (updates: Array<{ id: string; data: Partial<ProductCreateRequest> }>): Promise<ApiResponse<Product[]>> => {
    return apiPut<Product[]>('/products/bulk-update', { updates });
  },
};