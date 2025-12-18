// webapp/src/frontend/src/tests/integration/auth.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n'; // Mocked or actual i18n config
import { AuthProvider, useAuth } from '../../context/AuthContext';
import App from '../../App'; // The main App component to test routing
import LoginPage from '../../pages/LoginPage'; // Component to render on /login
import DashboardPage from '../../pages/DashboardPage'; // Component to render on /
import UserManagementPage from '../../pages/UserManagementPage'; // Component to render on /user-management

// Mock apiService for controlled responses
const mockApiService = {
  getCurrentUser: jest.fn(),
  initiateLogin: jest.fn(),
  logout: jest.fn(),
  getAllUsers: jest.fn(), // Mock for user management page
  updateUserRole: jest.fn(), // Mock for user management page
};
jest.mock('../../services/apiService', () => ({
  __esModule: true,
  default: mockApiService,
}));

// Mock AuthContext for easier control over auth state
const mockAuthContext = (initialState: any) => {
  const {
    user, isAuthenticated, isLoading, isAdmin, login, logout, checkAuthStatus
  } = initialState;

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login: jest.fn().mockImplementation(() => login ? login() : Promise.resolve()),
    logout: jest.fn().mockImplementation(() => logout ? logout() : Promise.resolve()),
    checkAuthStatus: jest.fn().mockImplementation(() => checkAuthStatus ? checkAuthStatus() : Promise.resolve()),
  };
};

// Helper function to render App with AuthContext and Router
const renderWithProviders = (
  ui: React.ReactElement,
  authContextValue: any = mockAuthContext({ isAuthenticated: false, isLoading: false, isAdmin: false })
) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <AuthProvider value={authContextValue}>
          {ui}
        </AuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Mock hook for AuthContext
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock navigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


describe('Integration Tests - Authentication and Routing', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock default AuthContext state
    const defaultAuthContext = mockAuthContext({
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
      login: jest.fn().mockResolvedValue(undefined), // Mock login to do nothing by default
      logout: jest.fn().mockResolvedValue(undefined), // Mock logout
      checkAuthStatus: jest.fn().mockResolvedValue(undefined), // Mock checkAuthStatus
    });
    jest.mocked(useAuth).mockReturnValue(defaultAuthContext);

    // Mock navigate
    jest.mocked(useNavigate).mockReturnValue(mockNavigate);
    // Mock apiService responses
    mockApiService.getCurrentUser.mockResolvedValue({ id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] });
    mockApiService.initiateLogin.mockResolvedValue(undefined);
    mockApiService.logout.mockResolvedValue(undefined);
  });

  test('redirects to login page if not authenticated and accessing protected route', async () => {
    // Render App, but start at the protected dashboard route
    render(
      <BrowserRouter initialEntries={['/']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider> {/* AuthProvider will set isAuthenticated to false initially */}
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    // Wait for loading to finish and check if navigated to login
    await waitFor(() => {
      expect(screen.getByText('login_page_title')).toBeInTheDocument(); // Check if login page is rendered
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: { pathname: '/' } }, replace: true });
  });

  test('allows access to login page when not authenticated', async () => {
    render(
      <BrowserRouter initialEntries={['/login']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('login_page_title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login_button' })).toBeInTheDocument();
  });

  test('redirects to dashboard after successful login', async () => {
    // Mock AuthContext to simulate successful login
    const mockAuthAfterLogin = mockAuthContext({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] },
      login: jest.fn().mockImplementation(async () => {
        // Simulate state change after login
        mockAuthAfterLogin.isAuthenticated = true;
        mockAuthAfterLogin.user = { id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] };
        mockAuthAfterLogin.isLoading = false;
        // Manually trigger re-render if necessary or rely on context update
      }),
    });
    jest.mocked(useAuth).mockReturnValue(mockAuthAfterLogin);

    // Render LoginPage
    render(
      <BrowserRouter initialEntries={['/login']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    // Find the login button and click it
    const loginButton = screen.getByRole('button', { name: 'login_button' });
    fireEvent.click(loginButton);

    // Wait for the isAuthenticated state to change and trigger navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { state: { from: { pathname: '/login' } }, replace: true });
    });
  });

  test('allows access to dashboard if authenticated', async () => {
    const mockAuthAuthenticated = mockAuthContext({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] },
    });
    jest.mocked(useAuth).mockReturnValue(mockAuthAuthenticated);

    render(
      <BrowserRouter initialEntries={['/']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('dashboard_title')).toBeInTheDocument();
  });

  test('redirects non-admin users away from user management page', async () => {
    const mockAuthUser = mockAuthContext({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user1', username: 'testuser', email: 'test@example.com', roles: [{ id: 'role1', name: 'User' }] }, // Not an admin
      isAdmin: false,
    });
    jest.mocked(useAuth).mockReturnValue(mockAuthUser);

    render(
      <BrowserRouter initialEntries={['/user-management']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    // Should redirect to dashboard (root path '/')
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('allows admin users access to user management page', async () => {
    const mockAuthAdmin = mockAuthContext({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'admin1', username: 'adminuser', email: 'admin@example.com', roles: [{ id: 'role1', name: 'Administrator' }] },
      isAdmin: true,
    });
    jest.mocked(useAuth).mockReturnValue(mockAuthAdmin);

    // Mock the UserManagementPage component to ensure it renders correctly when accessed
    // In a real scenario, you would render App and check the rendered output.
    // For simplicity here, we'll check if the route is accessible.
    render(
      <BrowserRouter initialEntries={['/user-management']}>
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nextProvider>
      </BrowserRouter>
    );

    // Check if the UserManagementPage's content is rendered (e.g., the title)
    await waitFor(() => {
      expect(screen.getByText('user_management_title')).toBeInTheDocument();
    });
  });
});
