import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage'; // Assume LoginPage will be created

// Mock useAuth to control authentication state for testing
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'), // Import and retain default behavior
  useAuth: jest.fn(),
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: mockLogin,
      logout: jest.fn(),
      loading: false,
    });
  });

  it('renders login button', () => {
    render(
      <Router>
        <LoginPage />
      </Router>
    );
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls login function on button click', () => {
    render(
      <Router>
        <LoginPage />
      </Router>
    );
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('redirects to dashboard if already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { display_name: 'Test User' },
      login: mockLogin,
      logout: jest.fn(),
      loading: false,
    });

    render(
      <Router>
        <LoginPage />
      </Router>
    );

    // Assert that the user is redirected or dashboard content is shown
    // This requires a bit more setup in a real router test,
    // but for now, we'll check for absence of login button or presence of dashboard text.
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    // In a real scenario, you might mock 'useNavigate' and check if it was called with '/dashboard'
  });
});
