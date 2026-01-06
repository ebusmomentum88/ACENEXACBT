// device.ts
// Generates a unique fingerprint for the device using browser info and local storage

export const getDeviceFingerprint = async (): Promise<string> => {
  const STORAGE_KEY = 'jamb_cbt_device_fingerprint';

  // 1. Check if a fingerprint is already stored locally
  let fingerprint = localStorage.getItem(STORAGE_KEY);
  if (fingerprint) return fingerprint;

  // 2. Generate fingerprint using browser data
  const navigatorInfo = window.navigator;
  const screenInfo = window.screen;

  const rawData = [
    navigatorInfo.userAgent,
    navigatorInfo.platform,
    navigatorInfo.language,
    screenInfo.width,
    screenInfo.height,
    screenInfo.colorDepth,
    new Date().getTimezoneOffset(),
  ].join('::');

  // Simple hash function
  const hash = (str: string): string => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h.toString(16).replace('-', '');
  };

  fingerprint = `DEV-${hash(rawData)}-${Date.now().toString(36)}`;

  // 3. Store fingerprint for future use
  localStorage.setItem(STORAGE_KEY, fingerprint);

  return fingerprint;
};
