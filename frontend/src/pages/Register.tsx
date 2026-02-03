import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthProvider'
import { useAppTranslation } from '../contexts/I18nProvider'
import { RegisterRequest } from '../types/api'
import { UserPlus } from 'lucide-react'
// import LanguageSwitcher from '../components/UI/LanguageSwitcher'

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  role: 'BUYER' | 'FARMER'
  name: string
  phone: string
  address: string
  district: string
  municipality: string
  language: 'en' | 'ne'
}

interface RegisterFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  name?: string
  phone?: string
  address?: string
  district?: string
  municipality?: string
  general?: string
}

const Register: React.FC = () => {
  const navigate = useNavigate()
  const { register, isAuthenticated, loading } = useAuth()
  const { language, changeLanguage, isReady, isLoading } = useAppTranslation()
  
  // Use the same translation approach as Login component
  const { t } = useAppTranslation('auth')

  // ALL useState calls MUST come before any conditional returns to maintain hook order
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'BUYER',
    name: '',
    phone: '',
    address: '',
    district: '',
    municipality: '',
    language: language, // Initialize with current language
  })

  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to safely get translation string - same as Login component
  const getTranslation = useCallback((key: string, fallback: string = key): string => {
    if (!isReady || isLoading) {
      return fallback; // Return fallback immediately if not ready
    }
    
    try {
      const result = t(key, fallback)
      return typeof result === 'string' ? result : fallback
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error)
      return fallback
    }
  }, [t, isReady, isLoading])

  // Sync form language with i18n language changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      language: language
    }))
  }, [language])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

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

  // Nepal districts and their municipalities
  const nepalDistricts = [
    'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski', 'Rupandehi', 
    'Morang', 'Jhapa', 'Sunsari', 'Dhanusha', 'Siraha', 'Saptari', 'Mahottari',
    'Bara', 'Parsa', 'Rautahat', 'Sarlahi', 'Sindhuli', 'Ramechhap', 'Dolakha',
    'Sindhupalchok', 'Kavrepalanchok', 'Nuwakot', 'Rasuwa', 'Dhading', 'Makwanpur',
    'Gorkha', 'Lamjung', 'Tanahun', 'Syangja', 'Parbat', 'Baglung', 'Myagdi',
    'Mustang', 'Manang', 'Nawalpur', 'Palpa', 'Gulmi', 'Arghakhanchi', 'Kapilvastu',
    'Dang', 'Banke', 'Bardiya', 'Surkhet', 'Dailekh', 'Jajarkot', 'Dolpa', 'Jumla',
    'Kalikot', 'Mugu', 'Humla', 'Bajura', 'Bajhang', 'Achham', 'Doti', 'Kailali',
    'Kanchanpur', 'Dadeldhura', 'Baitadi', 'Darchula'
  ]

  const municipalitiesByDistrict: { [key: string]: string[] } = {
  'Kathmandu': [
    'Kathmandu Metropolitan City',
    'Budhanilkantha Municipality',
    'Chandragiri Municipality',
    'Dakshinkali Municipality',
    'Gokarneshwar Municipality',
    'Kageshwari Manohara Municipality',
    'Kirtipur Municipality',
    'Nagarjun Municipality',
    'Shankharapur Municipality',
    'Tarakeshwar Municipality',
    'Tokha Municipality'
  ],
  'Lalitpur': [
    'Lalitpur Metropolitan City',
    'Godawari Municipality',
    'Mahalaxmi Municipality'
  ],
  'Bhaktapur': [
    'Bhaktapur Municipality',
    'Changunarayan Municipality',
    'Madhyapur Thimi Municipality',
    'Suryabinayak Municipality'
  ],
  'Chitwan': [
    'Bharatpur Metropolitan City',
    'Rapti Municipality',
    'Ratnanagar Municipality',
    'Kalika Municipality',
    'Khairahani Municipality',
    'Madi Municipality',
    'Ichchhakamana Rural Municipality'
  ],
  'Kaski': [
    'Pokhara Metropolitan City',
    'Annapurna Rural Municipality',
    'Machhapuchchhre Rural Municipality',
    'Madi Rural Municipality',
    'Rupa Rural Municipality'
  ],
  'Rupandehi': [
    'Butwal Sub-Metropolitan City',
    'Devdaha Municipality',
    'Lumbini Sanskritik Municipality',
    'Sainamaina Municipality',
    'Siddharthanagar Municipality',
    'Tilottama Municipality',
    'Gaidahawa Rural Municipality',
    'Kanchan Rural Municipality',
    'Kotahimai Rural Municipality',
    'Marchawari Rural Municipality',
    'Mayadevi Rural Municipality',
    'Omsatiya Rural Municipality',
    'Rohini Rural Municipality',
    'Sammarimai Rural Municipality',
    'Siyari Rural Municipality',
    'Suddhodhan Rural Municipality'
  ],
  'Morang': [
    'Biratnagar Metropolitan City',
    'Sundar Haraicha Municipality',
    'Belbari Municipality',
    'Urlabari Municipality',
    'Pathari Shanischare Municipality',
    'Letang Municipality',
    'Gramthan Municipality'
  ],
  'Jhapa': [
    'Bhadrapur Municipality',
    'Damak Municipality',
    'Mechinagar Municipality',
    'Kankai Municipality',
    'Shivasatakshi Municipality',
    'Chandragadhi Municipality',
    'Budhabare Municipality'
  ],
  'Sunsari': [
    'Inaruwa Municipality',
    'Dharan Sub-Metropolitan City',
    'Itahari Sub-Metropolitan City',
    'Madhyabindu Municipality',
    'Hariharpur Municipality'
  ],
  'Dhanusha': [
    'Janakpurdham Sub-Metropolitan City',
    'Dhanushadham Municipality',
    'Aaurahi Municipality',
    'Bidhyanand Municipality'
  ],
  'Siraha': [
    'Lahan Municipality',
    'Siraha Municipality',
    'Golbazar Municipality'
  ],
  'Saptari': [
    'Rajbiraj Municipality',
    'Kanchanrup Municipality',
    'Shambhunath Municipality'
  ],
  'Mahottari': [
    'Jaleshwor Municipality',
    'Harinagar Municipality'
  ],
  'Bara': [
    'Kalaiya Sub-Metropolitan City',
    'Parwanipur Municipality',
    'Simara Municipality'
  ],
  'Parsa': [
    'Birgunj Metropolitan City',
    'Kalaiya Municipality'
  ],
  'Rautahat': [
    'Gaur Municipality',
    'Paroha Municipality',
    'Ishanath Municipality'
  ],
  'Sarlahi': [
    'Malangawa Municipality',
    'Haripur Municipality'
  ],
  'Sindhuli': [
    'Sindhuli Municipality',
    'Kamalamai Municipality'
  ],
  'Ramechhap': [
    'Manthali Municipality',
    'Ramechhap Municipality'
  ],
  'Dolakha': [
    'Charikot Municipality'
  ],
  'Sindhupalchok': [
    'Chautara Municipality',
    'Melamchi Municipality'
  ],
  'Kavrepalanchok': [
    'Banepa Municipality',
    'Panauti Municipality',
    'Dhulikhel Municipality'
  ],
  'Nuwakot': [
    'Bidur Municipality',
    'Tadi Municipality'
  ],
  'Rasuwa': [
    'Dhunche Municipality'
  ],
  'Dhading': [
    'Dhading Besi Municipality'
  ],
  'Makwanpur': [
    'Hetauda Sub-Metropolitan City',
    'Makwanpurgadhi Municipality'
  ],
  'Gorkha': [
    'Gorkha Municipality',
    'Palungtar Municipality'
  ],
  'Lamjung': [
    'Besisahar Municipality'
  ],
  'Tanahun': [
    'Damauli Municipality',
    'Byas Municipality'
  ],
  'Syangja': [
    'Waling Municipality'
  ],
  'Parbat': [
    'Kusma Municipality'
  ],
  'Baglung': [
    'Baglung Municipality'
  ],
  'Myagdi': [
    'Beni Municipality'
  ],
  'Mustang': [
    'Jomsom Municipality'
  ],
  'Manang': [
    'Chame Municipality'
  ],
  'Nawalpur': [
    'Siddhartha Nagar Municipality'
  ],
  'Palpa': [
    'Tansen Municipality'
  ],
  'Gulmi': [
    'Tamghas Municipality'
  ],
  'Arghakhanchi': [
    'Sandhikharka Municipality'
  ],
  'Kapilvastu': [
    'Taulihawa Municipality'
  ],
  'Dang': [
    'Ghorahi Sub-Metropolitan City',
    'Dangisharan Municipality'
  ],
  'Banke': [
    'Nepalgunj Sub-Metropolitan City'
  ],
  'Bardiya': [
    'Gulariya Municipality'
  ],
  'Surkhet': [
    'Birendranagar Municipality'
  ],
  'Dailekh': [
    'Dailekh Municipality'
  ],
  'Jajarkot': [
    'Jajarkot Municipality'
  ],
  'Dolpa': [
    'Dunai Municipality'
  ],
  'Jumla': [
    'Jumla Municipality'
  ],
  'Kalikot': [
    'Manma Municipality'
  ],
  'Mugu': [
    'Gamgadhi Municipality'
  ],
  'Humla': [
    'Simkot Municipality'
  ],
  'Bajura': [
    'Bajura Municipality'
  ],
  'Bajhang': [
    'Bajhang Municipality'
  ],
  'Achham': [
    'Mangalsen Municipality'
  ],
  'Doti': [
    'Doti Municipality'
  ],
  'Kailali': [
    'Dhangadhi Sub-Metropolitan City'
  ],
  'Kanchanpur': [
    'Mahakali Municipality',
    'Bhimdatta Municipality'
  ],
  'Dadeldhura': [
    'Dadeldhura Municipality'
  ],
  'Baitadi': [
    'Baitadi Municipality'
  ],
  'Darchula': [
    'Darchula Municipality'
  ]
};

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear municipality when district changes
    if (name === 'district') {
      setFormData(prev => ({
        ...prev,
        district: value,
        municipality: ''
      }))
    }
    
    // Sync language change with i18n system
    if (name === 'language') {
      changeLanguage(value as 'en' | 'ne').catch(error => {
        console.warn('Failed to change language during registration:', error)
      })
    }
    
    // Clear field error when user starts typing
    if (errors[name as keyof RegisterFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = getTranslation('register.validation.emailRequired', 'Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = getTranslation('register.validation.emailInvalid', 'Please enter a valid email address')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = getTranslation('register.validation.passwordRequired', 'Password is required')
    } else if (formData.password.length < 6) {
      newErrors.password = getTranslation('register.validation.passwordMinLength', 'Password must be at least 6 characters')
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = getTranslation('register.validation.confirmPasswordRequired', 'Please confirm your password')
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = getTranslation('register.validation.passwordMismatch', 'Passwords do not match')
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = getTranslation('register.validation.nameRequired', 'Name is required')
    } else if (formData.name.trim().length < 2) {
      newErrors.name = getTranslation('register.validation.nameMinLength', 'Name must be at least 2 characters')
    }

    // Phone validation (optional but if provided, should be valid)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = getTranslation('register.validation.phoneInvalid', 'Please enter a valid phone number')
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = getTranslation('register.validation.roleRequired', 'Please select your role')
    }

    // Farmer-specific validations
    if (formData.role === 'FARMER') {
      if (!formData.district.trim()) {
        newErrors.district = getTranslation('register.validation.districtRequired', 'District is required for farmer registration')
      }
      if (!formData.municipality.trim()) {
        newErrors.municipality = getTranslation('register.validation.municipalityRequired', 'Municipality is required for farmer registration')
      }
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
      // Set default locale preferences based on selected language
      const defaultLocalePreferences = {
        dateFormat: 'DD/MM/YYYY' as const,
        timeFormat: '24h' as const,
        numberFormat: '1,234.56' as const,
        currency: 'NPR' as const
      }

      const userData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          name: formData.name,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        },
        language: formData.language,
        localePreferences: defaultLocalePreferences
      }

      // Add location data for farmers
      if (formData.role === 'FARMER') {
        userData.location = {
          district: formData.district,
          municipality: formData.municipality
        }
      }

      await register(userData)
      
      // Ensure language preference is synchronized after successful registration
      if (formData.language !== language) {
        await changeLanguage(formData.language)
      }
      
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error: any) {
      setErrors({
        general: error.message || getTranslation('register.validation.registrationFailed', 'Registration failed. Please try again.')
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
            {getTranslation('register.title', 'Create your account')}
          </h2>

          {/* Subtitle */}
          <p className="text-sm text-gray-600">
            {getTranslation('register.subtitle', 'Or')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {getTranslation('register.loginLink', 'sign in to existing account')}
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {getTranslation('register.roleLabel', 'I want to join as a')}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-3 border ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg`}
              >
                <option value="BUYER">{getTranslation('register.buyerOption', 'Buyer - I want to buy products')}</option>
                <option value="FARMER">{getTranslation('register.farmerOption', 'Farmer - I want to sell products')}</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Language Selection */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                {getTranslation('register.languagePreference', 'Preferred Language')}
              </label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg"
              >
                <option value="en">{getTranslation('common:languages.english', 'English')}</option>
                <option value="ne">{getTranslation('common:languages.nepali', 'नेपाली (Nepali)')}</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {getTranslation('auth:register.languageHelp', 'You can change this later in your settings')}
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.fullName', 'Full Name')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.fullNamePlaceholder', 'Enter your full name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.email', 'Email Address')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.emailPlaceholder', 'Enter your email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.phone', 'Phone Number')} ({getTranslation('common:labels.optional', 'Optional')})
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.phonePlaceholder', 'Enter your phone number')}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.address', 'Address')} ({getTranslation('common:labels.optional', 'Optional')})
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.addressPlaceholder', 'Enter your address')}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Farmer Location Fields */}
            {formData.role === 'FARMER' && (
              <>
                {/* District */}
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                    {getTranslation('auth:register.district', 'District')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`mt-1 block w-full px-3 py-3 border ${
                      errors.district ? 'border-red-300' : 'border-gray-300'
                    } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg`}
                  >
                    <option value="">{getTranslation('auth:register.selectDistrict', 'Select your district')}</option>
                    {nepalDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  {errors.district && (
                    <p className="mt-1 text-sm text-red-600">{errors.district}</p>
                  )}
                </div>

                {/* Municipality */}
                <div>
                  <label htmlFor="municipality" className="block text-sm font-medium text-gray-700">
                    {getTranslation('auth:register.municipality', 'Municipality')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="municipality"
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    disabled={!formData.district}
                    className={`mt-1 block w-full px-3 py-3 border ${
                      errors.municipality ? 'border-red-300' : 'border-gray-300'
                    } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-lg ${
                      !formData.district ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {formData.district ? getTranslation('auth:register.selectMunicipality', 'Select your municipality') : getTranslation('auth:register.selectDistrictFirst', 'Select district first')}
                    </option>
                    {formData.district && municipalitiesByDistrict[formData.district]?.map((municipality) => (
                      <option key={municipality} value={municipality}>
                        {municipality}
                      </option>
                    ))}
                  </select>
                  {errors.municipality && (
                    <p className="mt-1 text-sm text-red-600">{errors.municipality}</p>
                  )}
                  {formData.district && !municipalitiesByDistrict[formData.district] && (
                    <p className="mt-1 text-sm text-gray-600">
                      {getTranslation('auth:register.municipalityHelp', 'Please enter your municipality manually or contact support')}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.password', 'Password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.passwordPlaceholder', 'Create a password (min 6 characters)')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {getTranslation('auth:register.confirmPassword', 'Confirm Password')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-3 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-lg`}
                placeholder={getTranslation('auth:register.confirmPasswordPlaceholder', 'Confirm your password')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              } transition-colors duration-200`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {getTranslation('auth:register.creating', 'Creating account...')}
                </div>
              ) : (
                getTranslation('auth:register.submit', 'Create Account')
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {getTranslation('auth:register.backToHome', '← Back to Home')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register