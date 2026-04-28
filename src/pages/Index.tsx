import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, Droplets, ImageUp, Loader2, ScanFace, ShoppingBag, Sparkles, Sun, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type SkinType = "Oily" | "Dry" | "Combination" | "Sensitive" | "Mature" | "Balanced";
type Concern = "acne" | "dryness" | "wrinkles" | "pores" | "pigmentation" | "redness" | "dullness";

type Product = {
  no: number;
  sku: string;
  name: string;
  category: string;
  target: string;
  concerns: string;
  ingredients: string;
  price: string;
};

type AiSkinAnalysis = {
  skin_type: "dry" | "oily" | "combination" | "normal" | "sensitive";
  concerns: {
    acne: number;
    dryness: number;
    wrinkles: number;
    pigmentation: number;
    pores: number;
  };
};

const products: Product[] = [
  { no: 1, sku: "CLN-001", name: "Gentle Foaming Cleanser", category: "Cleanser", target: "All / Sensitive", concerns: "Dirt, excess oil, makeup removal", ingredients: "Centella, Ceramides", price: "$18" },
  { no: 2, sku: "CLN-002", name: "Salicylic Acid Deep Cleansing Gel", category: "Cleanser", target: "Oily / Acne-prone", concerns: "Acne, blackheads, enlarged pores", ingredients: "2% Salicylic Acid", price: "$22" },
  { no: 3, sku: "TON-001", name: "Hydrating Rose Toner", category: "Toner", target: "Dry / Dehydrated", concerns: "Dryness, tightness", ingredients: "Rose Water, Hyaluronic Acid", price: "$16" },
  { no: 4, sku: "SER-001", name: "Niacinamide 10% Brightening Serum", category: "Serum", target: "Oily / Combination", concerns: "Oil control, pores, dark spots", ingredients: "10% Niacinamide", price: "$25" },
  { no: 5, sku: "SER-002", name: "Hyaluronic Acid Multi-Weight Serum", category: "Serum", target: "Dry / All", concerns: "Dehydration, fine lines", ingredients: "Multi-molecular HA", price: "$24" },
  { no: 6, sku: "SER-003", name: "Vitamin C 15% Glow Serum", category: "Serum", target: "Dull / Pigmented", concerns: "Dullness, dark spots, uneven tone", ingredients: "15% L-Ascorbic Acid + Vitamin E", price: "$28" },
  { no: 7, sku: "SER-004", name: "Retinol 0.3% Renewal Serum", category: "Serum", target: "Mature / Normal", concerns: "Fine lines, wrinkles, texture", ingredients: "0.3% Retinol (encapsulated)", price: "$32" },
  { no: 8, sku: "MOIST-001", name: "Lightweight Gel Moisturizer", category: "Moisturizer", target: "Oily / Combination", concerns: "Shine, hydration without grease", ingredients: "Niacinamide, HA", price: "$20" },
  { no: 9, sku: "MOIST-002", name: "Rich Barrier Repair Cream", category: "Moisturizer", target: "Dry / Sensitive", concerns: "Dryness, barrier damage, flakiness", ingredients: "Ceramides, Shea Butter", price: "$26" },
  { no: 10, sku: "MOIST-003", name: "Night Repair Cream with Peptides", category: "Night Cream", target: "Mature", concerns: "Wrinkles, loss of firmness", ingredients: "Peptides, Retinal", price: "$35" },
  { no: 11, sku: "EXF-001", name: "Gentle AHA/BHA Exfoliating Toner", category: "Exfoliator", target: "All (start slow)", concerns: "Texture, dullness, mild acne", ingredients: "5% Lactic + 1% Salicylic", price: "$19" },
  { no: 12, sku: "MSK-001", name: "Clay Purifying Mask", category: "Mask", target: "Oily / Acne-prone", concerns: "Excess oil, impurities, pores", ingredients: "Kaolin Clay, Tea Tree", price: "$15" },
  { no: 13, sku: "MSK-002", name: "Hydrating Sheet Mask (5-pack)", category: "Mask", target: "Dry / Dehydrated", concerns: "Instant hydration, soothing", ingredients: "Hyaluronic Acid, Aloe", price: "$12" },
  { no: 14, sku: "EYE-001", name: "Caffeine Depuffing Eye Cream", category: "Eye Care", target: "All", concerns: "Puffiness, dark circles", ingredients: "Caffeine, Peptides", price: "$23" },
  { no: 15, sku: "SUN-001", name: "Broad Spectrum SPF 50 Sunscreen", category: "Sunscreen", target: "All", concerns: "UV damage, photoaging", ingredients: "Mineral (Zinc Oxide)", price: "$24" },
  { no: 16, sku: "SUN-002", name: "Tinted Mineral SPF 50", category: "Sunscreen", target: "Combination / Oily", concerns: "UV + light coverage", ingredients: "Zinc + Iron Oxides", price: "$27" },
  { no: 17, sku: "SPOT-001", name: "Acne Spot Treatment Gel", category: "Treatment", target: "Acne-prone", concerns: "Active pimples, inflammation", ingredients: "5% Benzoyl Peroxide + Niacinamide", price: "$14" },
  { no: 18, sku: "BRGT-001", name: "Tranexamic Acid Dark Spot Corrector", category: "Treatment", target: "Pigmented", concerns: "Hyperpigmentation, melasma", ingredients: "Tranexamic Acid + Niacinamide", price: "$29" },
  { no: 19, sku: "OIL-001", name: "Balancing Facial Oil", category: "Oil", target: "Dry / Normal", concerns: "Dryness, nourishment", ingredients: "Jojoba, Rosehip, Squalane", price: "$30" },
  { no: 20, sku: "LIP-001", name: "Overnight Lip Treatment Balm", category: "Lip Care", target: "All", concerns: "Dry/chapped lips", ingredients: "Hyaluronic Acid, Ceramides", price: "$10" },
];

