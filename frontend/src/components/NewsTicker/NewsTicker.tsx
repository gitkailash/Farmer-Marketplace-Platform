import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, FileText, File, AlertCircle, Circle, Link } from 'lucide-react'
import { getLocalizedText } from '../../utils/multilingual'
import { MultilingualField } from '../../types/api'

export interface NewsItem {
  _id: string
  headline: MultilingualField | string // Support both old and new format
  content?: MultilingualField | string
  link?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH'
  language: string
  isActive: boolean
  publishedAt: string
}

interface NewsTickerProps {
  items: NewsItem[]
  scrollSpeed?: number // pixels per second
  language?: string
  className?: string
  onHeadlineClick?: (item: NewsItem) => void
}

const NewsTicker: React.FC<NewsTickerProps> = ({ 
  items, 
  scrollSpeed = 60,
  language = 'en',
  className = '',
  onHeadlineClick
}) => {
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number | undefined>(undefined)

  // Helper function to get localized text from multilingual field or string
  const getLocalizedHeadline = (headline: MultilingualField | string): string => {
    if (typeof headline === 'string') {
      return headline // Legacy format
    }
    return getLocalizedText(headline, language as 'en' | 'ne')
  }

  const getLocalizedContent = (content?: MultilingualField | string): string | undefined => {
    if (!content) return undefined
    if (typeof content === 'string') {
      return content // Legacy format
    }
    return getLocalizedText(content, language as 'en' | 'ne')
  }

  // Filter and sort news items
  const activeItems = items
    .filter(item => item.isActive && item.language === language)
    .sort((a, b) => {
      // Sort by priority first (HIGH > NORMAL > LOW), then by published date
      const priorityOrder = { HIGH: 3, NORMAL: 2, LOW: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

  // Duplicate items for seamless looping if we have items
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

      if (containerRef.current && contentRef.current) {
        const content = contentRef.current
        
        // Calculate movement based on time and speed
        const movement = (deltaTime / 1000) * scrollSpeed
        
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
  }, [scrollSpeed, displayItems.length])

  // Update scroll position
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateX(-${scrollPosition}px)`
    }
  }, [scrollPosition])

  const handleHeadlineClick = (item: NewsItem) => {
    if (item.link) {
      // External link
      window.open(item.link, '_blank', 'noopener,noreferrer')
    } else if (onHeadlineClick) {
      // Custom click handler
      onHeadlineClick(item)
    }
  }

  const getPriorityStyles = (priority: NewsItem['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-100 bg-red-600/20 border-red-400'
      case 'NORMAL':
        return 'text-white'
      case 'LOW':
        return 'text-gray-200'
      default:
        return 'text-white'
    }
  }

  const getPriorityIcon = (priority: NewsItem['priority']) => {
    switch (priority) {
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
      case 'NORMAL':
        return <FileText className="w-5 h-5 mr-2 text-blue-500" />
      case 'LOW':
        return <File className="w-5 h-5 mr-2 text-gray-400" />
      default:
        return <FileText className="w-5 h-5 mr-2 text-blue-500" />
    }
  }

  if (displayItems.length === 0) {
    return (
      <div className={`bg-gray-800 text-white ${className}`}>
        <div className="flex items-center justify-center h-12 px-4">
          <AlertCircle className="w-5 h-5 mr-2 text-gray-400" />
          <span className="text-sm text-gray-400">
            No news available
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-gray-900 text-white ${className}`}>
      <div className="flex items-center h-12">
        {/* News label */}
        <div className="flex-shrink-0 bg-red-600 px-3 py-2 h-full flex items-center">
          <FileText className="w-5 h-5 mr-2 text-white" />
          <span className="text-xs font-bold uppercase tracking-wide">
            News
          </span>
        </div>

        {/* Scrolling content container */}
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          <div 
            ref={contentRef}
            className="flex items-center transition-transform duration-100 ease-linear"
            style={{ willChange: 'transform' }}
          >
            {displayItems.map((item, index) => (
              <div
                key={`${item._id}-${index}`}
                className={`flex-shrink-0 flex items-center px-6 py-2 cursor-pointer hover:bg-white/10 transition-colors duration-200 ${getPriorityStyles(item.priority)}`}
                onClick={() => handleHeadlineClick(item)}
                title={getLocalizedContent(item.content) || getLocalizedHeadline(item.headline)}
              >
                <span className="mr-2 text-sm">
                  {getPriorityIcon(item.priority)}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">
                  {getLocalizedHeadline(item.headline)}
                </span>
                {item.priority === 'HIGH' && (
                  <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                    URGENT
                  </span>
                )}
                {item.link && (
                  <span className="ml-2 text-xs opacity-75">
                    <Link className="w-4 h-4 text-gray-500" />
                  </span>
                )}
                <span className="mx-4 text-gray-500">
                  <Circle className="w-2.5 h-2.5 text-gray-500" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient overlay for smooth edge */}
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none" />
    </div>
  )
}

export default NewsTicker