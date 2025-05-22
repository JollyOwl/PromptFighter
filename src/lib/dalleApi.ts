import { supabase } from './supabase';

export interface DalleRequest {
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
}

export async function generateImageWithSupabaseFunction(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: { prompt }
  });

  if (error) {
    throw new Error(error.message || "Erreur lors de la génération d'image");
  }

  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) {
    console.error("Réponse inattendue :", data);
    throw new Error("Aucune image générée");
  }

  return imageUrl;
}
