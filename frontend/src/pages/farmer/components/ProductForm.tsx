import React, { useState, useEffect } from 'react'
import {
  SelectField,
  FormGroup,
  FormActions,
  PrimaryButton,
  SecondaryButton,
  MultilingualInputField,
  MultilingualTextareaField
} from '../../../components/UI'
import { Product, MultilingualField } from '../../../types/api'
import { ProductCreateRequest } from '../../../services/productService'
import { useI18n, useAppTranslation } from '../../../contexts/I18nProvider'

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductCreateRequest) => Promise<void>
  onCancel: () => void
}

interface FormData {
  name: {
    en: string
    ne: string
  }
  description: {
    en: string
    ne: string
  }
  category: string
  price: string
  unit: string
  stock: string
  images: string[]
}

interface FormErrors {
  name?: {
    en?: string
    ne?: string
  }
  description?: {
    en?: string
    ne?: string
  }
  category?: string
  price?: string
  unit?: string
  stock?: string
  images?: string
}

const CATEGORIES = [
  { value: 'Vegetables', label: 'Vegetables' },
  { value: 'Fruits', label: 'Fruits' },
  { value: 'Grains', label: 'Grains & Cereals' },
  { value: 'Dairy', label: 'Dairy Products' },
  { value: 'Meat', label: 'Meat & Poultry' },
  { value: 'Herbs', label: 'Herbs' },
  { value: 'Spices', label: 'Spices' },
  { value: 'Nuts', label: 'Nuts' },
  { value: 'Seeds', label: 'Seeds' },
  { value: 'Other', label: 'Other' }
]

