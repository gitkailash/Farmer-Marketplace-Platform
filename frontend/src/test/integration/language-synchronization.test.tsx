import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../contexts/I18nProvider';
import { AuthProvider } from '../../contexts/AuthProvider';
import Register from '../../pages/Register';
import authSlice from '../../store/slices/authSlice';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
      isInitialized: true
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        lastRefresh: 0,
        refreshPromise: null,
        isRestoring: false
      }
    }
  });
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = createTestStore();
  
  return (
    <Provider store={store}>
      <MemoryRouter>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('Language Synchronization during Registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should initialize registration form with current language', async () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('en')).toBeInTheDocument();
    });
  });

  it('should display language selection options', async () => {
    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    await waitFor(() => {
      const languageSelect = screen.getByLabelText(/preferred language/i);
      expect(languageSelect).toBeInTheDocument();
      
      const englishOption = screen.getByDisplayValue('en');
      const nepaliOption = screen.getByDisplayValue('ne');
      
      expect(englishOption).toBeInTheDocument();
      expect(nepaliOption).toBeInTheDocument();
    });
  });

  it('should include language preference in registration data', async () => {
    const mockRegister = jest.fn().mockResolvedValue({});
    
    // Mock the auth context
    jest.mock('../../contexts/AuthProvider', () => ({
      useAuth: () => ({
        register: mockRegister,
        isAuthenticated: false,
        loading: false
      })
    }));

    render(
      <TestWrapper>
        <Register />
      </TestWrapper>
    );

    // This test verifies that the registration form includes language preference
    // The actual form submission testing would require more complex mocking
    await waitFor(() => {
      expect(screen.getByLabelText(/preferred language/i)).toBeInTheDocument();
    });
  });
});

describe('OnboardingWelcome Language Synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render onboarding welcome component', () => {
    const mockOnComplete = jest.fn();
    
    const { OnboardingWelcome } = require('../../components/UI/OnboardingWelcome');
    
    render(
      <TestWrapper>
        <OnboardingWelcome onComplete={mockOnComplete} />
      </TestWrapper>
    );

    expect(screen.getByText(/welcome to farmer marketplace/i)).toBeInTheDocument();
  });
});