import React, { useState, useEffect, useRef } from 'react'
import { getLocalizedText } from '../../utils/multilingual'
import { MultilingualField } from '../../types/api'

export interface MayorMessageData {
  _id: string
  text: MultilingualField | string // Support both old and new format
  imageUrl?: string
  scrollSpeed: number // pixels per second
  isActive: boolean
}

interface MayorMessageProps {
  message: MayorMessageData | null
  className?: string
  language?: string
}

const MayorMessage: React.FC<MayorMessageProps> = ({ 
  message, 
  className = '',
  language = 'en'
}) => {
  const [isPaused, setIsPaused] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number | undefined>(undefined)

  // Helper function to get localized text from multilingual field or string
  const getLocalizedMessageText = (text: MultilingualField | string): string => {
    if (typeof text === 'string') {
      return text // Legacy format
    }
    return getLocalizedText(text, language as 'en' | 'ne')
  }

  useEffect(() => {
    if (!message?.isActive || !containerRef.current || !textRef.current) {
      return
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      if (!isPaused && containerRef.current && textRef.current) {
        const container = containerRef.current
        const text = textRef.current
        
        // Calculate movement based on time and speed
        const movement = (deltaTime / 1000) * message.scrollSpeed
        
        setScrollPosition(prevPosition => {
          const newPosition = prevPosition + movement
          const containerWidth = container.clientWidth
          const textWidth = text.scrollWidth
          
          // Reset position when text has completely scrolled off screen
          if (newPosition > textWidth + containerWidth) {
            return -containerWidth
          }
          
          return newPosition
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start with text off-screen to the left
    const initialPosition = containerRef.current.clientWidth
    setScrollPosition(-initialPosition)
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, message?.scrollSpeed, message?.isActive, message?.text, language])

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  // Don't render if no message or message is inactive
  if (!message || !message.isActive) {
    return null
  }

  return (
    <div 
      className={`relative overflow-hidden bg-blue-600 text-white ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <div className="flex items-center min-h-[70px] sm:min-h-[90px] lg:min-h-[100px]">
        {/* Optional image */}
        {message.imageUrl && (
          <div className="flex-shrink-0 p-2 sm:p-4">
            <img
              src={message.imageUrl}
              alt="Mayor"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Scrolling text container */}
        <div className="flex-1 relative overflow-hidden">
          <div 
            ref={textRef}
            className="whitespace-nowrap py-4 px-2"
            style={{ 
              transform: `translateX(-${scrollPosition}px)`,
              willChange: 'transform',
              transition: isPaused ? 'transform 0.3s ease' : 'none'
            }}
          >
            <span className="text-base sm:text-lg lg:text-xl font-semibold">
              📢 {getLocalizedMessageText(message.text)}
            </span>
          </div>
        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-2 right-2 bg-black/30 text-white px-2 py-1 rounded text-xs">
          Paused
        </div>
      )}

      {/* Gradient overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-blue-600 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-blue-600 to-transparent pointer-events-none" />
    </div>
  )
}

export default MayorMessage