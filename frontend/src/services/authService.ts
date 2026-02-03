import { apiPost, apiGet, apiPut } from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/api';
import { isTokenExpired, isTokenExpiringSoon, isValidTokenFormat } from '../utils/jwt';

export const authService = {
  // User login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log('🔐 authService.login: Starting login with', credentials.email);
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    console.log('🔐 authService.login: Response received', { success: response.success, hasData: !!response.data });
    
    if (!response.success || !response.data) {
      console.log('❌ authService.login: Login failed', response.message);
      throw new Error(response.message || 'Login failed');
    }
    
    console.log('✅ authService.login: Login successful', response.data);
    return response.data;
  },

  // User registration
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiPost<AuthResponse>('/auth/register', userData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    return response.data;
  },

  // Validate token and get user data with enhanced error handling
  validateToken: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    
    // Check if token exists and has valid format
    if (!token || !isValidTokenFormat(token)) {
      throw new Error('Invalid token format');
    }

    // Check if token is expired
    const expired = isTokenExpired(token);
    if (expired === true) {
      throw new Error('Token expired');
    }

    try {
      const response = await apiGet<{ user: User }>('/auth/me');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token validation failed');
      }
      // Extract the user from the nested structure
      return response.data.user;
    } catch (error: any) {
      // If we get a 401, the token is invalid on the server side
      if (error.response?.status === 401) {
        throw new Error('Token invalid');
      }
      throw error;
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiGet<{ user: User }>('/auth/profile');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get profile');
    }
    // Extract the user from the nested structure
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User['profile']>): Promise<User> => {
    const response = await apiPut<User>('/auth/profile', { profile: profileData });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update profile');
    }
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiPut<void>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  },

  // Refresh JWT token with enhanced error handling
  refreshToken: async (): Promise<AuthResponse> => {
    const currentToken = localStorage.getItem('token');
    
    // Check if we have a token to refresh
    if (!currentToken || !isValidTokenFormat(currentToken)) {
      throw new Error('No valid token to refresh');
    }

    try {
      const response = await apiPost<AuthResponse>('/auth/refresh');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to refresh token');
      }
      return response.data;
    } catch (error: any) {
      // If refresh fails with 401, the refresh token is invalid
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Refresh token invalid');
      }
      throw error;
    }
  },

  // Logout (client-side token removal)
  logout: (): void => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated with token validation
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token || !isValidTokenFormat(token)) {
      return false;
    }

    const expired = isTokenExpired(token);
    return expired !== true; // Return true if not expired, false if expired or invalid
  },

  // Check if token needs refresh (expiring soon)
  needsRefresh: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token || !isValidTokenFormat(token)) {
      return false;
    }

    const expiringSoon = isTokenExpiringSoon(token, 5); // 5 minutes buffer
    return expiringSoon === true;
  },

  // Get stored token
  getToken: (): string | null => {
    const token = localStorage.getItem('token');
    if (!token || !isValidTokenFormat(token)) {
      return null;
    }
    return token;
  },

  // Store token
  setToken: (token: string): void => {
    if (isValidTokenFormat(token)) {
      localStorage.setItem('token', token);
    } else {
      throw new Error('Invalid token format');
    }
  },
};