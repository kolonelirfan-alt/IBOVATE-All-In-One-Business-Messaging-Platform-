// Shared API utilities and constants

export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000000";

export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};
