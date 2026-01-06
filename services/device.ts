// device.ts
// Generates a unique fingerprint for the device to enforce token/device binding

import { FORCE_OFFLINE } from './config';

// Simple helper to hash a string to a 32-bit hex
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

// Generate a persistent fingerprint stored in localStorage
export const getDeviceFingerprint = async (): Promise<string> => {
  if (FORCE_OFFLINE) {
    // Always return same offline fingerprint
    return 'OFFLINE-FINGERPRINT';
  }

  // Check if we already stored a fingerprint
  let stored = localStorage.getItem('device_fingerprint');
  if (stored) return stored;

  // Use browser data for fingerprint
  const navigatorData = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    navigator.vendor
  ].join('|');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasData = '';
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "16px 'Arial'";
    ctx.fillText("DEVICE_FINGERPRINT", 2, 2);
    canvasData = canvas.toDataURL();
  }

  const fingerprint = hashString(navigatorData + canvasData + Date.now());
  localStorage.setItem('device_fingerprint', fingerprint);
  return fingerprint;
};
