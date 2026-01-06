// auth.ts
import { getApiUrl, FORCE_OFFLINE, PAYSTACK_PUBLIC_KEY } from './config';
import { getDeviceFingerprint } from './device';

export interface User {
  username: string;
  role: 'student' | 'admin';
  fullName?: string;
  regNumber?: string;
  isTokenLogin?: boolean;
  allowedExamType?: 'JAMB' | 'WAEC' | 'BOTH';
}

export interface TokenInfo {
  id: string;
  token_code: string;
  is_active: boolean;
  created_at: string;
  device_fingerprint?: string | null;
  bound_at?: string | null;
  expires_at?: string | null;
  metadata: {
    payment_ref?: string;
    amount_paid?: number;
    exam_type?: string;
    full_name?: string;
    phone_number?: string;
    email?: string;
    generated_by?: string;
    [key: string]: any;
  };
}

// Local storage keys
const CURRENT_USER_KEY = 'jamb_cbt_current_user';
const LOCAL_TOKENS_KEY = 'jamb_cbt_local_tokens';
const LOCAL_ADMIN_KEY = 'jamb_cbt_local_admin';

// --- Fetch wrapper with timeout ---
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number, fallbackError = 'Timeout'): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(fallbackError)), ms);
    promise
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
};

// --- API Request ---
const apiRequest = async (endpoint: string, method: string, body?: any) => {
  if (!navigator.onLine && !FORCE_OFFLINE) throw new Error('Network offline');
  if (FORCE_OFFLINE) throw new Error('Offline Mode Enforced');

  const url = getApiUrl(endpoint);
  const res = await fetchWithTimeout(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  }, 5000);

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Non-JSON response (Status ${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Request Failed');
  return data;
};

// --- LOCAL TOKEN HELPERS ---
const getLocalTokens = (): TokenInfo[] => {
  try { return JSON.parse(localStorage.getItem(LOCAL_TOKENS_KEY) || '[]'); } catch { return []; }
};

const saveLocalToken = (token: TokenInfo) => {
  const tokens = getLocalTokens().filter(t => t.token_code !== token.token_code);
  tokens.unshift(token);
  localStorage.setItem(LOCAL_TOKENS_KEY, JSON.stringify(tokens));
};

const updateLocalToken = (tokenCode: string, updates: Partial<TokenInfo>) => {
  const tokens = getLocalTokens().map(t => t.token_code === tokenCode ? { ...t, ...updates } : t);
  localStorage.setItem(LOCAL_TOKENS_KEY, JSON.stringify(tokens));
};

const deleteLocalToken = (tokenCode: string) => {
  const tokens = getLocalTokens().filter(t => t.token_code !== tokenCode);
  localStorage.setItem(LOCAL_TOKENS_KEY, JSON.stringify(tokens));
};

// --- SECURE TOKEN GENERATOR ---
const generateSecureToken = (prefix = 'ACE') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(12);
    crypto.getRandomValues(values);
    for (let i = 0; i < 12; i++) result += chars[values[i] % chars.length];
  } else {
    for (let i = 0; i < 12; i++) result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${result.substring(0, 4)}-${result.substring(4, 8)}-${result.substring(8, 12)}`;
};

// --- VERIFY TOKEN (OFFLINE) ---
const verifyLocalToken = async (token: string, fingerprint: string, confirmBinding: boolean): Promise<User> => {
  const found = getLocalTokens().find(t => t.token_code.toUpperCase() === token.trim().toUpperCase());
  if (!found) throw new Error('Invalid Access Code or not cached on this device.');
  if (!found.is_active) throw new Error('This token has been deactivated by Admin.');

  if (!found.device_fingerprint) {
    if (!confirmBinding) throw new Error('BINDING_REQUIRED');
    updateLocalToken(found.token_code, { device_fingerprint: fingerprint });
  } else if (found.device_fingerprint !== fingerprint) {
    throw new Error('⛔ ACCESS DENIED: Token locked to another device.');
  }

  return {
    username: found.token_code,
    role: 'student',
    fullName: found.metadata?.full_name || 'Candidate (Offline)',
    regNumber: found.token_code,
    isTokenLogin: true,
    allowedExamType: (found.metadata?.exam_type as any) || 'BOTH'
  };
};

// --- LOGIN WITH ACCESS CODE (STUDENT ONLY) ---
export const loginWithToken = async (token: string, confirmBinding = false): Promise<User> => {
  const fingerprint = await withTimeout(getDeviceFingerprint(), 10000, 'Device Identity Timeout');

  if (!FORCE_OFFLINE) {
    try {
      const res = await withTimeout(apiRequest('/api/auth/login-with-token', 'POST', {
        token, deviceFingerprint: fingerprint, confirm_binding: confirmBinding
      }), 5000);

      if (res.requires_binding) throw new Error('BINDING_REQUIRED');

      const user = res as User;

      saveLocalToken({
        id: `cached-${Date.now()}`,
        token_code: token,
        is_active: true,
        created_at: new Date().toISOString(),
        device_fingerprint: fingerprint,
        metadata: {
          full_name: user.fullName,
          exam_type: user.allowedExamType,
          generated_by: 'ONLINE_CACHE'
        }
      });

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      console.warn('Online login failed, falling back to local...');
    }
  }

  const user = await verifyLocalToken(token, fingerprint, confirmBinding);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

// --- PAYSTACK PAYMENT VERIFICATION ---
export const verifyPaystackPayment = async (
  reference: string, email: string, fullName: string, phoneNumber: string,
  examType: 'JAMB' | 'WAEC' | 'BOTH', amount: number
) => {
  if (FORCE_OFFLINE) {
    const token = generateSecureToken('OFFLINE');
    saveLocalToken({
      id: Date.now().toString(),
      token_code: token,
      is_active: true,
      created_at: new Date().toISOString(),
      device_fingerprint: null,
      metadata: { payment_ref: reference, amount_paid: amount, exam_type: examType, full_name: fullName, email, phone_number: phoneNumber }
    });
    return { success: true, token };
  }

  const res = await apiRequest('/api/payments/verify-paystack', 'POST', {
    reference, email, fullName, phoneNumber, examType
  });
  return res;
};

// --- ADMIN LOGIN (ONLINE/OFFLINE) ---
export const loginAdmin = async (username: string, password: string): Promise<User> => {
  if (FORCE_OFFLINE) {
    let creds = { username: 'ebusmomentum', password: 'ebus1988' };
    const stored = localStorage.getItem(LOCAL_ADMIN_KEY);
    if (stored) creds = JSON.parse(stored);

    if (username.toLowerCase() === creds.username.toLowerCase() && password === creds.password) {
      const adminUser: User = { username: creds.username, role: 'admin', fullName: 'System Administrator', regNumber: 'ADMIN-001' };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
      return adminUser;
    }
    throw new Error('Invalid Admin credentials (Offline)');
  }

  const user = await apiRequest('/api/auth/login', 'POST', { username, password, role: 'admin' });
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
};

// --- LOGOUT ---
export const logoutUser = () => localStorage.removeItem(CURRENT_USER_KEY);

// --- GET CURRENT USER ---
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};
