import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    if (type === "promotional") {
      prompt = `Create a vibrant, professional sports promotional banner for a soccer match event called "FAMILIA BAB". 
      
Event details:
- Title: ${babaInfo.title}
- Date: ${babaInfo.date}
- Time: ${babaInfo.startTime} - ${babaInfo.endTime}
- Location: ${babaInfo.location}
- Price: R$ ${babaInfo.price}

Style: Modern sports design with green grass field background, dynamic energy, professional typography. Include soccer ball elements. The text "FAMILIA BAB" should be prominent. Use Brazilian Portuguese. Make it look like a WhatsApp shareable card with a 1:1 aspect ratio. Ultra high resolution.`;
    } else if (type === "bestPlayer") {
      prompt = `Create a sports "Player of the Match" celebration card for "FAMILIA BAB" soccer event.

Player: ${playerInfo.name}
Event: ${babaInfo.title}
Date: ${babaInfo.date}

Style: Golden/trophy theme, celebratory, professional sports design. Include star elements and a trophy icon. Text should say "CRAQUE DO BABA" (Best Player) prominently. Brazilian Portuguese. Make it shareable on WhatsApp with a 1:1 aspect ratio. Ultra high resolution.`;
    } else if (type === "teams") {
      prompt = `Create a sports team announcement card showing two teams for "FAMILIA BAB" soccer event.

Event: ${babaInfo.title}
Date: ${babaInfo.date}

Style: Split design showing "TIME A" vs "TIME B". Use contrasting colors (blue vs red). Professional sports design with soccer elements. Brazilian Portuguese. Make it shareable on WhatsApp with a 1:1 aspect ratio. Ultra high resolution.`;
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
