import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MayorMessageManagement from '../MayorMessageManagement'

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
  adminMayorService: {
    getAllMessages: vi.fn().mockResolvedValue({
      success: true,
      data: []
    })
  }
}))

describe('MayorMessageManagement', () => {
  it('renders without crashing', async () => {
    render(<MayorMessageManagement />)
    
    // Wait for the component to load
    expect(screen.getByText('Mayor Message Configuration')).toBeInTheDocument()
    expect(screen.getByText('Create Mayor Message')).toBeInTheDocument()
  })

  it('shows multilingual support info', async () => {
    render(<MayorMessageManagement />)
    
    // Check for multilingual-related text
    expect(screen.getByText(/manage multiple languages/i)).toBeInTheDocument()
  })
})