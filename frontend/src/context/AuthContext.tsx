import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isLoading: boolean;
  needsUsername: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    // Fail-safe to ensure the app doesn't stay stuck if the session check hangs
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    const handleUserUpdate = async (session: any) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: profile.username,
            });
            setNeedsUsername(false);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: '',
            });
            setNeedsUsername(true);
          }
        } catch (err) {
          // If profile fetch fails, assume it doesn't exist yet
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: '',
          });
          setNeedsUsername(true);
        }
      } else {
        setUser(null);
        setNeedsUsername(false);
      }
      setIsLoading(false);
    };

    // Non-blocking initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserUpdate(session);
    }).catch(() => {
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserUpdate(session);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: profile.username,
        });
        setNeedsUsername(false);
      }
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading, needsUsername, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
