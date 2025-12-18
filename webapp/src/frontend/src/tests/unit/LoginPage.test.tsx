// webapp/src/frontend/src/tests/unit/LoginPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '../../context/AuthContext';
import LoginPage from '../../pages/LoginPage'; // Assuming LoginPage is exported from here
import { createMockAuthContext } from '../../__mocks__/AuthContextMock'; // Custom mock

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Simple mock for translation function
    i18n: { language: 'en' },
  }),
}));

// Mock AuthContext
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock apiService (if login initiates a redirect or has side effects to test)
// For now, we'll mock the context directly.

describe('LoginPage', () => {
  const mockNavigate = jest.fn();
  const mockLogin = jest.fn();
  const mockUseAuth = createMockAuthContext({
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
  });

  // Mock AuthContext
  jest.mocked(useAuth).mockReturnValue(mockUseAuth);
  // Mock react-router-dom hooks
  jest.mocked(useNavigate).mockReturnValue(mockNavigate);
  jest.mocked(useLocation).mockReturnValue({ pathname: '/login', search: '', hash: '', state: null, key: '' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login title, description, and login button', () => {
    render(
      <BrowserRouter>
        <I18nextProvider> {/* Wrap with I18nextProvider if needed by components */}
          <LoginPage />
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('login_page_title')).toBeInTheDocument();
    expect(screen.getByText('login_description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login_button' })).toBeInTheDocument();
  });

  test('redirects to dashboard if user is already authenticated', () => {
    const mockAuthAlreadyAuthenticated = createMockAuthContext({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    });
    jest.mocked(useAuth).mockReturnValue(mockAuthAlreadyAuthenticated);

    render(
      <BrowserRouter>
        <I18nextProvider>
          <LoginPage />
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('calls login function when login button is clicked', async () => {
    render(
      <BrowserRouter>
        <I18nextProvider>
          <LoginPage />
        </I18nextProvider>
      </BrowserRouter>
    );

    const loginButton = screen.getByRole('button', { name: 'login_button' });
    fireEvent.click(loginButton);

    // Check if the login function from context was called
    expect(mockLogin).toHaveBeenCalledTimes(1);
    // Note: The actual redirection after login is handled by the useEffect in LoginPage
    // which depends on the isAuthenticated state change *after* login is processed by the backend.
    // We are testing that the login() function *itself* is called.
  });
});
