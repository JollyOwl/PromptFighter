
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Fix the AuthUser type to correctly extend User type
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
  user_metadata?: {
    username?: string;
    avatar_url?: string;
    [key: string]: any;
  };
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

export interface UpdateProfileData {
  username: string;
  avatar_url?: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Récupérer les informations du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, created_at')
      .eq('id', user.id)
      .maybeSingle();
      
    if (!profile) {
      console.log("Profil non trouvé pour l'utilisateur:", user.id);
      // Renvoyer quand même un utilisateur avec des informations de base
      return {
        id: user.id,
        email: user.email!,
        username: user.email?.split('@')[0] || 'utilisateur',
        avatar_url: undefined,
        created_at: user.created_at,
        user_metadata: user.user_metadata
      };
    }
    
    return {
      id: user.id,
      email: user.email!,
      username: profile.username || user.email?.split('@')[0] || 'utilisateur',
      avatar_url: profile.avatar_url || undefined,
      created_at: profile.created_at || user.created_at,
      user_metadata: user.user_metadata
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
    // Vérifie si le profil existe déjà (par précaution, pour éviter l'erreur 409 si déjà présent)
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur lors de la vérification du profil:", fetchError);
      throw fetchError;
    }

    if (!existingProfile) {
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
    }

    
    toast.success("Inscription réussie !");
    return { user, profile: { username, avatar_url } };
  } catch (error: unknown) {
    console.error("Erreur lors de l'inscription:", error);
    toast.error(error instanceof Error ? error.message : "Échec de l'inscription");
    throw error;
  }
}

export async function signIn({ email, password }: SignInCredentials) {
  try {
    console.log("Tentative de connexion:", email);
    
    // First try to sign in with email
    let signInResult = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If email login fails, try with username by looking up the email
    if (signInResult.error && !email.includes('@')) {
      console.log("Trying username login for:", email);
      
      // Look up user by username to get their email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .single();
      
      if (profileError) {
        console.error("Username lookup failed:", profileError);
        throw new Error("Nom d'utilisateur ou mot de passe incorrect");
      }
      
      if (profile) {
        // Get the user's email from the profiles table by looking up auth user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        // We need to use a different approach - get all profiles and match
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', email);
          
        if (allProfilesError || !allProfiles || allProfiles.length === 0) {
          throw new Error("Nom d'utilisateur introuvable");
        }
        
        // For username login, we need to get the email from auth.users
        // Since we can't access auth.users directly, we'll need the user to use email
        throw new Error("Veuillez utiliser votre adresse email pour vous connecter");
      }
    }
    
    if (signInResult.error || !signInResult.data.user) {
      console.error("Erreur de connexion:", signInResult.error);
      throw signInResult.error || new Error("Échec de la connexion");
    }
    
    toast.success("Connexion réussie !");
    return signInResult.data.user;
  } catch (error: unknown) {
    console.error("Erreur lors de la connexion:", error);
    toast.error(error instanceof Error ? error.message : "Échec de la connexion");
    throw error;
  }
}

export async function updateProfile({ username, avatar_url }: UpdateProfileData): Promise<AuthUser> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    // Check if username is already taken by another user
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Erreur lors de la vérification du nom d'utilisateur:", checkError);
      throw checkError;
    }

    if (existingProfile) {
      throw new Error("Ce nom d'utilisateur est déjà pris");
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        username,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur lors de la mise à jour du profil:", updateError);
      throw updateError;
    }

    toast.success("Profil mis à jour avec succès !");

    // Return the updated user data
    return {
      id: user.id,
      email: user.email!,
      username: updatedProfile.username,
      avatar_url: updatedProfile.avatar_url,
      created_at: updatedProfile.created_at,
      user_metadata: user.user_metadata
    };
  } catch (error: unknown) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    toast.error(error instanceof Error ? error.message : "Échec de la mise à jour du profil");
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
  } catch (error: unknown) {
    console.error("Erreur lors de la déconnexion:", error);
    toast.error(error instanceof Error ? error.message : "Échec de la connexion");
    throw error;
  }
}
