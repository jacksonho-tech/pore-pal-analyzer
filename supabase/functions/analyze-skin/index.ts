const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const fallbackAnalysis = {
  skin_type: "normal",
  concerns: {
    acne: 0.2,
    dryness: 0.3,
    wrinkles: 0.2,
    pigmentation: 0.2,
    pores: 0.35
  },
  fallback: true
};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  console.log("Request received");
  console.log("OpenRouter key exists:", !!Deno.env.get("OPENROUTER_API_KEY"));

  try {

  const { imageBase64, mimeType } = await req.json();

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");

  console.log("API key length:", apiKey?.length);

  const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {

    method: "POST",

    headers: {

      "Authorization": `Bearer ${apiKey}`,

      "HTTP-Referer": "https://radiantskinai.lovable.app",

      "X-Title": "Radiant Skin AI",

      "Content-Type": "application/json"

    },

    body: JSON.stringify({

      model: "openrouter/auto",

      messages: [{

        role: "user",

        content: [

          {

            type: "image_url",

            image_url: { 

              url: `data:${mimeType};base64,${imageBase64}` 

            }

          },

          {

            type: "text",

            text: "Analyze this facial skin photo. Return ONLY valid JSON: {\"skin_type\":\"dry|oily|combination|normal|sensitive\",\"concerns\":{\"acne\":0.0,\"dryness\":0.0,\"wrinkles\":0.0,\"pigmentation\":0.0,\"pores\":0.0}}"

          }

        ]

      }]

    })

  });

  console.log("OpenRouter status:", openRouterResponse.status);

  const rawText = await openRouterResponse.text();

  console.log("OpenRouter response:", rawText);

  if (!openRouterResponse.ok) {

    console.error(`OpenRouter error: ${rawText}`);

    return new Response(JSON.stringify(fallbackAnalysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  }

  const data = JSON.parse(rawText);

  const text = data.choices[0].message.content.trim();

  const clean = text.replace(/```json|```/g, "").trim();

  const analysis = JSON.parse(clean);

  return new Response(JSON.stringify(analysis), {

    headers: { 

      ...corsHeaders,

      "Content-Type": "application/json"

    }

  });

  } catch (error) {
    console.error("analyze-skin error", error);
    return new Response(JSON.stringify(fallbackAnalysis), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

});