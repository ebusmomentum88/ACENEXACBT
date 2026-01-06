// services/auth.ts
import axios from 'axios';

// User interface used across the app
export interface User {
  username: string;
  fullName: string;
  regNumber: string;
  allowedExamType: 'JAMB' | 'WAEC' | 'BOTH';
}

// Base URL of your API
const API_BASE = import.meta.env.VITE_API_BASE || 'https://acenexacbt-5b6j.onrender.com/api';

// ---- CHANGE PASSWORD ----
export const changePassword = async (
  username: string,
  oldPassword: string,
  newPassword: string,
  role: 'student' | 'admin'
): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE}/auth/change-password`, {
      username,
      oldPassword,
      newPassword,
      role,
    });

    if (response.status !== 200) {
      throw new Error(response.data?.message || 'Failed to change password');
    }
  } catch (error: any) {
    // Axios error handling
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to change password');
  }
};

// ---- LOGIN FUNCTION ----
export const login = async (
  username: string,
  password: string,
  role: 'student' | 'admin'
): Promise<User> => {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username,
      password,
      role,
    });

    if (response.status !== 200 || !response.data.user) {
      throw new Error(response.data?.message || 'Login failed');
    }

    return response.data.user as User;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Login failed');
  }
};

// ---- GET CURRENT USER (optional helper) ----
export const getCurrentUser = async (token: string): Promise<User> => {
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200 || !response.data.user) {
      throw new Error('Failed to fetch user');
    }

    return response.data.user as User;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch user');
  }
};
