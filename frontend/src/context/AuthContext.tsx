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
    
    // Fail-safe: force loading to false after 5 seconds
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('AuthContext: Initialization timed out after 5s. Forcing isLoading to false.');
        setIsLoading(false);
      }
    }, 5000);

    // Check active sessions and sets the user
    const getSession = async () => {
      try {
        console.log('AuthContext: Calling getSession...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: getSession error:', sessionError);
        }

        console.log('AuthContext: Session response received:', session ? 'User logged in' : 'No session');
        
        if (session?.user) {
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('AuthContext: Profile fetch error:', profileError);
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: profile?.username || session.user.email?.split('@')[0] || 'User',
          });
        }
      } catch (error) {
        console.error('AuthContext: Fatal error during getSession:', error);
      } finally {
        console.log('AuthContext: getSession finished, clearing loader.');
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed:', event);
      try {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: profile?.username || session.user.email?.split('@')[0] || 'User',
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('AuthContext: Error in onAuthStateChange:', error);
      } finally {
        setIsLoading(false);
      }
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
