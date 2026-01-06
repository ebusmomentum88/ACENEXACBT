
// configuration for API connection

// Your Backend URL - FOR LOCAL DEVELOPMENT USE LOCALHOST
export const BACKEND_URL = "http://localhost:5000";

// SET THIS TO TRUE TO DISABLE BACKEND AND USE LOCAL STORAGE ONLY
// Change to 'false' when you want to connect to the real server.
export const FORCE_OFFLINE = false;

// --- PAYSTACK PUBLIC KEY ---
// Use TEST keys for development, LIVE keys for production
// Test keys start with "pk_test_" and are for sandbox/testing
// Live keys start with "pk_live_" and are for real payments
export const PAYSTACK_PUBLIC_KEY = "pk_test_1234567890abcdefghijklmnopqrstuvwxyz"; // CHANGE THIS TO YOUR TEST KEY 

export const getApiUrl = (endpoint: string) => {
    // Ensure no double slashes if BACKEND_URL ends with /
    const base = BACKEND_URL.replace(/\/$/, '');
    return `${base}${endpoint}`;
};
