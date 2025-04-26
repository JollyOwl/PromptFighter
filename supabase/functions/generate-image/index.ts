
// Nom du fichier: supabase/functions/generate-image/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DalleRequest {
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024";
}

interface DalleResponse {
  created: number;
  data: {
    url: string;
  }[];
}

serve(async (req) => {
  // Gérer les requêtes préliminaires CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { prompt, n = 1, size = "512x512" } = await req.json() as DalleRequest;
    
    // Vérifier que le prompt est fourni
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Le prompt est requis" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Récupérer la clé API depuis les variables d'environnement
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Configuration incorrecte: clé API manquante" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Appeler l'API DALL-E de OpenAI
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        n,
        size,
      }),
    });
    
    const data = await response.json();
    
    // Gérer les erreurs de l'API
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error || "Erreur lors de la génération d'image" }),
        { 
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Retourner l'URL de l'image générée
    return new Response(
      JSON.stringify({ url: data.data[0].url }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
