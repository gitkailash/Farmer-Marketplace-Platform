import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UserSettings from '../UserSettings';
import { AuthProvider } from '../../contexts/AuthProvider';
import { I18nProvider } from '../../contexts/I18nProvider';
import { ToastProvider } from '../../contexts/ToastProvider';
import authSlice from '../../store/slices/authSlice';
import cartSlice from '../../store/slices/cartSlice';
import notificationSlice from '../../store/slices/notificationSlice';

// Mock the hooks and contexts
jest.mock('../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      _id: '123',
      email: 'test@example.com',
      role: 'BUYER',
      profile: { name: 'Test User' },
      language: 'en',
      localePreferences: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        numberFormat: '1,234.56',
        currency: 'NPR'
      }
    },
    refreshAuth: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../contexts/I18nProvider', () => ({
  useI18n: () => ({
    language: 'en',
    changeLanguage: jest.fn(),
    availableLanguages: ['en', 'ne']
  }),
  useAppTranslation: () => ({
    t: (key: string) => key
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('../../hooks/useLocaleFormatting', () => ({
  useLocaleFormatting: () => ({
    formatDate: (date: Date) => '31/12/2024',
    formatTime: (date: Date) => '14:30',
    formatNumber: (num: number) => '1,234.56',
    formatCurrency: (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`
  })
}));

// Mock fetch
global.fetch = jest.fn();

const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      cart: cartSlice,
      notification: notificationSlice
    }
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              {component}
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('UserSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the settings page', async () => {
    renderWithProviders(<UserSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('settings.title')).toBeInTheDocument();
    });
  });

  it('displays language preferences section', async () => {
    renderWithProviders(<UserSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('settings.languagePreferences')).toBeInTheDocument();
    });
  });

  it('displays locale preferences section', async () => {
    renderWithProviders(<UserSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('settings.localePreferences')).toBeInTheDocument();
    });
  });

  it('displays preview section', async () => {
    renderWithProviders(<UserSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('settings.previewSection')).toBeInTheDocument();
    });
  });

  it('shows save and reset buttons', async () => {
    renderWithProviders(<UserSettings />);
    
    await waitFor(() => {
      expect(screen.getByText('settings.saveChanges')).toBeInTheDocument();
      expect(screen.getByText('settings.resetToDefaults')).toBeInTheDocument();
    });
  });
});