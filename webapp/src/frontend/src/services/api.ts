// webapp/src/frontend/src/services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'; // Use Vite's env variable for API base URL

// Helper function for making authenticated requests
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, options);

  if (response.redirected) {
    // If the backend initiates a redirect (e.g., for OIDC login), follow it
    window.location.href = response.url;
    // Return a Promise that never resolves to prevent further execution in this function
    return new Promise(() => {}); 
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Something went wrong');
  }

  // Handle cases where the response might be empty (e.g., logout success with no body)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T; // Return an empty object for no content
  }

  return response.json();
}

// Authentication API calls
export const authApi = {
  login: (): Promise<any> => fetcher('/auth/login'), // This will trigger a redirect
  logout: (): Promise<{ message: string }> => fetcher('/auth/logout', { method: 'POST' }), // Use POST for logout
  fetchCurrentUser: (): Promise<any> => fetcher('/users/me'),
};

// User Management API calls
export const userApi = {
  fetchAllUsers: (): Promise<any[]> => fetcher('/users'),
  assignUserRole: (userId: number, roleId: number): Promise<{ message: string }> =>
    fetcher(`/users/${userId}/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roleId }),
    }),
};

// You can add other API categories here as needed
