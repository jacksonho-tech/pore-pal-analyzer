const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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

      model: "qwen/qwen2.5-vl-32b-instruct:free",

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

    throw new Error(`OpenRouter error: ${rawText}`);

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
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

});