Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
      }
    });
  }

  console.log("Request received");
  console.log("OpenRouter key exists:", !!Deno.env.get("OPENROUTER_API_KEY"));

  const { imageBase64, mimeType } = await req.json();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {

    method: "POST",

    headers: {

      "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,

      "Content-Type": "application/json"

    },

    body: JSON.stringify({

      model: "meta-llama/llama-3.2-11b-vision-instruct:free",

      messages: [{

        role: "user",

        content: [

          {

            type: "image_url",

            image_url: { url: `data:${mimeType};base64,${imageBase64}` }

          },

          {

            type: "text",

            text: "Analyze this facial skin photo. Return ONLY valid JSON, no markdown, no explanation: {\"skin_type\":\"dry|oily|combination|normal|sensitive\",\"concerns\":{\"acne\":0.0,\"dryness\":0.0,\"wrinkles\":0.0,\"pigmentation\":0.0,\"pores\":0.0}} All values must be floats between 0.0 and 1.0."

          }

        ]

      }]

    })

  });

  const data = await response.json();

  const text = data.choices[0].message.content.trim();

  const clean = text.replace(/```json|```/g, "").trim();

  const analysis = JSON.parse(clean);

  return new Response(JSON.stringify(analysis), {

    headers: { 

      "Content-Type": "application/json",

      "Access-Control-Allow-Origin": "*"

    }

  });

});