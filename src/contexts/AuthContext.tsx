import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, UserRole, isAdmin } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cache to avoid refetching role during the same session or across events
  const roleCache = useRef<Record<string, UserRole>>({});

  const fetchAndSetRole = async (sessionUser: User, event?: string) => {
    const isInitialOrRefresh = event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED';
    
    // Fast path for main admin
    if (isAdmin(sessionUser.email!)) {
      if (event !== 'TOKEN_REFRESHED') console.log('AuthContext: Main admin detected');
      setUserRole(UserRole.ADMIN);
      roleCache.current[sessionUser.id] = UserRole.ADMIN;
      localStorage.setItem(`role_${sessionUser.id}`, UserRole.ADMIN);
      return;
    }

    // Check caches (Memory then LocalStorage)
    let cachedRole: UserRole | null = null;
    try {
      cachedRole = roleCache.current[sessionUser.id] || 
                   localStorage.getItem(`role_${sessionUser.id}`) as UserRole | null;
    } catch (e) {
      console.warn('AuthContext: localStorage access failed', e);
    }

    
    if (cachedRole) {
      setUserRole(cachedRole);
      roleCache.current[sessionUser.id] = cachedRole;
      localStorage.setItem(`role_${sessionUser.id}`, cachedRole);
      
      // If we have a cache and it's just a refresh/init, we don't NEED to block the UI
      // for the status check. We'll fire it off in the background.
      if (isInitialOrRefresh) {
        // Run check in background without await
        fetchProfileAndEnforceStatus(sessionUser, event).catch(err => 
          console.error('AuthContext: Background profile check failed', err)
        );
        return;
      }
    }

    // Check metadata as secondary cache
    const metaRole = sessionUser.user_metadata?.role as UserRole | undefined;
    if (metaRole && !userRole) {
      setUserRole(metaRole);
      roleCache.current[sessionUser.id] = metaRole;
      try {
        localStorage.setItem(`role_${sessionUser.id}`, metaRole);
      } catch (e) {
        console.warn('AuthContext: localStorage access failed', e);
      }
    }

    // For SIGNED_IN or when no cache exists, we MUST await to ensure status is checked
    await fetchProfileAndEnforceStatus(sessionUser, event);
  };

  const fetchProfileAndEnforceStatus = async (sessionUser: User, event?: string) => {
    try {
      // Optimized query: only select what we need
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', sessionUser.id)
        .maybeSingle();
          
      if (error) {
        // Fallback for older schemas without 'status' column
        if (error.code === 'PGRST204' || error.message?.includes('status') || error.code === '42703') {
          const { data: fallbackProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', sessionUser.id)
            .maybeSingle();
          
          if (fallbackProfile) {
            updateUserRoleState(sessionUser.id, fallbackProfile.role as UserRole);
            return;
          }
        }
        throw error;
      }

      // Enforce block status
      if (profile?.status === 'blocked') {
        console.error('AuthContext: User is blocked');
        await handleBlockedUser(sessionUser.id, event);
        return;
      }

      const role = (profile?.role as UserRole) || UserRole.CANDIDATE;
      updateUserRoleState(sessionUser.id, role);
    } catch (error: any) {
      if (error.message?.includes("suspended")) throw error;
      
      console.error('AuthContext: Profile fetch error', error);
      // Default to CANDIDATE only if we have absolutely no role yet
      if (!userRole && !roleCache.current[sessionUser.id]) {
        updateUserRoleState(sessionUser.id, UserRole.CANDIDATE);
      }
    }
  };

  const updateUserRoleState = (userId: string, role: UserRole) => {
    setUserRole(role);
    roleCache.current[userId] = role;
    try {
      localStorage.setItem(`role_${userId}`, role);
    } catch (e) {
      console.warn('AuthContext: Could not save to localStorage', e);
    }
  };


  const handleBlockedUser = async (userId: string, event?: string) => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    try {
      localStorage.removeItem(`role_${userId}`);
    } catch (e) {
      console.warn('AuthContext: Could not remove from localStorage', e);
    }
    delete roleCache.current[userId];

    
    if (event === 'SIGNED_IN') {
      throw new Error("Your account has been suspended. Please contact administration for details.");
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          // Add a failsafe timeout for role fetching to prevent infinite loading
          try {
            await Promise.race([
              fetchAndSetRole(session.user, 'INITIAL_SESSION'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2500))
            ]);
          } catch (err) {
            console.warn('AuthContext: Initialization timed out or failed, proceeding with defaults', err);
            if (mounted && !roleCache.current[session.user.id]) {
              setUserRole(UserRole.CANDIDATE);
            }
          }
        }

      } catch (err) {
        console.error('AuthContext: Init error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      try {
        if (event !== 'TOKEN_REFRESHED') {
          console.log('AuthContext: Auth event', event, session?.user?.email);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
          if (mounted) setLoading(false);
          return;
        }

        // For INITIAL_SESSION fired by onAuthStateChange, skip if initAuth already handled it
        // to avoid double-processing on page load
        if (event === 'INITIAL_SESSION') {
          // initAuth already handles this, just ensure loading is cleared
          if (mounted) setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // Add timeout so auth state change never blocks the UI indefinitely
          try {
            await Promise.race([
              fetchAndSetRole(currentUser, event),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Auth state timeout')), 4000))
            ]);
          } catch (err) {
            console.warn('AuthContext: fetchAndSetRole timed out or failed during event', event, err);
            // Ensure we still have a role so the UI can render
            if (mounted && !roleCache.current[currentUser.id]) {
              setUserRole(UserRole.CANDIDATE);
            }
          }
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error('AuthContext: Auth change error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    });


    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  // Sign in with email/password (both admin and candidate)
  const signIn = async (email: string, password: string) => {
    // Optimistically set loading state for smoother UI
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data.user) {
        setUser(result.data.user);
        // Mandatory wait for role/status check during sign-in to prevent flash of blocked content
        await fetchAndSetRole(result.data.user, 'SIGNED_IN');
      }
      
      setLoading(false);
      return result.data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Candidate sign up - creates user without email confirmation
  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: UserRole.CANDIDATE,
        },
        emailRedirectTo: undefined,
      },
    });
    if (error) throw error;
  };

  // Send OTP via custom SMTP (not used in current flow)
  const signInWithOtp = async (email: string) => {
    // This function is kept for compatibility but not used
    throw new Error('OTP login not implemented');
  };

  // Verify OTP (not used in current flow)
  const verifyOtp = async (email: string, token: string) => {
    // This function is kept for compatibility but not used
    throw new Error('OTP verification not implemented');
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log('AuthContext: Initiating sign out');
      
      // Clear local state immediately for better UX
      const userId = user?.id;
      setUser(null);
      setUserRole(null);
      
      if (userId) {
        localStorage.removeItem(`role_${userId}`);
        delete roleCache.current[userId];
        // Clear Supabase related keys (standard pattern)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      await supabase.auth.signOut();
      console.log('AuthContext: Supabase sign out completed');
    } catch (err) {
      console.error('AuthContext: Unexpected error during sign out', err);
    } finally {
      console.log('AuthContext: Local state cleanup finished');
    }
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signInWithOtp,
    verifyOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
