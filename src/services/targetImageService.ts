
import { supabase } from "@/lib/supabase";
import { Difficulty, TargetImage } from "@/types/game";
import { toast } from "sonner";

// Get random target image from the database
export const getRandomTargetImage = async (difficulty: Difficulty): Promise<TargetImage | null> => {
  try {
    console.log(`Fetching random target image with difficulty: ${difficulty}`);
    
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('target_images')
        .select('*')
        .eq('difficulty', difficulty);
      if (error) throw error;
      return data;
    };

    let data = await fetchImages();

    if (!data || data.length === 0) {
      console.log('No target images found, initializing database...');
      await initializeTargetImages();
      data = await fetchImages();
    }

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      console.log('Fetched target image:', data[randomIndex]);
      return data[randomIndex] as TargetImage;
    }

    return null;
  } catch (error) {
    console.error('Error fetching target image:', error);
    toast.error('Failed to fetch target image');
    return null;
  }
};

// Initialize target images in the database
export const initializeTargetImages = async () => {
  try {
    // Check if we already have target images
    const { data: existingImages, error: checkError } = await supabase
      .from('target_images')
      .select('id')
      .limit(1);

    if (checkError) throw checkError;

    // If we already have images, don't add more
    if (existingImages && existingImages.length > 0) {
      console.log('Target images already exist in database');
      return;
    }

    // Sample target images for each difficulty
    const targetImages = [
      {
        name: 'Easy Landscape',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        difficulty: 'easy',
        category: 'landscape'
      },
      {
        name: 'Easy Portrait',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        difficulty: 'easy',
        category: 'portrait'
      },
      {
        name: 'Medium Abstract',
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        difficulty: 'medium',
        category: 'abstract'
      },
      {
        name: 'Medium Still Life',
        url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634',
        difficulty: 'medium',
        category: 'still-life'
      },
      {
        name: 'Hard Fantasy',
        url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
        difficulty: 'hard',
        category: 'fantasy'
      },
      {
        name: 'Hard Sci-Fi',
        url: 'https://images.unsplash.com/photo-1520288992255-dfb30894896b',
        difficulty: 'hard',
        category: 'sci-fi'
      }
    ];

    // Insert the target images
    const { error: insertError } = await supabase
      .from('target_images')
      .insert(targetImages);

    if (insertError) throw insertError;

    console.log('Successfully initialized target images');
  } catch (error) {
    console.error('Error initializing target images:', error);
  }
};
