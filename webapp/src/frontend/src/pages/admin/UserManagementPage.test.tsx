import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import UserManagementPage from './UserManagementPage'; // Assume UserManagementPage will be created
import { AuthProvider, useAuth } from '../../context/AuthContext';

// Mock useAuth to control authentication state for testing
jest.mock('../../context/AuthContext', () => ({
  ...jest.requireActual('../../context/AuthContext'),
  useAuth: jest.fn(),
}));

// Mock fetch API calls
global.fetch = jest.fn();

const mockUsers = [
  { id: 1, display_name: 'Admin User', role: 'Administrator' },
  { id: 2, display_name: 'Nurse User', role: 'Nurse' },
];

describe('UserManagementPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, display_name: 'Admin User', role: 'Administrator' },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    });
    (fetch as jest.Mock).mockClear();
  });

  it('renders user list correctly', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      })
    );

    render(
      <Router>
        <AuthProvider>
          <UserManagementPage />
        </AuthProvider>
      </Router>
    );

    expect(fetch).toHaveBeenCalledWith('/api/users');

    await waitFor(() => {
      expect(screen.getByText('Admin User (Administrator)')).toBeInTheDocument();
      expect(screen.getByText('Nurse User (Nurse)')).toBeInTheDocument();
    });
  });

  it('allows changing user role', async () => {
    (fetch as jest.Mock)
      .mockImplementationOnce(() => // Mock GET /api/users
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsers),
        })
      )
      .mockImplementationOnce(() => // Mock PUT /api/users/:id/role
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' }),
        })
      );

    render(
      <Router>
        <AuthProvider>
          <UserManagementPage />
        </AuthProvider>
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Nurse User (Nurse)')).toBeInTheDocument();
    });

    // Find the select element for Nurse User and change its value
    const selectElement = screen.getByDisplayValue('Nurse');
    fireEvent.mouseDown(selectElement); // Open the select dropdown
    const newRoleOption = await screen.findByText('Administrator'); // Find the new role option
    fireEvent.click(newRoleOption); // Click on the new role option

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/2/role', expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleName: 'Administrator' }),
      }));
    });
  });

  it('displays error if fetching users fails', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      })
    );

    render(
      <Router>
        <AuthProvider>
          <UserManagementPage />
        </AuthProvider>
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading users')).toBeInTheDocument();
    });
  });
});