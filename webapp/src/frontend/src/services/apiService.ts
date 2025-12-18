// webapp/src/frontend/src/services/apiService.ts

import { Role } from '../context/AuthContext'; // Assuming Role type is defined here

// Define the structure for User data returned from the API
interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}

// Define the structure for API errors
interface ApiError {
  message: string;
  statusCode: number;
}

const API_BASE_URL = '/api'; // Assuming API routes are prefixed with /api

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || 'An unknown error occurred', statusCode: response.status };
    }
    throw new Error(`API Error (${errorData.statusCode}): ${errorData.message}`);
  }

  // Handle cases like logout that might not return JSON
  if (response.status === 204) { // No Content
    return {} as T; // Or whatever is appropriate for an empty response
  }

  return response.json() as Promise<T>;
}

// --- Authentication ---

export async function initiateLogin(): Promise<void> {
  // This endpoint likely redirects, so we might not expect JSON data back.
  // For simplicity, we'll treat it as a request that initiates a process.
  // A real implementation might need to handle redirects differently or mock this.
  await request(`${API_BASE_URL}/auth/login`);
}

export async function logout(): Promise<void> {
  // Assuming logout returns a success status (e.g., 200 OK or 204 No Content)
  await request(`${API_BASE_URL}/auth/logout`);
}

// --- User Management ---

export async function getCurrentUser(): Promise<User> {
  return request<User>(`${API_BASE_URL}/users/me`);
}

// webapp/src/frontend/src/services/apiService.ts

import { Role } from '../context/AuthContext'; // Assuming Role type is defined here

// Define the structure for User data returned from the API
interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}

// Define the structure for API errors
interface ApiError {
  message: string;
  statusCode: number;
}

const API_BASE_URL = '/api'; // Assuming API routes are prefixed with /api

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText || 'An unknown error occurred', statusCode: response.status };
    }
    throw new Error(`API Error (${errorData.statusCode}): ${errorData.message}`);
  }

  // Handle cases like logout that might not return JSON
  if (response.status === 204) { // No Content
    return {} as T; // Or whatever is appropriate for an empty response
  }

  // Handle cases where the response might be empty but is OK (e.g., successful POST with no content)
  if (response.status === 200 && response.headers.get('content-length') === '0') {
    return {} as T;
  }


  return response.json() as Promise<T>;
}

// --- Authentication ---

export async function initiateLogin(): Promise<void> {
  // This endpoint likely redirects, so we might not expect JSON data back.
  // For simplicity, we'll treat it as a request that initiates a process.
  // A real implementation might need to handle redirects differently or mock this.
  await request(`${API_BASE_URL}/auth/login`);
}

export async function logout(): Promise<void> {
  // Assuming logout returns a success status (e.g., 200 OK or 204 No Content)
  await request(`${API_BASE_URL}/auth/logout`);
}

// --- User Management ---

export async function getCurrentUser(): Promise<User> {
  return request<User>(`${API_BASE_URL}/users/me`);
}

export async function getAllUsers(): Promise<User[]> {
  return request<User[]>(`${API_BASE_URL}/users`);
}

export async function updateUserRole(userId: string, role: string): Promise<User> {
  return request<User>(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });
}

export const apiService = {
  initiateLogin,
  logout,
  getCurrentUser,
  getAllUsers,
  updateUserRole,
};

export default apiService;