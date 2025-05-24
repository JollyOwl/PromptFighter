
import { useEffect, useState } from 'react';
import { AuthUser, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    // Listen for manual auth updates (when profile is updated)
    const handleAuthUpdate = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener('authUserUpdated', handleAuthUpdate as EventListener);

    // S'abonner aux changements d'auth d'abord
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change:", event);
        setSession(currentSession);
        
        // Utiliser setTimeout pour éviter les deadlocks potentiels
        if (currentSession?.user) {
          setTimeout(() => {
            getCurrentUser().then(authUser => {
              if (authUser) setUser(authUser);
              else setUser(null);
            });
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Ensuite vérifier la session existante
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      
      if (data.session?.user) {
        getCurrentUser().then(authUser => {
          if (authUser) setUser(authUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('authUserUpdated', handleAuthUpdate as EventListener);
    };
  }, []);

  return { user, session, loading, refreshUser };
}
