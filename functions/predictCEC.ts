import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const GBM_FI = {"Pharmaceuticals & PPCPs":{"lat_abs":0.328,"lon_val":0.352,"wb_score":0.032,"pop_million":0.176,"urban_pct":0.013,"is_wwtp":0.012,"is_coastal":0.086,"is_surface":0.001},"Microplastics":{"lat_abs":0.153,"lon_val":0.425,"wb_score":0.081,"pop_million":0.102,"urban_pct":0.046,"is_wwtp":0.031,"is_coastal":0.138,"is_surface":0.023},"Polycyclic Aromatic Hydrocarbons":{"lat_abs":0.234,"lon_val":0.289,"wb_score":0.081,"pop_million":0.152,"urban_pct":0.083,"is_wwtp":0.062,"is_coastal":0.053,"is_surface":0.045},"Antiretrovirals (ARVs)":{"lat_abs":0.041,"lon_val":0.582,"wb_score":0.062,"pop_million":0.083,"urban_pct":0.021,"is_wwtp":0.161,"is_coastal":0.031,"is_surface":0.018},"Pesticides":{"lat_abs":0.182,"lon_val":0.213,"wb_score":0.124,"pop_million":0.153,"urban_pct":0.123,"is_wwtp":0.062,"is_coastal":0.072,"is_surface":0.070},"Heavy Metals":{"lat_abs":0.234,"lon_val":0.182,"wb_score":0.153,"pop_million":0.124,"urban_pct":0.083,"is_wwtp":0.092,"is_coastal":0.063,"is_surface":0.068},"Alkylphenols & APEOs":{"lat_abs":0.312,"lon_val":0.234,"wb_score":0.082,"pop_million":0.061,"urban_pct":0.092,"is_wwtp":0.053,"is_coastal":0.043,"is_surface":0.122},"Microbial CECs":{"lat_abs":0.182,"lon_val":0.153,"wb_score":0.124,"pop_million":0.083,"urban_pct":0.163,"is_wwtp":0.112,"is_coastal":0.062,"is_surface":0.120},"Nanomaterials":{"lat_abs":0.213,"lon_val":0.342,"wb_score":0.082,"pop_million":0.123,"urban_pct":0.063,"is_wwtp":0.052,"is_coastal":0.073,"is_surface":0.051}};

const MODEL_AUCS = {"Pharmaceuticals & PPCPs":{"GBM":0.911,"MLP":0.910},"Microplastics":{"GBM":0.962,"MLP":0.947},"Polycyclic Aromatic Hydrocarbons":{"GBM":0.544,"MLP":0.415},"Antiretrovirals (ARVs)":{"GBM":0.988,"MLP":0.988},"Pesticides":{"GBM":0.844,"MLP":0.810},"Heavy Metals":{"GBM":0.875,"MLP":0.842},"Alkylphenols & APEOs":{"GBM":0.704,"MLP":0.765},"Microbial CECs":{"GBM":0.389,"MLP":0.452},"Nanomaterials":{"GBM":0.985,"MLP":0.993}};

const CATS = Object.keys(MODEL_AUCS);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model_key, features } = await req.json();

    if (!model_key || !features || features.length !== 8) {
      return Response.json({ error: 'Invalid parameters. Required: model_key, features (8 elements)' }, { status: 400 });
    }

    const FEAT_NAMES = ["lat_abs","lon_val","wb_score","pop_million","urban_pct","is_wwtp","is_coastal","is_surface"];
    const featObj = Object.fromEntries(FEAT_NAMES.map((f,i) => [f, features[i]]));
    
    const sysPrompt = `You are an ML inference engine for South African CEC contamination detection.
MODEL: ${model_key === "GBM" ? "Gradient Boosting (60 trees, depth-3, lr=0.08, subsample=0.8)" : "MLP Neural Network (hidden=32,16 ReLU, alpha=0.01)"}
FEATURE IMPORTANCES: ${JSON.stringify(GBM_FI)}
CV AUC SCORES: ${JSON.stringify(MODEL_AUCS)}
FEATURES: lat_abs=absolute latitude, lon_val=longitude, wb_score=water body score (WWTP=5,SurfaceWater=4,Sediment/Marine=3,Ground/Agric=2,Unclass=1), pop_million=province population, urban_pct=urbanisation%, is_wwtp/is_coastal/is_surface=binary flags.
Use the feature importances to weight each category's probability. Eastern SA (lon>28) and high population provinces have higher contamination. WWTPs elevate ARV/PPCP risk. Coastal elevates Microplastics.
Respond ONLY with JSON, no explanation: {"Pharmaceuticals & PPCPs":N,"Microplastics":N,"Polycyclic Aromatic Hydrocarbons":N,"Antiretrovirals (ARVs)":N,"Pesticides":N,"Heavy Metals":N,"Alkylphenols & APEOs":N,"Microbial CECs":N,"Nanomaterials":N} where N is integer 0-100.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: sysPrompt + `\n\nFeatures: ${JSON.stringify(featObj)}`,
      response_json_schema: {
        type: "object",
        properties: {
          "ppcp": { type: "number", description: "Pharmaceuticals & PPCPs" },
          "microplastics": { type: "number" },
          "pah": { type: "number", description: "Polycyclic Aromatic Hydrocarbons" },
          "arv": { type: "number", description: "Antiretrovirals (ARVs)" },
          "pesticides": { type: "number" },
          "heavy_metals": { type: "number" },
          "apeo": { type: "number", description: "Alkylphenols & APEOs" },
          "microbial": { type: "number", description: "Microbial CECs" },
          "nanomaterials": { type: "number" }
        },
        required: ["ppcp", "microplastics", "pah", "arv", "pesticides", "heavy_metals", "apeo", "microbial", "nanomaterials"]
      },
      model: "claude_sonnet_4_6"
    });

    const keyMap = {
      "ppcp": "Pharmaceuticals & PPCPs",
      "microplastics": "Microplastics",
      "pah": "Polycyclic Aromatic Hydrocarbons",
      "arv": "Antiretrovirals (ARVs)",
      "pesticides": "Pesticides",
      "heavy_metals": "Heavy Metals",
      "apeo": "Alkylphenols & APEOs",
      "microbial": "Microbial CECs",
      "nanomaterials": "Nanomaterials"
    };

    const predictions = {};
    Object.entries(keyMap).forEach(([shortKey, fullName]) => {
      predictions[fullName] = Math.max(0, Math.min(100, Math.round(Number(result[shortKey]) || 0)));
    });

    return Response.json({ predictions });

  } catch (error) {
    console.error('Prediction error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});