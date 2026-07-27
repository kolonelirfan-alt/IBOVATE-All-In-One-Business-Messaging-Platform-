// Shared API utilities and constants

export const DEMO_WORKSPACE_ID = "66e3c66a-9464-4ee6-abd0-4d886b5ef3c8";

export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Fallback to Next.js API proxy to avoid CORS and localhost fetch failures in production browser
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};
