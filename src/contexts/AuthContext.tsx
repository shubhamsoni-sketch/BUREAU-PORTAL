// Re-export from the canonical AuthContext location
// This file exists only for backward compatibility
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { AuthUser, UserRole } from '@/context/AuthContext';

export { AuthProvider, useAuth };
export type { AuthUser, UserRole };
