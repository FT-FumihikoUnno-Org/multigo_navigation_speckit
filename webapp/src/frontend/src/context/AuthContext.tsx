import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: number; oidc_id: string; email: string; display_name: string; role: string } | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to read configured API base (uses process.env during tests; fallbacks to empty string)
  const getApiBase = () => {
    const apiEnv = (typeof process !== 'undefined' && (process.env as any).VITE_API_URL) || '';
    return String(apiEnv).replace(/\/$/, '');
  };

  // Placeholder functions for login/logout, will be implemented with actual API calls
  const login = () => {
    // Redirect to backend auth login endpoint
    const base = getApiBase();
    const loginUrl = base ? `${base}/auth/login` : '/auth/login';
    window.location.href = loginUrl;
  };

  const logout = async () => {
    // Call backend logout endpoint
    try {
      const base = getApiBase();
      const logoutUrl = base ? `${base}/auth/logout` : '/auth/logout';
      await fetch(logoutUrl, { method: 'POST', credentials: 'include' });
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/'; // Redirect to home or login page
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    // Skip initial session check when on the login page to avoid an expected 401 when just visiting /login
    if (typeof window !== 'undefined' && window.location && window.location.pathname === '/login') {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        // Allow configuring backend base URL via env var `VITE_API_URL`.
        // If not provided, fall back to relative /api path (works with server proxy).
        const base = getApiBase();
        const url = base ? `${base}/api/me` : '/api/me';

        const response = await fetch(url, { credentials: 'include' });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            // Safe to parse JSON directly
            try {
              const userData = await response.json();
              setIsAuthenticated(true);
              setUser(userData);
            } catch (parseErr) {
              console.error('Failed to parse JSON from /api/me even though content-type was JSON:', parseErr);
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            // Not JSON — avoid parsing HTML or other payloads as JSON
            const text = await response.text();
            console.warn('Received non-JSON response from /api/me (content-type:', contentType, ') first 200 chars:', text.slice(0, 200));
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
