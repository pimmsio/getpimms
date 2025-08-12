// Auth system constants and types

// Storage keys (now only user data and status, cookies handle auth)
export const AUTH_STORAGE_KEYS = {
  USER: 'pimms_auth_user',
  STATUS: 'pimms_auth_status'
} as const;

export const AUTH_STORAGE_KEYS_ARRAY = Object.values(AUTH_STORAGE_KEYS);

// Auth status type
export type AuthStatus = "unknown" | "in" | "out";

// User data type
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

// Storage data interface (simplified for cookie-based auth)
export interface AuthStorageData {
  [AUTH_STORAGE_KEYS.USER]?: AuthUser;
  [AUTH_STORAGE_KEYS.STATUS]?: 'authenticated' | 'unauthenticated';
}