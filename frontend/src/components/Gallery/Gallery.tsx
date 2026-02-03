import React, { useState, useEffect, useRef } from 'react'
import { useI18n } from '../../contexts/I18nProvider'
import { getLocalizedText, getLanguageIndicator } from '../../utils/multilingual'
import { MultilingualField } from '../../types/api'

export interface GalleryItem {
  _id: string
  title: MultilingualField
  description?: MultilingualField
  imageUrl: string
  category: {
    en: string
    ne?: string
  }
  order: number
  isActive: boolean
}

interface GalleryProps {
  items: GalleryItem[]
  autoScrollSpeed?: number // pixels per second
  className?: string
}

const Gallery: React.FC<GalleryProps> = ({ 
  items, 
  autoScrollSpeed = 50, 
  className = '' 
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number | undefined>(undefined)
  const { language } = useI18n()

  // Filter and sort active items
  const activeItems = items
    .filter(item => item.isActive)
    .sort((a, b) => a.order - b.order)

  // Duplicate items for seamless looping
  const displayItems = activeItems.length > 0 ? [...activeItems, ...activeItems] : []

  useEffect(() => {
    if (!containerRef.current || !contentRef.current || displayItems.length === 0) {
      return
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      if (!isPaused && containerRef.current && contentRef.current) {
        const content = contentRef.current
        
        // Calculate movement based on time and speed
        const movement = (deltaTime / 1000) * autoScrollSpeed
        
        setScrollPosition(prevPosition => {
          const newPosition = prevPosition + movement
          const contentWidth = content.scrollWidth / 2 // Half because we duplicated items
          
          // Reset position when we've scrolled through one full set
          if (newPosition >= contentWidth) {
            return 0
          }
          
          return newPosition
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, autoScrollSpeed, displayItems.length])

  // Update scroll position
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateX(-${scrollPosition}px)`
    }
  }, [scrollPosition])

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  if (displayItems.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`} role="region" aria-label="Gallery">
        <div className="text-gray-500">
          <span className="text-4xl mb-4 block" aria-hidden="true">🖼️</span>
          <p className="text-lg font-medium">No gallery items available</p>
          <p className="text-sm">Gallery content will appear here when added by administrators</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      ref={containerRef}
      role="region"
      aria-label="Image gallery"
      aria-live="polite"
    >
      {/* Gallery container */}
      <div 
        ref={contentRef}
        className="flex transition-transform duration-100 ease-linear"
        style={{ willChange: 'transform' }}
        role="group"
        aria-label="Gallery images"
      >
        {displayItems.map((item, index) => {
          // Get localized content with fallbacks
          const localizedTitle = getLocalizedText(item?.title, language) || 'Gallery Item'
          const localizedCategory = typeof item?.category === 'string' 
            ? item.category 
            : (getLocalizedText(item?.category, language) || 'Uncategorized')
          const titleIndicator = getLanguageIndicator(item?.title, language)
          
          return (
            <div
              key={`${item._id}-${index}`}
              className="flex-shrink-0 relative group"
              style={{ 
                width: 'clamp(280px, 85vw, 320px)', 
                height: 'clamp(180px, 50vw, 220px)' 
              }}
              role="img"
              aria-label={`${localizedTitle} - ${localizedCategory}`}
            >
              <img
                src={item.imageUrl}
                alt={`${localizedTitle} - ${localizedCategory} gallery image`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgNzVIMTc1VjEyNUgxMjVWNzVaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNDAgMTAwTDE1MCA5MEwxNjAgMTAwTDE3MCA5MEwxODAgMTAwVjExNUgxNDBWMTAwWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K'
                  target.alt = `Failed to load image: ${localizedTitle}`
                }}
              />
              
              {/* Overlay with title */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-medium text-base truncate sm:text-sm">
                      {localizedTitle}
                    </h3>
                    {titleIndicator.show && (
                      <span 
                        className="text-white/70 text-xs px-2 py-1 bg-black/30 rounded-full"
                        title={`Content available in ${titleIndicator.language === 'en' ? 'English' : 'Nepali'} only`}
                      >
                        {titleIndicator.language === 'en' ? 'EN' : 'नेपाली'}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm capitalize sm:text-xs">
                    {localizedCategory}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div 
          className="absolute top-5 right-5 bg-black/50 text-white px-3 py-2 rounded-lg text-sm sm:top-4 sm:right-4 sm:px-2 sm:py-1 sm:text-xs"
          role="status"
          aria-live="polite"
        >
          <span className="sr-only">Gallery animation is </span>
          Paused
        </div>
      )}

      {/* Gradient overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none sm:w-8" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none sm:w-8" aria-hidden="true" />
    </div>
  )
}

export default Gallery