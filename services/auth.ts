// services/auth.ts
export interface User {
  username: string;
  fullName: string;
  regNumber: string;
  allowedExamType: 'JAMB' | 'WAEC' | 'BOTH';
}

export interface TokenInfo {
  id: string;
  token_code: string;
  is_active: boolean;
  device_fingerprint?: string;
  expires_at?: string;
  metadata?: {
    full_name?: string;
    phone_number?: string;
    exam_type?: 'JAMB' | 'WAEC' | 'BOTH';
    payment_ref?: string;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://acenexacbt-5b6j.onrender.com/api';

/**
 * Login a user (alias for backward compatibility)
 */
export const login = async (username: string, password: string): Promise<User> => {
  return loginUser(username, password, 'student');
};

/**
 * Login a user with username and password
 */
export const loginUser = async (username: string, password: string, role: 'student' | 'admin'): Promise<User> => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
      credentials: 'include',
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
 * Login with access token
 */
export const loginWithToken = async (token: string, forceBinding: boolean = false): Promise<User> => {
  try {
    const res = await fetch(`${API_BASE}/auth/token-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, forceBinding }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Token login failed');
    }
    const data = await res.json();
    return data.user as User;
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Verify Paystack payment and generate token
 */
export const verifyPaystackPayment = async (
  reference: string,
  email: string,
  fullName: string,
  phoneNumber: string,
  examType: 'JAMB' | 'WAEC' | 'BOTH',
  amount: number
): Promise<{ token: string }> => {
  try {
    const res = await fetch(`${API_BASE}/payments/verify-paystack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference, email, fullName, phoneNumber, examType, amount }),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Payment verification failed');
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(err);
    throw err;
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
    // Clear local session
    localStorage.removeItem('current_user');
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Logout user (alias for backward compatibility)
 */
export const logoutUser = async (): Promise<void> => {
  return logout();
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

/**
 * Register a new student
 */
export const registerStudent = async (fullName: string, regNumber: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/students/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fullName, regNumber }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Registration failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Get all students
 */
export const getAllStudents = async (): Promise<User[]> => {
  try {
    const res = await fetch(`${API_BASE}/admin/students`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch students');
    }
    const data = await res.json();
    return data as User[];
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

/**
 * Delete a student
 */
export const deleteStudent = async (username: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/students/${username}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Delete failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Generate manual token (for cash/transfer payments)
 */
export const generateManualToken = async (
  reference: string,
  amount: number,
  examType: 'JAMB' | 'WAEC' | 'BOTH',
  fullName?: string,
  phoneNumber?: string
): Promise<{ token: string }> => {
  try {
    const res = await fetch(`${API_BASE}/admin/tokens/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reference, amount, examType, fullName, phoneNumber }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Token generation failed');
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Generate local token immediately (fallback for offline/timeout scenarios)
 */
export const generateLocalTokenImmediate = (
  reference: string,
  amount: number,
  examType: 'JAMB' | 'WAEC' | 'BOTH',
  fullName?: string,
  phoneNumber?: string
): { token: string } => {
  // Generate a local token immediately without waiting for backend
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = `LOCAL-${examType.substring(0, 1)}-${randomPart}-${timestamp.toString(36).toUpperCase()}`;
  
  // Store locally for later sync
  try {
    const localTokens = JSON.parse(localStorage.getItem('pending_tokens') || '[]');
    localTokens.push({
      token,
      reference,
      amount,
      examType,
      fullName,
      phoneNumber,
      createdAt: timestamp,
      synced: false
    });
    localStorage.setItem('pending_tokens', JSON.stringify(localTokens));
  } catch (e) {
    console.error('Failed to save local token:', e);
  }
  
  return { token };
};

/**
 * Get all tokens
 */
export const getAllTokens = async (): Promise<TokenInfo[]> => {
  try {
    const res = await fetch(`${API_BASE}/admin/tokens`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch tokens');
    }
    const data = await res.json();
    return data as TokenInfo[];
  } catch (err: any) {
    console.error(err);
    return [];
  }
};

/**
 * Toggle token active status
 */
export const toggleTokenStatus = async (tokenCode: string, isActive: boolean): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/tokens/${tokenCode}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Toggle status failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Reset device lock for a token
 */
export const resetTokenDevice = async (tokenCode: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/tokens/${tokenCode}/reset-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Reset device failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Delete a token
 */
export const deleteToken = async (tokenCode: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/tokens/${tokenCode}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Delete token failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};

/**
 * Update admin credentials
 */
export const updateAdminCredentials = async (
  currentUsername: string,
  currentPassword: string,
  newUsername: string,
  newPassword: string
): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/admin/update-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ currentUsername, currentPassword, newUsername, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Update credentials failed');
    }
  } catch (err: any) {
    console.error(err);
    throw err;
  }
};
