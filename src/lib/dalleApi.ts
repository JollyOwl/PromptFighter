
import { supabase } from './supabase';

export interface DalleRequest {
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
}

export interface DalleResponse {
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
  prompt: string;
  timestamp: string;
}

export async function generateImageWithSupabaseFunction(prompt: string): Promise<string> {
  try {
    console.log(`Sending prompt to generate image: "${prompt}"`);
    
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt }
    });

    if (error) {
      console.error("Supabase function error:", error);
      throw new Error(error.message || "Erreur lors de la génération d'image");
    }

    if (!data) {
      console.error("No data returned from function");
      throw new Error("Aucune donnée retournée par la fonction");
    }

    console.log("Function response:", data);
    
    // Check if response has the expected structure
    if (!data.data || !Array.isArray(data.data) || data.data.length === 0 || !data.data[0]?.url) {
      console.error("Unexpected response format:", data);
      throw new Error("Format de réponse inattendu");
    }

    const imageUrl = data.data[0].url;
    return imageUrl;
  } catch (error) {
    console.error("Error in generateImageWithSupabaseFunction:", error);
    throw error;
  }
}

// Helper function to handle image generation errors
export async function safeGenerateImage(prompt: string): Promise<string | null> {
  try {
    return await generateImageWithSupabaseFunction(prompt);
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
}
