import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabaseClient, supabaseConfig } from './supabase';
import { fetchMyPermissions, loadDemoDb, saveDemoDb } from './api';
import type { PermissionKey, ProfileRow, StaffType, UserRole } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: ProfileRow | null;
  role: UserRole | null;
  staffTypes: StaffType[];
  permissions: PermissionKey[];
  isActiveUser: boolean;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string; redirectPath?: string }>;
  signInDemoRole: (role: UserRole) => Promise<{ ok: boolean; redirectPath: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateOwnProfile: (patch: { full_name?: string; phone?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string; simulated?: boolean }>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string; simulated?: boolean }>;
}

const DEMO_SESSION_KEY = 'hs_demo_user_id';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  staffTypes: [],
  permissions: [],
  isActiveUser: true,
  loading: false,
  isDemoMode: true,
  signIn: async () => ({ ok: false }),
  signInDemoRole: async () => ({ ok: true, redirectPath: '/' }),
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
  updateOwnProfile: async () => undefined,
  updatePassword: async () => ({ ok: true }),
  requestPasswordReset: async () => ({ ok: true }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [staffTypes, setStaffTypes] = useState<StaffType[]>([]);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isActiveUser, setIsActiveUser] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const isDemoMode = !supabaseConfig.isConfigured && !supabaseConfig.isProductionBuild;

  const hydrateUser = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setStaffTypes([]);
      setPermissions([]);
      setIsActiveUser(true);
      return;
    }

    setUser(authUser);
    const client = getSupabaseClient();
    if (client) {
      const [profRes, permsRes] = await Promise.all([
        client.from('profiles').select('*').eq('id', authUser.id).single(),
        fetchMyPermissions(authUser.id),
      ]);
      const prof = (profRes.data as ProfileRow | null) ?? null;
      setProfile(prof);
      setRole(permsRes.role ?? prof?.role ?? 'owner');
      setStaffTypes(permsRes.staff_types ?? []);
      setPermissions(permsRes.permissions ?? []);
      setIsActiveUser(permsRes.is_active);
      return;
    }

    if (!isDemoMode) {
      setUser(null);
      setProfile(null);
      setRole(null);
      setStaffTypes([]);
      setPermissions([]);
      setIsActiveUser(false);
      return;
    }
    const db = loadDemoDb();
    const prof = db.profiles.find((p) => p.id === authUser.id) ?? null;
    const permsRes = await fetchMyPermissions(authUser.id);
    setProfile(prof);
    setRole(permsRes.role ?? prof?.role ?? 'owner');
    setStaffTypes(permsRes.staff_types ?? []);
    setPermissions(permsRes.permissions ?? []);
    setIsActiveUser(permsRes.is_active);
  }, []);

  useEffect(() => {
    let active = true;
    const client = getSupabaseClient();

    if (client) {
      client.auth.getSession().then(async ({ data }) => {
        if (!active) return;
        const supaUser = data.session?.user;
        if (supaUser) {
          await hydrateUser({ id: supaUser.id, email: supaUser.email ?? '' });
        } else {
          await hydrateUser(null);
        }
        if (active) setLoading(false);
      });

      const { data: sub } = client.auth.onAuthStateChange(async (_evt, session) => {
        if (!active) return;
        const supaUser = session?.user;
        if (supaUser) {
          await hydrateUser({ id: supaUser.id, email: supaUser.email ?? '' });
        } else {
          await hydrateUser(null);
        }
      });

      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    if (!isDemoMode) {
      void hydrateUser(null).finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }

    // Local development demo session restore only
    const initDemo = async () => {
      try {
        const savedId = localStorage.getItem(DEMO_SESSION_KEY);
        if (savedId) {
          const db = loadDemoDb();
          const prof = db.profiles.find((p) => p.id === savedId);
          if (prof) {
            await hydrateUser({
              id: prof.id,
              email: db.user_emails[prof.id] ?? `${prof.id}@hellosadiqabad.com`,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    initDemo();
    return () => {
      active = false;
    };
  }, [hydrateUser]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string; redirectPath?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }

    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error || !data.user) {
        return { ok: false, error: error?.message ?? 'Invalid credentials.' };
      }
      await hydrateUser({ id: data.user.id, email: data.user.email ?? cleanEmail });
      const [perms, profRes] = await Promise.all([
        fetchMyPermissions(data.user.id),
        client.from('profiles').select('must_change_password').eq('id', data.user.id).single(),
      ]);
      if (!perms.is_active) {
        await client.auth.signOut();
        await hydrateUser(null);
        return { ok: false, error: 'Account is suspended. Contact Super Admin.' };
      }
      if ((profRes.data as { must_change_password?: boolean } | null)?.must_change_password) {
        return { ok: true, redirectPath: '/change-password' };
      }
      return {
        ok: true,
        redirectPath: perms.role === 'owner' ? '/owner' : '/admin',
      };
    }

    if (!isDemoMode) {
      return { ok: false, error: 'Supabase is not configured for this production deployment. Add the required Cloudflare environment variables.' };
    }

    // Local development demo login only
    const db = loadDemoDb();
    const matchedId = Object.entries(db.user_emails).find(
      ([, em]) => em.toLowerCase() === cleanEmail
    )?.[0];

    if (!matchedId || password.length < 6) {
      return {
        ok: false,
        error: 'No matching local demo account or password under 6 characters. Use Preview Access buttons or a locally created account.',
      };
    }

    if (db.user_active[matchedId] === false) {
      return { ok: false, error: 'Account is suspended. Contact Super Admin.' };
    }

    try {
      localStorage.setItem(DEMO_SESSION_KEY, matchedId);
    } catch {
      // ignore
    }
    await hydrateUser({ id: matchedId, email: cleanEmail });
    const prof = db.profiles.find((p) => p.id === matchedId);
    if (prof?.must_change_password) {
      return { ok: true, redirectPath: '/change-password' };
    }
    return {
      ok: true,
      redirectPath: prof?.role === 'owner' ? '/owner' : '/admin',
    };
  };

  const signInDemoRole = async (
    targetRole: UserRole
  ): Promise<{ ok: boolean; redirectPath: string }> => {
    if (!isDemoMode) {
      return { ok: false, redirectPath: '/login' };
    }
    if (!isDemoMode) return { ok: false, redirectPath: '/login' };
    const db = loadDemoDb();
    const prof =
      db.profiles.find((p) => p.role === targetRole) ??
      db.profiles[0];
    const email = db.user_emails[prof.id] ?? `${targetRole}@hellosadiqabad.com`;
    try {
      localStorage.setItem(DEMO_SESSION_KEY, prof.id);
    } catch {
      // ignore
    }
    await hydrateUser({ id: prof.id, email });
    return {
      ok: true,
      redirectPath: prof.role === 'owner' ? '/owner' : '/admin',
    };
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    try {
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // ignore
    }
    await hydrateUser(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await hydrateUser(user);
    }
  };

  const updateOwnProfile = async (patch: { full_name?: string; phone?: string }) => {
    if (!user) return;
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      return;
    }

    if (!isDemoMode) throw new Error('Supabase is not configured for this production deployment.');
    const db = loadDemoDb();
    const prof = db.profiles.find((p) => p.id === user.id);
    if (prof) {
      if (patch.full_name !== undefined) prof.full_name = patch.full_name;
      if (patch.phone !== undefined) prof.phone = patch.phone;
      prof.updated_at = new Date().toISOString();
      saveDemoDb(db);
      await refreshProfile();
    }
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ ok: boolean; error?: string; simulated?: boolean }> => {
    if (newPassword.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters.' };
    }
    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) return { ok: false, error: error.message };
      if (user) {
        await client
          .from('profiles')
          .update({ must_change_password: false, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
      await refreshProfile();
      return { ok: true, simulated: false };
    }

    if (!isDemoMode) return { ok: false, error: 'Supabase is not configured for this production deployment.' };
    if (user) {
      const db = loadDemoDb();
      const prof = db.profiles.find((p) => p.id === user.id);
      if (prof) {
        prof.must_change_password = false;
        prof.updated_at = new Date().toISOString();
        saveDemoDb(db);
        await refreshProfile();
      }
    }
    return isDemoMode ? { ok: true, simulated: true } : { ok: false, error: 'Supabase is not configured for this production deployment.' };
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ ok: boolean; error?: string; simulated?: boolean }> => {
    if (!email.trim()) return { ok: false, error: 'Enter your registered email address.' };
    const client = getSupabaseClient();
    if (client) {
      const origin =
        typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? window.location.origin
          : supabaseConfig.siteUrl || window.location.origin;
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin.replace(/\/+$/, '')}/reset-password`,
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, simulated: false };
    }
    return isDemoMode ? { ok: true, simulated: true } : { ok: false, error: 'Supabase is not configured for this production deployment.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        staffTypes,
        permissions,
        isActiveUser,
        loading,
        isDemoMode,
        signIn,
        signInDemoRole,
        signOut,
        refreshProfile,
        updateOwnProfile,
        updatePassword,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
