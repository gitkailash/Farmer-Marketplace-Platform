import api from './api'
import { ApiResponse, PaginatedResponse } from '../types/api'

// Translation-specific types
export interface TranslationKey {
  _id: string
  key: string
  namespace: string
  translations: {
    en: string
    ne?: string
  }
  context?: string
  isRequired: boolean
  lastUpdated: string
  updatedBy: {
    _id: string
    profile: { name: string }
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface ValidationReport {
  namespace: string
  completeness: number
  missingKeys: string[]
  totalKeys: number
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  warnings: string[]
}

export interface CreateTranslationRequest {
  key: string
  namespace: string
  translations: {
    en: string
    ne?: string
  }
  context?: string
  isRequired?: boolean
}

export interface UpdateTranslationRequest {
  translations?: {
    en?: string
    ne?: string
  }
  context?: string
  isRequired?: boolean
}

export interface TranslationMap {
  [key: string]: string | TranslationMap
}

// Translation Management API
export const getTranslations = async (
  language: 'en' | 'ne',
  namespace?: string
): Promise<ApiResponse<{ language: string; namespace: string; translations: TranslationMap }>> => {
  const queryParams = new URLSearchParams()
  queryParams.append('language', language)
  if (namespace) queryParams.append('namespace', namespace)

  const response = await api.get(`/translations?${queryParams.toString()}`)
  return response.data
}

export const getTranslationKeys = async (params?: {
  namespace?: string
  page?: number
  limit?: number
  search?: string
}): Promise<ApiResponse<{
  keys: TranslationKey[]
  total: number
  page: number
  totalPages: number
}>> => {
  const queryParams = new URLSearchParams()
  
  if (params?.namespace) queryParams.append('namespace', params.namespace)
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.search) queryParams.append('search', params.search)
  
  // Add cache-busting parameter for admin calls
  queryParams.append('_t', Date.now().toString())

  const url = `/translations/keys?${queryParams.toString()}`
  console.log('🌐 Making API call to:', url)
  console.log('📋 Query params:', Object.fromEntries(queryParams))

  const response = await api.get(url)
  console.log('📨 Raw API response:', response.data)
  return response.data
}

export const createTranslation = async (
  data: CreateTranslationRequest
): Promise<ApiResponse<TranslationKey>> => {
  const response = await api.post('/translations', data)
  return response.data
}

export const updateTranslation = async (
  key: string,
  data: UpdateTranslationRequest
): Promise<ApiResponse<TranslationKey>> => {
  const response = await api.put(`/translations/${encodeURIComponent(key)}`, data)
  return response.data
}

export const deleteTranslation = async (key: string): Promise<ApiResponse<void>> => {
  const response = await api.delete(`/translations/${encodeURIComponent(key)}`)
  return response.data
}

export const validateCompleteness = async (
  namespace?: string
): Promise<ApiResponse<ValidationReport>> => {
  const queryParams = new URLSearchParams()
  if (namespace) queryParams.append('namespace', namespace)

  const response = await api.get(`/translations/validate?${queryParams.toString()}`)
  return response.data
}

export const exportTranslations = async (format: 'json' | 'csv'): Promise<Blob> => {
  const response = await api.get(`/translations/export?format=${format}`, {
    responseType: 'blob'
  })
  return response.data
}

export const importTranslations = async (
  file: File,
  format: 'json' | 'csv'
): Promise<ApiResponse<ImportResult>> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('format', format)

  const response = await api.post('/translations/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const translationService = {
  getTranslations,
  getTranslationKeys,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  validateCompleteness,
  exportTranslations,
  importTranslations
}