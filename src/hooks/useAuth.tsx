
import { useEffect, useState } from 'react';
import { AuthUser, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'utilisateur courant
    getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // S'abonner aux changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const user = await getCurrentUser();
        setUser(user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
