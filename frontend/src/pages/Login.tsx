import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import { useAppTranslation } from '../contexts/I18nProvider'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
// import LanguageSwitcher from '../components/UI/LanguageSwitcher'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormErrors {
  email?: string
  password?: string
  general?: string
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, loading } = useAuth()
  const { t, isReady, isLoading } = useAppTranslation('auth')

  // Helper function to ensure translation returns a string
  const getTranslation = useCallback((key: string, fallback: string): string => {
    if (!isReady || isLoading) {
      return fallback; // Return fallback immediately if not ready
    }
    
    const result = t(key, fallback)
    return typeof result === 'string' ? result : fallback
  }, [t, isReady, isLoading])

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Don't render until i18n is ready - MOVED AFTER ALL HOOKS
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading translations...</p>
        </div>
      </div>
    )
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = getTranslation('login.validation.emailRequired', 'Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = getTranslation('login.validation.emailInvalid', 'Please enter a valid email address')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = getTranslation('login.validation.passwordRequired', 'Password is required')
    } else if (formData.password.length < 6) {
      newErrors.password = getTranslation('login.validation.passwordMinLength', 'Password must be at least 6 characters')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      await login(formData.email, formData.password)
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error: any) {
      setErrors({
        general: error.message || getTranslation('login.validation.loginFailed', 'Login failed. Please check your credentials.')
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex justify-center flex-1">
              <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-white" />
              </div>
            </div>
            {/* <div className="ml-4">
              <LanguageSwitcher variant="dropdown" showFlags={true} size="sm" />
            </div> */}
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getTranslation('login.title', 'Sign in')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {getTranslation('login.subtitle', 'Access your dashboard')}
          </p>
        </div>

        {/* Error */}
        {errors.general && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getTranslation('login.email', 'Email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none`}
                placeholder={getTranslation('login.emailPlaceholder', 'you@example.com')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getTranslation('login.password', 'Password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none`}
                placeholder={getTranslation('login.passwordPlaceholder', '••••••••')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showPassword ? getTranslation('login.hidePassword', 'Hide password') : getTranslation('login.showPassword', 'Show password')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isSubmitting ? getTranslation('login.submitting', 'Signing in…') : getTranslation('login.submit', 'Sign in')}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {getTranslation('login.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            {getTranslation('login.createAccount', 'Create one')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login