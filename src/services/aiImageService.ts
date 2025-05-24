
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Generate AI image based on prompt
export const generateAIImage = async (prompt: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt }
    });
    
    if (error) throw error;
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    toast.error('Failed to generate image');
    return null;
  }
};
