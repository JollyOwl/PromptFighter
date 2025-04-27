
import { supabase } from './supabase';
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  username: string;
  avatar_id: number;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Récupérer les informations du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
      
    if (!profile) {
      console.log("Profil non trouvé pour l'utilisateur:", user.id);
      // Renvoyer quand même un utilisateur avec des informations de base
      return {
        id: user.id,
        email: user.email!,
        username: user.email?.split('@')[0] || 'utilisateur',
        avatar_url: undefined
      };
    }
    
    return {
      id: user.id,
      email: user.email!,
      username: profile.username,
      avatar_url: profile.avatar_url || undefined
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

export async function signUp({ email, password, username, avatar_id }: SignUpCredentials) {
  try {
    console.log("Tentative d'inscription:", { email, username });
    
    // Créer un nouvel utilisateur avec Supabase Auth
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });
    
    if (signUpError || !user) {
      console.error("Erreur d'inscription:", signUpError);
      throw signUpError || new Error("Échec de l'inscription");
    }
    
    // Pour la démo, nous utilisons une image de placeholder
    const avatar_url = "/placeholder.svg";
    
    // Créer un profil pour l'utilisateur
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (profileError) {
      console.error("Erreur lors de la création du profil:", profileError);
      throw profileError;
    }
    
    toast.success("Inscription réussie !");
    return { user, profile: { username, avatar_url } };
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error);
    toast.error(error.message || "Échec de l'inscription");
    throw error;
  }
}

export async function signIn({ email, password }: SignInCredentials) {
  try {
    console.log("Tentative de connexion:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      console.error("Erreur de connexion:", error);
      throw error || new Error("Échec de la connexion");
    }
    
    toast.success("Connexion réussie !");
    return data.user;
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    toast.error(error.message || "Échec de la connexion");
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
    
    toast.success("Déconnexion réussie !");
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    toast.error(error.message || "Échec de la déconnexion");
    throw error;
  }
}
