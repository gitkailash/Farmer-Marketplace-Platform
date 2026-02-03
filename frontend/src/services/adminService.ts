import api from './api'
import { ApiResponse, PaginatedResponse } from '../types/api'

// Admin-specific types
export interface AdminUser {
  _id: string
  email: string
  role: 'VISITOR' | 'BUYER' | 'FARMER' | 'ADMIN'
  profile: {
    name: string
    phone?: string
    address?: string
  }
  createdAt: string
  updatedAt: string
  farmerProfile?: {
    _id: string
    location: {
      district: string
      municipality: string
      coordinates?: [number, number]
    }
    rating: number
    reviewCount: number
    isVerified: boolean
  }
  statistics?: {
    joinDate: string
    lastActive: string
    farmer?: {
      productCount: number
      orderCount: number
      reviewCount: number
      rating: number
      isVerified: boolean
    }
    buyer?: {
      orderCount: number
      reviewCount: number
    }
  }
}

export interface ModerationItem {
  _id: string
  type: 'review' | 'product' | 'message'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  // Review-specific fields
  reviewer?: {
    _id: string
    profile: { name: string }
    email: string
  }
  reviewee?: {
    _id: string
    profile: { name: string }
    email: string
  }
  rating?: number
  comment?: string
  isApproved?: boolean
  moderatedBy?: {
    _id: string
    profile: { name: string }
  }
  // Product-specific fields
  name?: string
  description?: string
  category?: string
  price?: number
  farmer?: {
    _id: string
    location: {
      district: string
      municipality: string
    }
    rating: number
    reviewCount: number
  }
  // Message-specific fields
  sender?: {
    _id: string
    profile: { name: string }
    email: string
  }
  receiver?: {
    _id: string
    profile: { name: string }
    email: string
  }
  content?: string
  moderationFlag?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface AnalyticsData {
  overview: {
    users: {
      total: number
      farmers: number
      buyers: number
      recent: number
    }
    products: {
      total: number
      published: number
      recent: number
    }
    orders: {
      total: number
      completed: number
      recent: number
    }
    reviews: {
      total: number
      approved: number
      recent: number
    }
    messages: {
      total: number
    }
    revenue: {
      total: number
      average: number
    }
  }
  topFarmers: Array<{
    _id: string
    userId: {
      _id: string
      profile: { name: string }
      email: string
    }
    location: {
      district: string
      municipality: string
    }
    rating: number
    reviewCount: number
    isVerified: boolean
  }>
  timeSeriesData?: Array<{
    _id: string
    orders: number
    revenue: number
  }>
  generatedAt: string
}

export interface AuditLog {
  id: string
  action: string
  performedBy: {
    _id: string
    profile: { name: string }
    email: string
  }
  targetType: string
  targetId: string
  details: any
  timestamp: string
  createdAt: string
}

// User Management
export const getUsers = async (params?: {
  role?: string
  search?: string
  district?: string
  isVerified?: string
  dateStart?: string
  dateEnd?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<PaginatedResponse<AdminUser>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.role) queryParams.append('role', params.role)
  if (params?.search) queryParams.append('search', params.search)
  if (params?.district) queryParams.append('district', params.district)
  if (params?.isVerified) queryParams.append('isVerified', params.isVerified)
  if (params?.dateStart) queryParams.append('dateStart', params.dateStart)
  if (params?.dateEnd) queryParams.append('dateEnd', params.dateEnd)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const response = await api.get(`/admin/users?${queryParams.toString()}`)
  return response.data
}

export const getUserById = async (id: string): Promise<ApiResponse<AdminUser>> => {
  const response = await api.get(`/admin/users/${id}`)
  return response.data
}

export const updateUser = async (
  id: string, 
  data: {
    role?: string
    profile?: {
      name?: string
      phone?: string
      address?: string
    }
  }
): Promise<ApiResponse<AdminUser>> => {
  const response = await api.put(`/admin/users/${id}`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/admin/users/${id}`)
  return response.data
}

// Moderation
export const getModerationQueue = async (params?: {
  type?: 'reviews' | 'products' | 'messages'
  status?: string
  page?: number
  limit?: number
}): Promise<{
  success: boolean
  data: { type: string; status: string; items: ModerationItem[] }
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  message?: string
}> => {
  const queryParams = new URLSearchParams()
  
  if (params?.type) queryParams.append('type', params.type)
  if (params?.status) queryParams.append('status', params.status)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const response = await api.get(`/admin/moderation?${queryParams.toString()}`)
  return response.data
}

export const moderateReview = async (
  reviewId: string,
  action: 'approve' | 'reject'
): Promise<ApiResponse<any>> => {
  const response = await api.put(`/reviews/${reviewId}/moderate`, { action })
  return response.data
}

export const moderateProduct = async (
  productId: string,
  status: 'PUBLISHED' | 'INACTIVE'
): Promise<ApiResponse<any>> => {
  const response = await api.put(`/products/${productId}`, { status })
  return response.data
}

export const moderateMessage = async (
  messageId: string,
  moderationFlag: 'APPROVED' | 'REJECTED'
): Promise<ApiResponse<any>> => {
  const response = await api.put(`/messages/${messageId}/moderate`, { moderationFlag })
  return response.data
}

export const flagContent = async (
  contentType: 'review' | 'product' | 'message',
  contentId: string
): Promise<ApiResponse<any>> => {
  // For now, we'll use the moderation endpoints to flag content
  // In a real implementation, you might have dedicated flagging endpoints
  if (contentType === 'review') {
    const response = await api.put(`/reviews/${contentId}/moderate`, { action: 'reject' })
    return response.data
  } else if (contentType === 'product') {
    const response = await api.put(`/products/${contentId}`, { status: 'INACTIVE' })
    return response.data
  } else if (contentType === 'message') {
    const response = await api.put(`/messages/${contentId}/moderate`, { moderationFlag: 'REJECTED' })
    return response.data
  }
  throw new Error('Invalid content type')
}

export const removeContent = async (
  contentType: 'review' | 'product' | 'message',
  contentId: string
): Promise<ApiResponse<any>> => {
  // For content removal, we'll use delete endpoints where available
  if (contentType === 'product') {
    const response = await api.delete(`/products/${contentId}`)
    return response.data
  } else {
    // For reviews and messages, we'll reject them (since they don't have delete endpoints)
    return flagContent(contentType, contentId)
  }
}

// Analytics
export const getAnalytics = async (params?: {
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}): Promise<ApiResponse<AnalyticsData>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)
  if (params?.groupBy) queryParams.append('groupBy', params.groupBy)

  const response = await api.get(`/admin/analytics?${queryParams.toString()}`)
  return response.data
}

// Audit Logs
export const getAuditLogs = async (params?: {
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<AuditLog>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.action) queryParams.append('action', params.action)
  if (params?.userId) queryParams.append('userId', params.userId)
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())

  const response = await api.get(`/admin/audit-logs?${queryParams.toString()}`)
  return response.data
}

// Export functions
export const exportAnalytics = async (params?: {
  format?: 'json' | 'csv'
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month'
}): Promise<Blob> => {
  const queryParams = new URLSearchParams()
  
  if (params?.format) queryParams.append('format', params.format)
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)
  if (params?.groupBy) queryParams.append('groupBy', params.groupBy)

  const response = await api.get(`/admin/analytics/export?${queryParams.toString()}`, {
    responseType: 'blob'
  })
  return response.data
}

export const exportAuditLogs = async (params?: {
  format?: 'json' | 'csv'
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
}): Promise<Blob> => {
  const queryParams = new URLSearchParams()
  
  if (params?.format) queryParams.append('format', params.format)
  if (params?.action) queryParams.append('action', params.action)
  if (params?.userId) queryParams.append('userId', params.userId)
  if (params?.startDate) queryParams.append('startDate', params.startDate)
  if (params?.endDate) queryParams.append('endDate', params.endDate)

  const response = await api.get(`/admin/audit-logs/export?${queryParams.toString()}`, {
    responseType: 'blob'
  })
  return response.data
}

export const adminService = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getModerationQueue,
  moderateReview,
  moderateProduct,
  moderateMessage,
  flagContent,
  removeContent,
  getAnalytics,
  getAuditLogs,
  exportAnalytics,
  exportAuditLogs
}