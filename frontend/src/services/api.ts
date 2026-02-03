import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '../types/api';

// Create Axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT tokens
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling and automatic logout
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle 401 responses - automatic logout
    if (error.response?.status === 401) {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Dispatch logout action (will be implemented when Redux auth slice is created)
      // For now, we'll redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle other error responses
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// Retry helper function
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries > 0 && shouldRetry(error)) {
      await delay(RETRY_CONFIG.retryDelay);
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Check if error should be retried
const shouldRetry = (error: any): boolean => {
  if (!error.response) {
    // Network errors should be retried
    return true;
  }
  
  const status = error.response.status;
  return RETRY_CONFIG.retryableStatuses.includes(status);
};

// Delay helper
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Enhanced error handling
const handleApiError = (error: any): ApiResponse<any> => {
  // If it's already a formatted API error response
  if (error.success === false) {
    return error;
  }

  // Handle Axios errors
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    if (data && typeof data === 'object') {
      return {
        success: false,
        message: data.message || `Request failed with status ${status}`,
        errors: data.errors || undefined,
      };
    }
    
    return {
      success: false,
      message: `Request failed with status ${status}`,
    };
  }
  
  if (error.request) {
    // Network error
    return {
      success: false,
      message: 'Network error. Please check your connection and try again.',
    };
  }
  
  // Other errors
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
  };
};

// HTTP method helpers with retry logic and enhanced error handling
export const apiGet = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await withRetry(() => api.get(url));
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const apiPost = async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    const response = await withRetry(() => api.post(url, data));
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const apiPut = async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    const response = await withRetry(() => api.put(url, data));
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const apiPatch = async <T = any>(url: string, data?: any): Promise<ApiResponse<T>> => {
  try {
    const response = await withRetry(() => api.patch(url, data));
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export const apiDelete = async <T = any>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await withRetry(() => api.delete(url));
    return response.data;
  } catch (error: any) {
    return handleApiError(error);
  }
};

export default api;