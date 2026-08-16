import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AuthContext = createContext(undefined);

const DEMO_SESSION_KEY = 'careslot_demo_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDemoSession = () => {
    try {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const setDemoSession = (demoData) => {
    try {
      if (demoData) {
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoData));
      } else {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to set demo session:', e);
    }
  };

  const fetchProfile = async (userId, fallbackUser = null) => {
    if (!userId) return null;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', userId)
          .single();

        if (!error && data && data.role) {
          return data;
        }

        // No profiles row exists for this authenticated user (e.g. the
        // profiles table was reset/recreated after the account was created,
        // or the on-signup trigger didn't fire). Self-heal by writing one
        // back — otherwise every insert that references profiles(id) as a
        // foreign key (like booking an appointment) will silently fail.
        if (fallbackUser) {
          const metadata = fallbackUser.user_metadata || {};
          const healedRole =
            metadata.role ||
            (fallbackUser.email?.includes('doctor') ? 'doctor' :
             fallbackUser.email?.includes('admin') ? 'admin' : 'patient');
          const healedProfile = {
            id: userId,
            full_name: metadata.full_name || fallbackUser.email?.split('@')[0] || 'User',
            role: healedRole,
          };
          try {
            const { data: upserted, error: upsertError } = await supabase
              .from('profiles')
              .upsert(healedProfile)
              .select('id, full_name, role')
              .single();
            if (!upsertError && upserted) {
              return upserted;
            }
          } catch (e) {
            console.warn('Profile self-heal upsert failed:', e);
          }
        }
      } catch (e) {
        console.warn('Supabase profile query failed, using metadata fallback:', e);
      }
    }

    // Fallback profile resolution
    const metadata = fallbackUser?.user_metadata || {};
    let resolvedRole = metadata.role;

    if (!resolvedRole) {
      const demo = getDemoSession();
      if (demo && demo.user?.id === userId) {
        resolvedRole = demo.user.user_metadata?.role;
      }
    }

    if (!resolvedRole) {
      const email = fallbackUser?.email || '';
      if (email.includes('doctor')) resolvedRole = 'doctor';
      else if (email.includes('admin')) resolvedRole = 'admin';
      else resolvedRole = 'patient';
    }

    return {
      id: userId,
      full_name: metadata.full_name || fallbackUser?.email?.split('@')[0] || 'User',
      role: resolvedRole,
    };
  };

  const loadProfile = useCallback(async (userId, fallbackUser = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }
    const prof = await fetchProfile(userId, fallbackUser);
    setProfile(prof);
    return prof;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data: { session: sbSession } } = await supabase.auth.getSession();
          if (!mounted) return;

          if (sbSession?.user) {
            setSession(sbSession);
            await loadProfile(sbSession.user.id, sbSession.user);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Supabase getSession failed, checking demo session:', e);
        }
      }

      const demo = getDemoSession();
      if (demo?.user && mounted) {
        setSession(demo);
        await loadProfile(demo.user.id, demo.user);
      }
      if (mounted) setLoading(false);
    };

    initAuth();
  }, [loadProfile]);

  const signUp = async ({ email, password, fullName, role = 'patient' }) => {
    setSession(null);
    setProfile(null);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
          },
        });

        if (error) {
          const isFetchError =
            error.message?.toLowerCase().includes('fetch') ||
            error.message?.toLowerCase().includes('failed to fetch') ||
            error.status === 0;

          if (!isFetchError) {
            return { data: null, profile: null, error };
          }
          console.warn('Supabase sign up fetch error, using demo auth fallback:', error);
        } else if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: fullName,
              role,
            });
          } catch (e) {
            console.warn('Profile creation trigger fallback:', e);
          }

          const fetchedProfile = await fetchProfile(data.user.id, data.user);
          setSession(data.session || { user: data.user });
          setProfile(fetchedProfile);
          return { data, profile: fetchedProfile, error: null };
        }
      } catch (err) {
        console.warn('Supabase sign up exception caught, falling back to demo mode:', err);
      }
    }

    // Fallback demo signup
    const demoUser = {
      id: `user-${Date.now()}`,
      email,
      user_metadata: { full_name: fullName, role },
    };
    const demoSession = { user: demoUser };
    const demoProfile = { id: demoUser.id, full_name: fullName, role };

    setDemoSession(demoSession);
    setSession(demoSession);
    setProfile(demoProfile);
    return { data: { user: demoUser, session: demoSession }, profile: demoProfile, error: null };
  };

  const signIn = async ({ email, password, role: requestedRole = null }) => {
    setSession(null);
    setProfile(null);

    let effectiveRole = requestedRole;
    if (!effectiveRole) {
      if (email.includes('doctor')) effectiveRole = 'doctor';
      else if (email.includes('admin')) effectiveRole = 'admin';
      else effectiveRole = 'patient';
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const isFetchError =
            error.message?.toLowerCase().includes('fetch') ||
            error.message?.toLowerCase().includes('failed to fetch') ||
            error.status === 0;

          if (!isFetchError) {
            return { data: null, profile: null, error };
          }
          console.warn('Supabase sign in fetch error, using demo auth fallback:', error);
        } else if (data?.session?.user) {
          let fetchedProfile = await fetchProfile(data.session.user.id, data.session.user);
          if (effectiveRole && fetchedProfile && fetchedProfile.role !== effectiveRole) {
            fetchedProfile.role = effectiveRole;
            try {
              await supabase.from('profiles').upsert({
                id: data.session.user.id,
                full_name: fetchedProfile.full_name,
                role: effectiveRole,
              });
            } catch (e) {
              console.warn('Profile role sync exception:', e);
            }
          }
          setSession(data.session);
          setProfile(fetchedProfile);
          return { data, profile: fetchedProfile, error: null };
        }
      } catch (err) {
        console.warn('Supabase sign in network exception caught, falling back to demo mode:', err);
      }
    }

    // Fallback demo login
    let role = effectiveRole || 'patient';
    let fullName = 'Demo Patient';
    let userId = 'demo-patient-1';

    if (role === 'doctor' || email.includes('doctor')) {
      role = 'doctor';
      fullName = 'Dr. Rohan Gupta';
      userId = 'demo-doctor-1';
    } else if (role === 'admin' || email.includes('admin')) {
      role = 'admin';
      fullName = 'Admin User';
      userId = 'demo-admin-1';
    } else if (email) {
      fullName = email.split('@')[0];
    }

    const demoUser = {
      id: userId,
      email,
      user_metadata: { full_name: fullName, role },
    };
    const demoSession = { user: demoUser };
    const demoProfile = { id: demoUser.id, full_name: fullName, role };

    setDemoSession(demoSession);
    setSession(demoSession);
    setProfile(demoProfile);
    return { data: { user: demoUser, session: demoSession }, profile: demoProfile, error: null };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore network error on signout
      }
    }
    setDemoSession(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role || null,
    isAuthenticated: !!session,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => (session?.user ? loadProfile(session.user.id, session.user) : null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
