import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Include modern Supabase client headers to avoid CORS preflight failures in browsers
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, babaInfo, playerInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating banner:", type, babaInfo);

    let prompt = "";
    
    // Brand colors: Orange (#F97316), Gold (#EAB308), Dark green (#166534), Black background
    const brandStyle = `
BRAND IDENTITY - CRITICAL:
- Brand name is "FAMILIA BABA" (NOT "BAB", always write BABA with final A)
- Primary colors: Vibrant orange (#F97316), golden yellow (#EAB308)
- Secondary: Dark green (#166534) for accents, black/dark backgrounds
- Style: Bold, energetic, modern sports aesthetic
- Typography: Bold, impactful fonts with orange/gold gradient or solid orange text
- Include a stylized soccer ball element
`;

    if (type === "promotional") {
      prompt = `Create a professional sports promotional banner for a Brazilian amateur soccer event.

${brandStyle}

EVENT DETAILS (display in Portuguese):
- Event title: ${babaInfo.title}
- Date: ${babaInfo.date}
- Time: ${babaInfo.startTime} às ${babaInfo.endTime}
- Location: ${babaInfo.location}
- Price: R$ ${babaInfo.price}

DESIGN REQUIREMENTS:
- Header: "FAMILIA BABA" in large, bold orange/gold text with glow effect
- Background: Soccer stadium or green grass field with dramatic lighting
- Layout: Clean, organized with event info clearly readable
- Add "Compartilhe!" text with WhatsApp icon
- 1:1 square aspect ratio for WhatsApp sharing
- Ultra high resolution, professional quality`;
    } else if (type === "bestPlayer") {
      prompt = `Create a "Best Player" celebration card for a Brazilian amateur soccer event.

${brandStyle}

CONTENT:
- Header: "FAMILIA BABA" in orange/gold at top
- Main text: "CRAQUE DO BABA" (Best Player award)
- Player name: ${playerInfo.name} (display prominently)
- Event: ${babaInfo.title}
- Date: ${babaInfo.date}

DESIGN REQUIREMENTS:
- Golden/trophy theme with stars and celebratory elements
- Trophy or medal icon
- Dramatic lighting, premium feel
- Orange and gold color scheme matching brand
- 1:1 square aspect ratio
- Ultra high resolution`;
    } else if (type === "teams") {
      prompt = `Create a team announcement card for a Brazilian amateur soccer event.

${brandStyle}

CONTENT:
- Header: "FAMILIA BABA" in orange/gold
- Event: ${babaInfo.title}
- Date: ${babaInfo.date}
- Show "TIMES SORTEADOS" (Drawn Teams)

DESIGN REQUIREMENTS:
- Split design for multiple teams (TIME A vs TIME B, etc.)
- Use orange and dark green as contrasting team colors
- Soccer field or stadium background
- Professional sports broadcast style
- 1:1 square aspect ratio
- Ultra high resolution`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          { role: "user", content: prompt }
        ],
        modalities: ["image", "text"]
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
    console.log("Image generation response received");
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-banner function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