const concernLabels: Record<Concern, string> = {
  acne: "Breakouts",
  dryness: "Dryness",
  wrinkles: "Fine lines",
  pores: "Visible pores",
  pigmentation: "Pigmentation",
  redness: "Redness",
  dullness: "Dullness",
};

const concernOptions = Object.keys(concernLabels) as Concern[];

const Index = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [age, setAge] = useState("28");
  const [sensitive, setSensitive] = useState(false);
  const [selectedConcerns, setSelectedConcerns] = useState<Concern[]>(["pores", "dullness"]);
  const [aiAnalysis, setAiAnalysis] = useState<AiSkinAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
    setAiAnalysis(null);
    setAnalysisError(null);
    setShowResults(false);
  };

  const toggleConcern = (concern: Concern) => {
    setSelectedConcerns((current) =>
      current.includes(concern) ? current.filter((item) => item !== concern) : [...current, concern],
    );
  };

  const analysis = useMemo(() => {
    const userAge = Number(age) || 28;
    const aiConcerns = aiAnalysis
      ? (Object.entries(aiAnalysis.concerns).filter(([, value]) => value >= 0.35).map(([key]) => key) as Concern[])
      : [];
    const activeConcerns = Array.from(new Set([...selectedConcerns, ...aiConcerns]));
    const concernSet = new Set(activeConcerns);
    let skinType: SkinType = "Balanced";
    if (aiAnalysis) {
      const aiTypeMap: Record<AiSkinAnalysis["skin_type"], SkinType> = {
        dry: "Dry",
        oily: "Oily",
        combination: "Combination",
        normal: "Balanced",
        sensitive: "Sensitive",
      };
      skinType = aiTypeMap[aiAnalysis.skin_type] ?? "Balanced";
    } else if (sensitive || concernSet.has("redness")) skinType = "Sensitive";
    else if (concernSet.has("dryness")) skinType = "Dry";
    else if (concernSet.has("acne") || concernSet.has("pores")) skinType = "Oily";
    else if (userAge >= 42 || concernSet.has("wrinkles")) skinType = "Mature";
    else if (concernSet.has("pigmentation") || concernSet.has("dullness")) skinType = "Combination";

    const recommended = products
      .map((product) => {
        const text = `${product.target} ${product.concerns} ${product.ingredients} ${product.category}`.toLowerCase();
        let score = product.target.toLowerCase().includes(skinType.toLowerCase()) || product.target.includes("All") ? 2 : 0;
        activeConcerns.forEach((concern) => {
          const aliases: Record<Concern, string[]> = {
            acne: ["acne", "pimples", "inflammation", "blackheads"],
            dryness: ["dry", "dehydration", "flakiness", "barrier", "tightness"],
            wrinkles: ["wrinkles", "fine lines", "firmness", "photoaging"],
            pores: ["pores", "oil", "shine"],
            pigmentation: ["dark spots", "pigment", "uneven", "melasma"],
            redness: ["sensitive", "soothing", "centella", "barrier"],
            dullness: ["dull", "glow", "texture", "vitamin c"],
          };
          if (aliases[concern].some((alias) => text.includes(alias))) score += 3;
        });
        if (product.category === "Sunscreen") score += 2;
        return { ...product, score };
      })
      .filter((product) => product.score > 1)
      .sort((a, b) => b.score - a.score || a.no - b.no)
      .slice(0, 5);

    return {
      skinType,
      confidence: aiAnalysis ? 94 : photo ? 91 : 78,
      concerns: activeConcerns.length ? activeConcerns : (["dullness"] as Concern[]),
      recommended,
    };
  }, [age, aiAnalysis, photo, selectedConcerns, sensitive]);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysisError(null);

    try {
      if (photoFile) {
        const imageBase64 = await fileToBase64(photoFile);
        const { data, error } = await supabase.functions.invoke<AiSkinAnalysis>("analyze-skin", {
          body: { imageBase64, mimeType: photoFile.type },
        });

        if (error) throw error;
        if (data) setAiAnalysis(data);
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "AI analysis unavailable");
    } finally {
      setIsAnalyzing(false);
      setShowResults(true);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-hero-gradient text-foreground">
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-6 md:grid-cols-[0.9fr_1.1fr] md:px-10 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary-gradient" />
        <div className="flex flex-col justify-between gap-10 py-4 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-semibold text-beauty-plum">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
                <Sparkles className="size-5" />
              </span>
              LUMI Skin Studio
            </div>
            <span className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-muted-foreground">
              Prototype
            </span>
          </div>

          <div className="animate-soft-rise space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface-elevated px-4 py-2 text-sm font-medium text-beauty-plum shadow-soft">
              <Wand2 className="size-4 text-primary" /> AI skin ritual builder
            </div>
            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] text-beauty-plum md:text-7xl">
                Selfie to skincare in one luminous scan.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-muted-foreground">
                Upload a face photo, add a few skin cues, and receive a polished skin profile with explainable concerns and shoppable SKU recommendations.
              </p>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-3">
              {["Skin type", "Concerns", "Routine"].map((item, index) => (
                <div key={item} className="rounded-xl border border-border bg-surface-elevated p-4 shadow-soft transition-transform hover:-translate-y-1">
                  <p className="text-2xl font-semibold text-primary">0{index + 1}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Browser photo upload</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Explainable matching</span>
          </div>
        </div>

        <div className="grid content-center gap-5 py-4 md:py-8">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
                {photo ? (
                  <img src={photo} alt="Uploaded skin analysis preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="grid size-20 place-items-center rounded-full bg-secondary text-primary">
                      <ScanFace className="size-10" />
                    </div>
                    <div>
                      <p className="font-semibold text-beauty-plum">Add a front-facing photo</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Natural light and no heavy makeup gives the cleanest prototype result.</p>
                    </div>
                  </div>
                )}
                {(isAnalyzing || showResults) && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="h-full w-2/3 bg-scan-gradient opacity-80 blur-sm motion-safe:animate-scan-pass" />
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="soft" onClick={() => cameraRef.current?.click()}><Camera className="size-4" /> Selfie</Button>
                <Button variant="soft" onClick={() => inputRef.current?.click()}><ImageUp className="size-4" /> Upload</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold text-beauty-plum">Skin cues</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Optional questionnaire improves recommendation relevance.</p>
                </div>
                <Droplets className="size-6 text-primary" />
              </div>

              <label className="mt-6 block text-sm font-semibold text-beauty-plum" htmlFor="age">Age range</label>
              <select id="age" value={age} onChange={(event) => setAge(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring">
                <option value="22">18–25</option>
                <option value="28">26–34</option>
                <option value="38">35–44</option>
                <option value="48">45+</option>
              </select>

              <div className="mt-5">
                <p className="text-sm font-semibold text-beauty-plum">Concern focus</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {concernOptions.map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleConcern(concern)}
                      className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${selectedConcerns.includes(concern) ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"}`}
                    >
                      {concernLabels[concern]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background p-4 text-sm font-semibold text-beauty-plum">
                Sensitive or reactive skin
                <input type="checkbox" checked={sensitive} onChange={(event) => setSensitive(event.target.checked)} className="size-5 accent-primary" />
              </label>

              <Button variant="beauty" size="lg" className="mt-5 w-full" onClick={runAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <ScanFace className="size-4" />}
                {isAnalyzing ? "Analyzing skin signals" : "Analyze my skin"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
            {showResults ? (
              <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="space-y-4">
                  <div className="rounded-xl bg-secondary p-4">
                    <p className="text-sm font-semibold text-muted-foreground">Detected skin type</p>
                    <p className="mt-1 text-4xl font-semibold text-beauty-plum">{analysis.skinType}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{analysis.confidence}% prototype confidence from photo and questionnaire inputs.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {analysis.concerns.slice(0, 4).map((concern) => (
                      <div key={concern} className="rounded-xl border border-border bg-background p-3">
                        <p className="text-sm font-semibold text-beauty-plum">{concernLabels[concern]}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Matched to active-support SKUs.</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-3xl font-semibold text-beauty-plum">Recommended routine</h2>
                    <Sun className="size-5 text-beauty-gold" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysis.recommended.map((product) => (
                      <article key={product.sku} className="rounded-xl border border-border bg-background p-4 transition-transform hover:-translate-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-primary">{product.sku} · {product.category}</p>
                            <h3 className="mt-1 text-xl font-semibold text-beauty-plum">{product.name}</h3>
                          </div>
                          <span className="rounded-full bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">{product.price}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{product.concerns}</p>
                        <p className="mt-2 text-sm font-semibold text-beauty-plum">{product.ingredients}</p>
                        <Button variant="link" className="mt-3 h-auto p-0 text-primary">
                          <ShoppingBag className="size-4" /> Shop now
                        </Button>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Sparkles className="size-8 text-primary" />
                <h2 className="text-3xl font-semibold text-beauty-plum">Your analysis will bloom here.</h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">This prototype maps visual/questionnaire signals to skin type, priority concerns, explanations, and product SKUs.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;