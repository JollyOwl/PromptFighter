
// Fonction pour générer une image à partir d'un prompt
import { supabase } from './supabase';

export interface DalleRequest {
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
}

export interface DalleResponse {
  url: string;
}

// Fonction pour générer une image avec DALL-E
export async function generateImage(request: DalleRequest): Promise<string> {
  try {
    console.log("Génération d'image avec prompt:", request.prompt);
    
    // En production avec la fonction edge déployée:
    // const { data, error } = await supabase.functions.invoke('generate-image', {
    //   body: request
    // });
    
    // if (error) throw error;
    // return data.url;
    
    // Pour le moment, on retourne juste l'image placeholder pour la démonstration
    // Dans une implémentation réelle, on appellerait l'API DALL-E via la fonction edge Supabase
    return "/placeholder.svg";
  } catch (error) {
    console.error("Erreur lors de la génération d'image:", error);
    throw error;
  }
}
