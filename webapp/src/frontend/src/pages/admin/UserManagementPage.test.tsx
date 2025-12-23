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
        <UserManagementPage />
      </Router>
    );

    expect(fetch).toHaveBeenCalledWith('/api/users');

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
      expect(screen.getByText('Nurse User')).toBeInTheDocument();
      expect(screen.getAllByText('Nurse').length).toBeGreaterThan(0);
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
        <UserManagementPage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Nurse User')).toBeInTheDocument();
      expect(screen.getAllByText('Nurse').length).toBeGreaterThan(0);
    });

    // Find the table row for Nurse User and the select element within it
    const nurseRow = screen.getByText('Nurse User').closest('tr');
    const { within } = require('@testing-library/dom');
    const selectElement = within(nurseRow).getByDisplayValue('Nurse');

    // Directly change the select value since MUI's Menu may not render in jsdom
    fireEvent.change(selectElement, { target: { value: 'Administrator' } });

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
        json: () => Promise.resolve({ message: 'Server error' }),
      })
    );

    render(
      <Router>
        <UserManagementPage />
      </Router>
    );

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});