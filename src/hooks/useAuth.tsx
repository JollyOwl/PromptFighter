
import { useEffect, useState } from 'react';
import { AuthUser, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    };
  }, []);

  return { user, session, loading };
}