const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'liter', label: 'Liter' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' }
]

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const { language } = useI18n()
  const { t } = useAppTranslation('farmer')
  
  const [formData, setFormData] = useState<FormData>({
    name: {
      en: '',
      ne: ''
    },
    description: {
      en: '',
      ne: ''
    },
    category: '',
    price: '',
    unit: '',
    stock: '',
    images: ['']
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Helper function to extract multilingual field value
  const extractMultilingualValue = (field: string | MultilingualField): { en: string; ne: string } => {
    if (typeof field === 'string') {
      return { en: field, ne: '' }
    }
    return {
      en: field.en || '',
      ne: field.ne || ''
    }
  }

  // Initialize form with product data if editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: extractMultilingualValue(product.name),
        description: extractMultilingualValue(product.description),
        category: typeof product.category === 'string' ? product.category : product.category.en,
        price: product.price.toString(),
        unit: product.unit,
        stock: product.stock.toString(),
        images: product.images.length > 0 ? product.images : ['']
      })
    }
  }, [product])

  // Handle multilingual input changes
  const handleMultilingualChange = (field: 'name' | 'description', value: { en: string; ne: string }) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  // Handle regular input changes
  const handleInputChange = (field: keyof Omit<FormData, 'name' | 'description'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle image URL changes
  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData(prev => ({ ...prev, images: newImages }))
  }

  // Add new image URL field
  const addImageField = () => {
    if (formData.images.length < 5) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ''] }))
    }
  }

  // Remove image URL field
  const removeImageField = (index: number) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, images: newImages }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation (English required, Nepali optional)
    if (!formData.name.en.trim()) {
      newErrors.name = { en: t('products.form.validation.nameRequired') as string || 'Product name is required' }
    } else if (formData.name.en.trim().length < 2) {
      newErrors.name = { en: t('products.form.validation.nameMinLength') as string || 'Product name must be at least 2 characters' }
    }

    // Description validation (English required, Nepali optional)
    if (!formData.description.en.trim()) {
      newErrors.description = { en: t('products.form.validation.descriptionRequired') as string || 'Product description is required' }
    } else if (formData.description.en.trim().length < 10) {
      newErrors.description = { en: t('products.form.validation.descriptionMinLength') as string || 'Description must be at least 10 characters' }
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = t('products.form.validation.categoryRequired') as string || 'Please select a category'
    }

    // Price validation
    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price)) {
      newErrors.price = t('products.form.validation.priceRequired') as string || 'Please enter a valid price'
    } else if (price <= 0) {
      newErrors.price = t('products.form.validation.pricePositive') as string || 'Price must be greater than 0'
    }

    // Unit validation
    if (!formData.unit) {
      newErrors.unit = t('products.form.validation.unitRequired') as string || 'Please select a unit'
    }

    // Stock validation
    const stock = parseInt(formData.stock)
    if (!formData.stock || isNaN(stock)) {
      newErrors.stock = t('products.form.validation.stockRequired') as string || 'Please enter a valid stock quantity'
    } else if (stock < 0) {
      newErrors.stock = t('products.form.validation.stockNonNegative') as string || 'Stock cannot be negative'
    }

    // Image validation (at least one valid URL)
    const validImages = formData.images.filter(img => img.trim())
    if (validImages.length === 0) {
      newErrors.images = t('products.form.validation.imagesRequired') as string || 'At least one product image is required'
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

    try {
      const validImages = formData.images.filter(img => img.trim())
      
      const submitData: ProductCreateRequest = {
        name: {
          en: formData.name.en.trim(),
          ne: formData.name.ne.trim() || undefined
        } as MultilingualField,
        description: {
          en: formData.description.en.trim(),
          ne: formData.description.ne.trim() || undefined
        } as MultilingualField,
        category: formData.category,
        price: parseFloat(formData.price),
        unit: formData.unit,
        stock: parseInt(formData.stock),
        images: validImages
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormGroup>
        {/* Product Name - Multilingual */}
        <MultilingualInputField
          label={(t('products.form.name') as string) || 'Product Name'}
          name="name"
          value={formData.name}
          onChange={(value) => handleMultilingualChange('name', value)}
          error={errors.name}
          placeholder={(t('products.form.name') as string) || 'Enter product name'}
          required
        />

        {/* Description - Multilingual */}
        <MultilingualTextareaField
          label={(t('products.form.description') as string) || 'Description'}
          name="description"
          value={formData.description}
          onChange={(value) => handleMultilingualChange('description', value)}
          error={errors.description}
          placeholder={(t('products.form.description') as string) || 'Describe your product...'}
          rows={4}
          required
        />

        {/* Category */}
        <SelectField
          label={(t('products.form.category') as string) || 'Category'}
          name="category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          error={errors.category}
          options={CATEGORIES.map(cat => ({
            value: cat.value,
            label: language === 'ne' ? ((t(`categories.${cat.value.toLowerCase()}`) as string) || cat.label) : cat.label
          }))}
          placeholder={(t('products.form.category') as string) || 'Select a category'}
          required
        />

        {/* Price and Unit Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-lg font-medium text-secondary-700 sm:text-base">
              {(t('products.form.price') as string) || 'Price'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none sm:pl-4">
                <span className="text-secondary-400 text-2xl sm:text-xl">₨</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                name="price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                className={`
                  w-full px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
                  border-2 rounded-2xl text-lg sm:text-lg lg:text-base
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
                  hover:border-secondary-400
                  min-h-[64px] sm:min-h-[56px] lg:min-h-[48px]
                  bg-white
                  touch-manipulation
                  -webkit-tap-highlight-color-transparent
                  keyboard-nav
                  pl-14 sm:pl-12 lg:pl-10
                  ${errors.price ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
                `}
                required
              />
            </div>
            {errors.price && (
              <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
                <span>⚠️</span>
                {errors.price}
              </p>
            )}
          </div>

          <SelectField
            label={(t('products.form.unit') as string) || 'Unit'}
            name="unit"
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            error={errors.unit}
            options={UNITS.map(unit => ({
              value: unit.value,
              label: language === 'ne' ? ((t(`units.${unit.value}`) as string) || unit.label) : unit.label
            }))}
            placeholder={(t('products.form.unit') as string) || 'Select unit'}
            required
          />
        </div>

        {/* Stock */}
        <div className="space-y-3">
          <label className="block text-lg font-medium text-secondary-700 sm:text-base">
            {(t('products.form.stock') as string) || 'Stock Quantity'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            min="0"
            name="stock"
            value={formData.stock}
            onChange={(e) => handleInputChange('stock', e.target.value)}
            placeholder={(t('products.form.validation.stockRequired') as string) || 'Enter available quantity'}
            className={`
              w-full px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
              border-2 rounded-2xl text-lg sm:text-lg lg:text-base
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
              hover:border-secondary-400
              min-h-[64px] sm:min-h-[56px] lg:min-h-[48px]
              bg-white
              touch-manipulation
              -webkit-tap-highlight-color-transparent
              keyboard-nav
              ${errors.stock ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-secondary-300'}
            `}
            required
          />
          {errors.stock && (
            <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
              <span>⚠️</span>
              {errors.stock}
            </p>
          )}
          <p className="text-base text-secondary-500 sm:text-sm">
            {(t('products.form.stockHelp') as string) || 'Number of units available for sale'}
          </p>
        </div>

        {/* Product Images */}
        <div className="space-y-3">
          <label className="block text-lg font-medium text-secondary-700 sm:text-base">
            {(t('products.form.images') as string) || 'Product Images'}
            <span className="text-red-500 ml-1">*</span>
          </label>
          
          {formData.images.map((image, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                name={`image-${index}`}
                value={image}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder={(t('products.form.imageUrlPlaceholder') as string) || 'Enter image URL'}
                className={`
                  flex-1 px-5 py-5 sm:px-4 sm:py-4 lg:px-3 lg:py-3
                  border-2 rounded-2xl text-lg sm:text-lg lg:text-base
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500
                  hover:border-secondary-400
                  min-h-[64px] sm:min-h-[56px] lg:min-h-[48px]
                  bg-white
                  touch-manipulation
                  -webkit-tap-highlight-color-transparent
                  keyboard-nav
                  border-secondary-300
                `}
              />
              
              {formData.images.length > 1 && (
                <SecondaryButton
                  type="button"
                  size="sm"
                  onClick={() => removeImageField(index)}
                  className="px-3"
                >
                  ✕
                </SecondaryButton>
              )}
            </div>
          ))}
          
          {formData.images.length < 5 && (
            <SecondaryButton
              type="button"
              size="sm"
              onClick={addImageField}
            >
              {(t('products.form.addAnotherImage') as string) || '+ Add Another Image'}
            </SecondaryButton>
          )}
          
          {errors.images && (
            <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm">
              <span>⚠️</span>
              {errors.images}
            </p>
          )}
          
          <p className="text-sm text-gray-500">
            {(t('products.form.imagesHelp') as string) || 'Add up to 5 image URLs. The first image will be used as the main product image.'}
          </p>
        </div>
      </FormGroup>

      {/* Form Actions */}
      <FormActions>
        <SecondaryButton
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {(t('products.form.cancel') as string) || 'Cancel'}
        </SecondaryButton>
        
        <PrimaryButton
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {product ? (t('products.form.editProduct') as string || 'Update Product') : (t('products.form.addProduct') as string || 'Create Product')}
        </PrimaryButton>
      </FormActions>
    </form>
  )
}

export default ProductForm