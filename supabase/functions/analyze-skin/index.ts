import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64, mimeType } = await req.json();
  
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      },
      `Analyze this facial skin photo. Return ONLY valid JSON, no extra text:
      {
        "skin_type": "dry or oily or combination or normal or sensitive",
        "concerns": {
          "acne": 0.0,
          "dryness": 0.0,
          "wrinkles": 0.0,
          "pigmentation": 0.0,
          "pores": 0.0
        }
      }
      All concern values must be floats between 0.0 and 1.0.`
    ]);

    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});