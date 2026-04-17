"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { AuthContext } from "@/lib/supabase/auth";
import {
  createSupabaseBrowserClient,
  isSupabaseEnabled
} from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isSupabaseEnabled();
  const [loading, setLoading] = useState(enabled);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!error) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled]);

  async function signIn(email: string, password: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (error) {
      throw error;
    }
  }

  async function signOut() {
    if (!enabled) {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        enabled,
        loading,
        user,
        session,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
