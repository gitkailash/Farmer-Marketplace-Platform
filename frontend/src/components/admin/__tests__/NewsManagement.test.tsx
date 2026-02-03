import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NewsManagement from '../NewsManagement'

// Mock the dependencies
vi.mock('../../contexts/ToastProvider', () => ({
  useToastContext: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

vi.mock('../../contexts/I18nProvider', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: 'en'
  })
}))

vi.mock('../../services/contentService', () => ({
  adminNewsService: {
    getAllItems: vi.fn().mockResolvedValue({
      success: true,
      data: []
    })
  }
}))

describe('NewsManagement', () => {
  it('renders without crashing', async () => {
    render(<NewsManagement />)
    
    // Wait for the component to load
    expect(screen.getByText('News Ticker Management')).toBeInTheDocument()
    expect(screen.getByText('Add News Item')).toBeInTheDocument()
  })

  it('shows multilingual support info', async () => {
    render(<NewsManagement />)
    
    // Check for multilingual-related text
    expect(screen.getByText(/manage multiple languages/i)).toBeInTheDocument()
  })
})