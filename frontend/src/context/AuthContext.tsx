import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Fail-safe: force loading to false after 3 seconds for a snappier feel
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('AuthContext: Initialization timeout. Proceeding...');
        setIsLoading(false);
      }
    }, 3000);

    const handleUserUpdate = async (session: any) => {
      if (session?.user) {
        console.log('AuthContext: Setting user:', session.user.id);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          if (profileError) console.error('AuthContext: Profile error:', profileError);

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: profile?.username || session.user.email?.split('@')[0] || 'User',
          });
        } catch (err) {
          console.error('AuthContext: Failed to fetch profile:', err);
          // Set user anyway with default username
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || 'User',
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    // Check active sessions - Non-blocking
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: getSession resolved:', session ? 'User found' : 'No user');
      handleUserUpdate(session);
    }).catch(err => {
      console.error('AuthContext: getSession rejected:', err);
      setIsLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth event:', event);
      handleUserUpdate(session);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, logout, isLoading }}>
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
