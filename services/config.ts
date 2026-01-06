// config.ts

// --- BACKEND URLs ---
export const API_DEV = 'http://localhost:5000'; // Local development backend
export const API_PROD = 'https://acenexacbt.onrender.com'; // <-- Replace with your real backend URL

// --- PAYSTACK PUBLIC KEY ---
export const PAYSTACK_PUBLIC_KEY = 'pk_live_6285198feb88d1bf9515732e6eea990012a8344e'; // <-- Replace with your actual Paystack public key

// --- OFFLINE MODE ---
export const FORCE_OFFLINE = false; // Set true to force offline mode for testing

// --- API HELPER ---
export const getApiUrl = (endpoint: string) => {
  const isProd = import.meta.env.MODE === 'production';
  const baseUrl = isProd ? API_PROD : API_DEV;
  return `${baseUrl}${endpoint}`;
};
