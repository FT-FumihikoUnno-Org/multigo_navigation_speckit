// webapp/src/frontend/src/tests/unit/ProtectedRoute.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useNavigate, useLocation, Outlet } from 'react-router-dom'; // Import Outlet
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n'; // Mocked or actual i18n config
import { AuthProvider, useAuth } from '../../context/AuthContext'; // Mocking the context
import { createMockAuthContext } from './AuthContextMock'; // Custom mock for AuthContext

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
  Outlet: jest.fn(() => <div data-testid="outlet">Outlet Content</div>), // Mock Outlet
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

describe('ProtectedRoute', () => {
  const mockNavigate = jest.fn();
  const mockLocation = { pathname: '/protected', search: '', hash: '', state: null, key: '' };

  // Mock AuthContext states
  const mockAuthLoading = createMockAuthContext({ isAuthenticated: false, isLoading: true });
  const mockAuthNotAuthenticated = createMockAuthContext({ isAuthenticated: false, isLoading: false });
  const mockAuthAuthenticatedUser = createMockAuthContext({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] },
    isAdmin: false,
  });
  const mockAuthAuthenticatedAdmin = createMockAuthContext({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'admin1', username: 'adminuser', email: 'admin@example.com', roles: [{ id: 'role2', name: 'Administrator' }] },
    isAdmin: true,
  });

  // Helper component to wrap ProtectedRoute for testing
  const ProtectedRouteWrapper = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
    return (
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <AuthProvider> {/* The AuthProvider will be mocked by useAuth mock */}
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/protected" element={<ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>} />
              <Route path="/admin-protected" element={<ProtectedRoute allowedRoles={['Administrator']}>{children}</ProtectedRoute>} />
              <Route path="/any" element={<div>Any Page</div>} />
            </Routes>
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock hooks
    jest.mocked(useNavigate).mockReturnValue(mockNavigate);
    jest.mocked(useLocation).mockReturnValue(mockLocation);
    // Default mock for useAuth
    jest.mocked(useAuth).mockReturnValue(mockAuthNotAuthenticated);
  });

  test('renders loading state while checking authentication', () => {
    jest.mocked(useAuth).mockReturnValue(mockAuthLoading);
    render(<ProtectedRouteWrapper><p>Protected Content</p></ProtectedRouteWrapper>);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  test('redirects to login page if not authenticated', async () => {
    // Ensure mockAuthNotAuthenticated is used
    jest.mocked(useAuth).mockReturnValue(mockAuthNotAuthenticated);

    render(<ProtectedRouteWrapper><p>Protected Content</p></ProtectedRouteWrapper>);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: mockLocation }, replace: true });
    });
  });

  test('allows access to route if authenticated and no role is specified', async () => {
    jest.mocked(useAuth).mockReturnValue(mockAuthAuthenticatedUser);
    render(<ProtectedRouteWrapper><p>Protected Content</p></ProtectedRouteWrapper>);

    // Check if the children component is rendered (simulated by checking for Outlet content if wrapped in App)
    // Or directly check if the content is rendered if it was passed as children.
    // In this setup, ProtectedRoute returns children directly if authenticated and roles match.
    // Let's simulate the children being rendered.
    render(
      <ProtectedRouteWrapper>
        <div data-testid="protected-content">Protected Content</div>
      </ProtectedRouteWrapper>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('redirects if authenticated but lacks required role', async () => {
    jest.mocked(useAuth).mockReturnValue(mockAuthAuthenticatedUser); // User is not an admin
    render(<ProtectedRouteWrapper allowedRoles={['Administrator']}><p>Protected Content</p></ProtectedRouteWrapper>);

    await waitFor(() => {
      // Should redirect to the fallback path, which is '/' in the App component's ProtectedRoute logic
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('allows access if authenticated and has the required role', async () => {
    jest.mocked(useAuth).mockReturnValue(mockAuthAuthenticatedAdmin); // User is an admin
    render(<ProtectedRouteWrapper allowedRoles={['Administrator']}><div data-testid="admin-content">Admin Content</div></ProtectedRouteWrapper>);

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
