
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock image generation function
// In production, this would call an AI image generation service
async function generateImage(prompt: string): Promise<string> {
  // For demo purposes, return a placeholder image
  // In a real app, you would call DALL-E or another image generation API
  const placeholderImages = [
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
    'https://images.unsplash.com/photo-1533738363-b7f9aef128ce', 
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634',
    'https://images.unsplash.com/photo-1520288992255-dfb30894896b',
    'https://images.unsplash.com/photo-1518791841217-8f162f1e1131'
  ];
  
  // Select a random image from the array
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate image URL
    const imageUrl = await generateImage(prompt);
    
    return new Response(
      JSON.stringify({ 
        imageUrl,
        prompt,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
