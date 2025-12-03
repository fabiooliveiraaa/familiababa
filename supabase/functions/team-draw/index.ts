import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrawConfig {
  numberOfTeams: number;
  playersPerTeam: number | 'auto';
  includeGoalkeepers: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { babaId, playerData, config } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Config padrão para retrocompatibilidade
    const drawConfig: DrawConfig = config || {
      numberOfTeams: 2,
      playersPerTeam: 'auto',
      includeGoalkeepers: true,
    };

    console.log("Generating team draw for baba:", babaId);
    console.log("Player data:", JSON.stringify(playerData));
    console.log("Config:", JSON.stringify(drawConfig));

    const playersPerTeamText = drawConfig.playersPerTeam === 'auto' 
      ? 'divididos igualmente entre os times'
      : `${drawConfig.playersPerTeam} jogadores por time`;

    const goalkeeperText = drawConfig.includeGoalkeepers
      ? 'Distribua os goleiros entre os times de forma equilibrada (se possível, 1 por time)'
      : 'NÃO há goleiros na lista - todos são jogadores de linha';

    // Gerar nomes dos times dinamicamente
    const teamNames = Array.from({ length: drawConfig.numberOfTeams }, (_, i) => {
      const letters = ['A', 'B', 'C', 'D', 'E'];
      return `Time ${letters[i] || i + 1}`;
    });

    const prompt = `Você é um especialista em organizar times de futebol equilibrados.

Dados dos jogadores para sortear:
${JSON.stringify(playerData, null, 2)}

CONFIGURAÇÃO DO SORTEIO:
- Quantidade de times: ${drawConfig.numberOfTeams}
- Jogadores por time: ${playersPerTeamText}
- ${goalkeeperText}

REGRAS IMPORTANTES:
1. Divida os jogadores em EXATAMENTE ${drawConfig.numberOfTeams} times equilibrados
2. Nomes dos times: ${teamNames.join(', ')}
3. Considere a média de rating de cada jogador para equilibrar os times
4. Maximize o equilíbrio entre as somas das médias de rating de cada time
5. Jogadores sem rating devem ser considerados como tendo rating 3.0 (médio)
6. Se sobrar jogadores que não cabem nos times (quando playersPerTeam é fixo), liste-os em "jogadoresRestantes"

Responda APENAS com um JSON válido no seguinte formato:
{
  "times": [
    {
      "nome": "Time A",
      "jogadores": [{"id": "...", "nome": "...", "posicao": "linha|goleiro", "rating": 0.0}],
      "mediaRating": 0.0
    },
    {
      "nome": "Time B",
      "jogadores": [{"id": "...", "nome": "...", "posicao": "linha|goleiro", "rating": 0.0}],
      "mediaRating": 0.0
    }
    // ... mais times conforme configurado
  ],
  "jogadoresRestantes": [{"id": "...", "nome": "...", "posicao": "...", "rating": 0.0}],
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
          { role: "system", content: "Você é um assistente que organiza times de futebol equilibrados. Sempre responda apenas com JSON válido, sem markdown ou texto adicional." },
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
        // Try to find JSON object in the response
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          result = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
      }
    }

    // Garantir que jogadoresRestantes exista
    if (!result.jogadoresRestantes) {
      result.jogadoresRestantes = [];
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
