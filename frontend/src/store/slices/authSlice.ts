import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../types/api'
import { authService } from '../../services/authService'

// Safe localStorage access for SSR/testing environments
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key)
    }
  }
}

// Auth state interface
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  lastRefresh: number
  refreshPromise: Promise<void> | null
  isRestoring: boolean
}

// Initial state - if token exists, start as authenticated
const getInitialAuthState = (): AuthState => {
  const token = safeLocalStorage.getItem('token')
  
  if (token) {
    return {
      user: null, // Will be populated by validation
      token,
      isAuthenticated: true, // Assume authenticated if token exists
      loading: false,
      error: null,
      lastRefresh: 0,
      refreshPromise: null,
      isRestoring: true, // Will validate token
    }
  }
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    lastRefresh: 0,
    refreshPromise: null,
    isRestoring: false,
  }
}

const initialState: AuthState = getInitialAuthState()

// Async thunks for auth operations
export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginRequest,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    console.log('🔐 loginUser thunk: Starting login process');
    try {
      const response = await authService.login(credentials)
      console.log('✅ loginUser thunk: Login successful', response);
      return response
    } catch (error: any) {
      console.log('❌ loginUser thunk: Login failed', error.message);
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk<
  AuthResponse,
  RegisterRequest,
  { rejectValue: string }
>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const validateToken = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = safeLocalStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }
      const user = await authService.validateToken()
      return user
    } catch (error: any) {
      safeLocalStorage.removeItem('token')
      return rejectWithValue('Token validation failed')
    }
  }
)

export const refreshAuthToken = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = safeLocalStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }
      const response = await authService.refreshToken()
      return response
    } catch (error: any) {
      safeLocalStorage.removeItem('token')
      return rejectWithValue('Token refresh failed')
    }
  }
)

export const restoreAuthState = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'auth/restoreState',
  async (_, { rejectWithValue }) => {
    try {
      const token = safeLocalStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }

      // First try to validate the current token
      try {
        const user = await authService.validateToken()
        return user
      } catch (validationError: any) {
        // If validation fails, try to refresh the token
        if (validationError.response?.status === 401) {
          try {
            const refreshResponse = await authService.refreshToken()
            safeLocalStorage.setItem('token', refreshResponse.token)
            return refreshResponse.user
          } catch (refreshError: any) {
            safeLocalStorage.removeItem('token')
            throw new Error('Token refresh failed')
          }
        }
        throw validationError
      }
    } catch (error: any) {
      safeLocalStorage.removeItem('token')
      return rejectWithValue(error.message || 'Authentication restoration failed')
    }
  }
)

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.loading = false
      state.error = null
      state.lastRefresh = 0
      state.refreshPromise = null
      state.isRestoring = false
      safeLocalStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      const { token, user } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.error = null
      state.lastRefresh = Date.now()
      safeLocalStorage.setItem('token', token)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setRestoring: (state, action: PayloadAction<boolean>) => {
      state.isRestoring = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        state.lastRefresh = Date.now()
        safeLocalStorage.setItem('token', action.payload.token)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Login failed'
        state.isAuthenticated = false
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        state.lastRefresh = Date.now()
        safeLocalStorage.setItem('token', action.payload.token)
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Registration failed'
        state.isAuthenticated = false
      })
      // Token validation cases
      .addCase(validateToken.pending, (state) => {
        state.loading = true
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
        state.lastRefresh = Date.now()
      })
      .addCase(validateToken.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        safeLocalStorage.removeItem('token')
      })
      // Token refresh cases
      .addCase(refreshAuthToken.pending, (state) => {
        state.loading = true
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.error = null
        state.lastRefresh = Date.now()
        safeLocalStorage.setItem('token', action.payload.token)
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        safeLocalStorage.removeItem('token')
      })
      // Auth state restoration cases
      .addCase(restoreAuthState.pending, (state) => {
        state.isRestoring = true
        state.loading = true
        state.error = null
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.isRestoring = false
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
        state.lastRefresh = Date.now()
      })
      .addCase(restoreAuthState.rejected, (state, action) => {
        state.isRestoring = false
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = action.payload || 'Authentication restoration failed'
        safeLocalStorage.removeItem('token')
      })
  },
})

export const { 
  logout, 
  clearError, 
  setCredentials, 
  setLoading, 
  setRestoring 
} = authSlice.actions
export default authSlice.reducer

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsRestoring = (state: { auth: AuthState }) => state.auth.isRestoring