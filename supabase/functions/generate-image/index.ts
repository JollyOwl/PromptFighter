
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!body || !body.prompt) {
    return new Response(
      JSON.stringify({ error: "Prompt requis dans le body JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const prompt = body.prompt;

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Clé API OpenAI manquante" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log(`Generating image with prompt: "${prompt}"`);
    
    const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024"
      }),
    });

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ 
          error: errorData.error?.message || "Erreur OpenAI", 
          status: openaiRes.status 
        }),
        { status: openaiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await openaiRes.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected OpenAI response format:", data);
      return new Response(
        JSON.stringify({ error: "Format de réponse OpenAI inattendu" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamp = new Date().toISOString();
    return new Response(
      JSON.stringify({ 
        data: data.data,
        prompt,
        timestamp
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
