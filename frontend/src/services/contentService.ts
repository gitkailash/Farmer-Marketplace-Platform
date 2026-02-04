import api from './api'
import type { GalleryItem } from '../components/Gallery'
import type { MayorMessageData } from '../components/MayorMessage'
import type { NewsItem } from '../components/NewsTicker'
import { ApiResponse, PaginatedResponse, MultilingualField } from '../types/api'

export interface Product {
  _id: string
  name: MultilingualField | string // Support both old and new format
  description: MultilingualField | string // Support both old and new format
  price: number
  unit: string
  images: string[]
  category: MultilingualField | string // Support both old and new format
  farmer: {
    _id: string
    userId: {
      profile: {
        name: string
      }
    }
    rating: number
  }
}

// Extended interfaces for admin CMS
export interface GalleryItemAdmin extends GalleryItem {
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: {
    _id: string
    profile: { name: string }
    email: string
  }
}

export interface MayorMessageAdmin extends MayorMessageData {
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: {
    _id: string
    profile: { name: string }
    email: string
  }
}

export interface NewsItemAdmin extends NewsItem {
  content?: NewsItem['content']
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: {
    _id: string
    profile: { name: string }
    email: string
  }
}

// Gallery API
export const galleryService = {
  async getActiveItems(language?: 'en' | 'ne'): Promise<GalleryItem[]> {
    try {
      const params = new URLSearchParams()
      if (language) {
        params.append('language', language)
      }
      
      const url = params.toString() ? `/content/gallery?${params.toString()}` : '/content/gallery'
      const response = await api.get(url)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch gallery items:', error)
      return []
    }
  }
}

// Mayor Message API
export const mayorService = {
  async getActiveMessage(language?: 'en' | 'ne'): Promise<MayorMessageData | null> {
    try {
      const params = new URLSearchParams()
      if (language) {
        params.append('language', language)
      }
      
      const url = params.toString() ? `/content/mayor?${params.toString()}` : '/content/mayor'
      const response = await api.get(url)
      const messages = response.data.data || []
      
      // Find the first active message
      const activeMessage = messages.find((msg: MayorMessageData) => msg.isActive)
      return activeMessage || null
    } catch (error) {
      console.error('Failed to fetch mayor message:', error)
      return null
    }
  }
}

// News Ticker API
export const newsService = {
  async getActiveNews(language: string = 'en'): Promise<NewsItem[]> {
    try {
      const response = await api.get(`/content/news?language=${language}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch news items:', error)
      return []
    }
  }
}

// Featured Products API
export const featuredProductsService = {
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const response = await api.get(`/products/featured?limit=${limit}`)
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch featured products:', error)
      return []
    }
  }
}

// Admin CMS API Services
export const adminGalleryService = {
  async getAllItems(params?: {
    category?: string
    isActive?: boolean
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<GalleryItemAdmin>> {
    const queryParams = new URLSearchParams()
    
    if (params?.category) queryParams.append('category', params.category)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const response = await api.get(`/content/gallery?${queryParams.toString()}`)
    return response.data
  },

  async createItem(data: {
    title: {
      en: string;
      ne?: string;
    };
    description?: {
      en: string;
      ne?: string;
    };
    imageUrl: string;
    category: {
      en: string;
      ne?: string;
    };
    order?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<GalleryItemAdmin>> {
    const response = await api.post('/content/gallery', data)
    return response.data
  },

  async updateItem(id: string, data: Partial<{
    title: {
      en: string;
      ne?: string;
    };
    description?: {
      en: string;
      ne?: string;
    };
    imageUrl: string;
    category: {
      en: string;
      ne?: string;
    };
    order: number;
    isActive: boolean;
  }>): Promise<ApiResponse<GalleryItemAdmin>> {
    const response = await api.put(`/content/gallery/${id}`, data)
    return response.data
  },

  async deleteItem(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/content/gallery/${id}`)
    return response.data
  },

  async reorderItems(items: Array<{ id: string; order: number }>): Promise<ApiResponse<void>> {
    const response = await api.put('/content/gallery/reorder', { items })
    return response.data
  }
}

export const adminMayorService = {
  async getAllMessages(params?: {
    isActive?: boolean
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<MayorMessageAdmin>> {
    const queryParams = new URLSearchParams()
    
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const response = await api.get(`/content/mayor?${queryParams.toString()}`)
    return response.data
  },

  async createMessage(data: {
    text: {
      en: string;
      ne?: string;
    };
    imageUrl?: string;
    scrollSpeed?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<MayorMessageAdmin>> {
    const response = await api.post('/content/mayor', data)
    return response.data
  },

  async updateMessage(id: string, data: Partial<{
    text: {
      en: string;
      ne?: string;
    };
    imageUrl?: string;
    scrollSpeed: number;
    isActive: boolean;
  }>): Promise<ApiResponse<MayorMessageAdmin>> {
    const response = await api.put(`/content/mayor/${id}`, data)
    return response.data
  },

  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/content/mayor/${id}`)
    return response.data
  }
}

export const adminNewsService = {
  async getAllItems(params?: {
    priority?: 'LOW' | 'NORMAL' | 'HIGH'
    language?: string
    isActive?: boolean
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<NewsItemAdmin>> {
    const queryParams = new URLSearchParams()
    
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.language) queryParams.append('language', params.language)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const response = await api.get(`/content/news?${queryParams.toString()}`)
    return response.data
  },

  async createItem(data: {
    headline: {
      en: string;
      ne?: string;
    };
    content?: {
      en: string;
      ne?: string;
    };
    summary?: {
      en: string;
      ne?: string;
    };
    link?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    language?: string;
    isActive?: boolean;
    publishedAt?: string;
  }): Promise<ApiResponse<NewsItemAdmin>> {
    const response = await api.post('/content/news', data)
    return response.data
  },

  async updateItem(id: string, data: Partial<{
    headline: {
      en: string;
      ne?: string;
    };
    content?: {
      en: string;
      ne?: string;
    };
    summary?: {
      en: string;
      ne?: string;
    };
    link?: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH';
    language: string;
    isActive: boolean;
    publishedAt: string;
  }>): Promise<ApiResponse<NewsItemAdmin>> {
    const response = await api.put(`/content/news/${id}`, data)
    return response.data
  },

  async deleteItem(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/content/news/${id}`)
    return response.data
  }
}