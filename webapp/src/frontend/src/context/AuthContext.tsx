// webapp/src/frontend/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import apiService from '../services/apiService'; // Assuming apiService is correctly exported

// Define interfaces for User and Role
export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean; // Helper to quickly check for admin role
}

interface AuthContextProps extends AuthState {
  setUser: Dispatch<SetStateAction<User | null>>;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>; // Method to re-check auth status
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially

  // Helper derived state
  const isAdmin = user?.roles.some(role => role.name === 'Administrator') || false;

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // If getCurrentUser fails (e.g., 401 Unauthorized), user is not authenticated
      setUser(null);
      setIsAuthenticated(false);
      console.error('Authentication check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    // This function might initiate the OAuth flow, which is typically handled by a redirect.
    // The actual authentication state update will happen after the callback.
    // For direct login simulation, you might call apiService.login() if it existed
    // and then call checkAuthStatus() to update the context.
    // Here, we'll just redirect to the login page, and checkAuthStatus will handle updating state upon return.
    // In a real app, you might redirect the user here.
    try {
      await apiService.initiateLogin(); // This should trigger a redirect from the backend
      // If initiateLogin doesn't redirect and returns, it means something else needs to happen.
      // For now, we assume it redirects.
    } catch (error) {
      console.error('Login initiation failed:', error);
      // Optionally show an error message to the user
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
      // Optionally redirect to login page after logout
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show an error message to the user
    }
  };

  // Initial check on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        setUser,
        setIsAuthenticated,
        setIsLoading,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};