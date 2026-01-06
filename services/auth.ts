// services/auth.ts
export interface User {
  username: string;
  fullName: string;
  regNumber: string;
  allowedExamType: 'JAMB' | 'WAEC' | 'BOTH';
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://acenexacbt-5b6j.onrender.com/api';

/**
 * Login a user
 */
export const login = async (username: string, password: string): Promise<User> => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // for session/cookie auth
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }

    const data = await res.json();
    return data.user as User;
  } catch (err: any) {
    console.error(err);
    throw new Error(err.message || 'Login error');
  }
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Logout failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Get currently authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      return null; // Not logged in
    }

    const data = await res.json();
    return data.user as User;
  } catch (err) {
    console.error(err);
    return null;
  }
};

/**
 * Change user password
 */
export const changePassword = async (
  username: string,
  oldPassword: string,
  newPassword: string,
  role: 'student' | 'admin'
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, oldPassword, newPassword, role }),
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Password change failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
