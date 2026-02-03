import React from 'react'
import { ButtonLoader } from './LoadingSpinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-2xl 
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-4 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95 transform
    select-none touch-manipulation
    min-w-[48px]
    -webkit-tap-highlight-color-transparent
    keyboard-nav
  `
  
  const variantClasses = {
    primary: `
      bg-primary-600 text-white 
      hover:bg-primary-700 hover:shadow-lg hover:-translate-y-1
      focus:ring-primary-500 
      active:bg-primary-800 active:translate-y-0 active:shadow-md
    `,
    secondary: `
      bg-secondary-200 text-secondary-900 
      hover:bg-secondary-300 hover:shadow-lg hover:-translate-y-1
      focus:ring-secondary-500 
      active:bg-secondary-400 active:translate-y-0 active:shadow-md
    `,
    danger: `
      bg-red-600 text-white 
      hover:bg-red-700 hover:shadow-lg hover:-translate-y-1
      focus:ring-red-500 
      active:bg-red-800 active:translate-y-0 active:shadow-md
    `,
    success: `
      bg-green-600 text-white 
      hover:bg-green-700 hover:shadow-lg hover:-translate-y-1
      focus:ring-green-500 
      active:bg-green-800 active:translate-y-0 active:shadow-md
    `,
    outline: `
      border-2 border-secondary-300 bg-white text-secondary-700 
      hover:bg-secondary-50 hover:border-secondary-400 hover:shadow-lg hover:-translate-y-1
      focus:ring-primary-500 focus:border-primary-500
      active:bg-secondary-100 active:translate-y-0 active:shadow-md
    `
  }
  
  const sizeClasses = {
    sm: 'px-5 py-3 text-base min-h-[48px] gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:min-h-[44px]',
    md: 'px-7 py-4 text-lg min-h-[64px] gap-3 sm:px-6 sm:py-3.5 sm:text-base sm:min-h-[56px] lg:min-h-[48px] lg:py-3',
    lg: 'px-9 py-5 text-xl min-h-[72px] gap-3 sm:px-8 sm:py-4.5 sm:text-lg sm:min-h-[64px] lg:min-h-[56px] lg:py-4'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`.replace(/\s+/g, ' ').trim()
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <ButtonLoader />
          <span className="sr-only">Loading...</span>
        </>
      ) : (
        <>
          {icon && (
            <span className="text-lg leading-none flex items-center justify-center" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="leading-none">{children}</span>
        </>
      )}
    </button>
  )
}

export default Button

// Specialized button components
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="primary" {...props} />
)

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="secondary" {...props} />
)

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="danger" {...props} />
)

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="success" {...props} />
)

export const OutlineButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant="outline" {...props} />
)