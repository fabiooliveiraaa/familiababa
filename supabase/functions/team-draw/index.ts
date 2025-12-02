import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { babaId, playerData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating team draw for baba:", babaId);
    console.log("Player data:", JSON.stringify(playerData));

    const prompt = `Você é um especialista em organizar times de futebol equilibrados.

Dados dos jogadores confirmados:
${JSON.stringify(playerData, null, 2)}

IMPORTANTE:
- Divida os jogadores em 2 times equilibrados (Time A e Time B)
- Considere a média de avaliação (rating) de cada jogador para equilibrar os times
- Se houver goleiros, distribua 1 para cada time (se possível)
- Maximize o equilíbrio entre as somas das médias de rating de cada time
- Jogadores sem rating devem ser considerados como tendo rating 3.0 (médio)

Responda APENAS com um JSON válido no seguinte formato:
{
  "timeA": {
    "nome": "Time A",
    "jogadores": [{"id": "...", "nome": "...", "posicao": "linha|goleiro", "rating": 0.0}],
    "mediaRating": 0.0
  },
  "timeB": {
    "nome": "Time B", 
    "jogadores": [{"id": "...", "nome": "...", "posicao": "linha|goleiro", "rating": 0.0}],
    "mediaRating": 0.0
  },
  "analise": "Breve análise do equilíbrio dos times"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente que organiza times de futebol equilibrados. Sempre responda apenas com JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response:", content);

    // Extract JSON from response
    let result;
    try {
      // Try to parse directly
      result = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in team-draw function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
