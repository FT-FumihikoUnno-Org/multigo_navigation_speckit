import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

// Mock useAuth to control authentication state for testing
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: jest.fn(),
}));

describe('Navbar', () => {
  it('renders login button when not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    render(
      <Router>
        <Navbar />
      </Router>
    );

    // MUI Button with component=Link renders as an anchor (role=link)
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
  });

  it('renders dashboard and logout buttons for authenticated non-admin user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { display_name: 'Test User', role: 'Caregiver' },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    render(
      <Router>
        <Navbar />
      </Router>
    );

    // Dashboard is a link (component=Link), logout is a button
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout \(test user\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
  });

  it('renders dashboard, logout, and user management buttons for authenticated admin user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { display_name: 'Admin User', role: 'Administrator' },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });

    render(
      <Router>
        <Navbar />
      </Router>
    );

    // Dashboard and user management are links, logout is a button
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout \(admin user\)/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /user management/i })).toBeInTheDocument();
  });
});
