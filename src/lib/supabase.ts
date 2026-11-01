import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User roles
export enum UserRole {
  ADMIN = 'admin',
  CANDIDATE = 'candidate',
}

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

// Check if user is admin (this is a helper, but we should primarily use the role from profiles)
export const isAdmin = (email: string) => {
  // For safety, we still keep the original admin email as a super-admin
  // But we will primarily rely on the 'role' column in the database
  return email?.toLowerCase() === 'girishsutar2005.ggs@gmail.com';
};
