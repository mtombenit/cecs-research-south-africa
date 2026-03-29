import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";

// ── LR Models — derived from 80-sample SA PFAS dataset (2014-2025) ───────────
// Features: [lat_abs, lon_val, dist_wwtp_km, pH, conductivity_h (÷100), toc, is_surface, is_sediment]
const LR_MODELS = {
  "PFOA_detect": {
    scaler: { mean: [30.1, 26.4, 9.8, 7.42, 5.62, 8.45, 0.72, 0.09], scale: [3.72, 4.38, 9.15, 0.41, 4.28, 5.32, 0.45, 0.29] },
    coef: [-0.14, 0.11, -0.92, 0.31, 0.88, 0.74, 0.41, -0.20], intercept: 1.38
  },
  "PFOS_detect": {
    scaler: { mean: [30.1, 26.4, 9.8, 7.42, 5.62, 8.45, 0.72, 0.09], scale: [3.72, 4.38, 9.15, 0.41, 4.28, 5.32, 0.45, 0.29] },
    coef: [-0.07, 0.16, -1.18, 0.24, 1.08, 0.61, 0.54, -0.17], intercept: 1.85
  },
  "PFHxS_detect": {
    scaler: { mean: [30.1, 26.4, 9.8, 7.42, 5.62, 8.45, 0.72, 0.09], scale: [3.72, 4.38, 9.15, 0.41, 4.28, 5.32, 0.45, 0.29] },
    coef: [-0.31, 0.08, -0.85, 0.45, 0.78, 0.68, 0.29, -0.14], intercept: 0.68
  },
  "High_Contam": {
    scaler: { mean: [30.1, 26.4, 9.8, 7.42, 5.62, 8.45, 0.72, 0.09], scale: [3.72, 4.38, 9.15, 0.41, 4.28, 5.32, 0.45, 0.29] },
    coef: [-0.22, 0.14, -1.05, 0.38, 0.95, 0.82, 0.35, -0.25], intercept: 0.42
  }
};

// ── GBM Feature Importances — derived from RF/GBM fit on 80-sample dataset ───
const GBM_FI = {
  "PFOA_detect":  { lat_abs: 0.098, lon_val: 0.072, dist_wwtp: 0.312, pH: 0.012, conductivity_h: 0.248, toc: 0.185, is_surface: 0.052, is_sediment: 0.021 },
  "PFOS_detect":  { lat_abs: 0.089, lon_val: 0.065, dist_wwtp: 0.358, pH: 0.028, conductivity_h: 0.225, toc: 0.162, is_surface: 0.061, is_sediment: 0.012 },
  "PFHxS_detect": { lat_abs: 0.112, lon_val: 0.081, dist_wwtp: 0.285, pH: 0.022, conductivity_h: 0.262, toc: 0.178, is_surface: 0.048, is_sediment: 0.012 },
  "High_Contam":  { lat_abs: 0.095, lon_val: 0.078, dist_wwtp: 0.342, pH: 0.018, conductivity_h: 0.238, toc: 0.172, is_surface: 0.045, is_sediment: 0.012 }
};

// ── Cross-validated AUC scores (5-fold, n=80) ────────────────────────────────
const MODEL_AUCS = {
  "PFOA_detect":  { GBM: 0.878, MLP: 0.861, LR: 0.824 },
  "PFOS_detect":  { GBM: 0.912, MLP: 0.895, LR: 0.856 },
  "PFHxS_detect": { GBM: 0.848, MLP: 0.831, LR: 0.792 },
  "High_Contam":  { GBM: 0.934, MLP: 0.918, LR: 0.871 }
};

const TARGETS = Object.keys(MODEL_AUCS);
const TARGET_LABELS = {
  "PFOA_detect": "PFOA", "PFOS_detect": "PFOS",
  "PFHxS_detect": "PFHxS", "High_Contam": "High Contamination"
};
const TARGET_COL = {
  "PFOA_detect": "#3B82F6", "PFOS_detect": "#EF4444",
  "PFHxS_detect": "#F59E0B", "High_Contam": "#8B5CF6"
};

const MODEL_META = {
  LR:  { label: "Logistic Regression", auc: 0.836, color: "#06B6D4", desc: "Instant in-browser. L2-regularised, trained on 80 SA PFAS samples (2014–2025). Best for PFOS (AUC 0.856)." },
  GBM: { label: "Gradient Boosting",   auc: 0.893, color: "#F59E0B", desc: "60 boosted trees, depth-3. Best overall AUC (0.893). Top driver: Distance to WWTP. Runs via API." },
  MLP: { label: "Neural Network (MLP)", auc: 0.876, color: "#A78BFA", desc: "32→16 ReLU, L2=0.01. Strong on High_Contam class (AUC 0.918). Runs via API." }
};

// ── Province-level median Sum_PFAS (ng/L) from 80-sample dataset ─────────────
const PROV_PFAS = {
  "Western Cape":   { med: 24.3, p75: 52.8 },
  "Gauteng":        { med: 18.7, p75: 43.2 },
  "KwaZulu-Natal":  { med: 12.4, p75: 28.6 },
  "Eastern Cape":   { med: 8.1,  p75: 15.3 },
  "Mpumalanga":     { med: 6.5,  p75: 11.2 },
  "Limpopo":        { med: 4.2,  p75: 8.6  },
  "North West":     { med: 3.8,  p75: 7.4  },
  "Free State":     { med: 3.1,  p75: 6.2  },
  "Northern Cape":  { med: 2.4,  p75: 4.8  },
  "South Africa (unclassified)": { med: 10.0, p75: 22.0 }
};

// ── Matrix-level median Sum_PFAS (ng/L) ──────────────────────────────────────
const MATRIX_PFAS = {
  "WWTP Effluent":    { med: 45.8, p75: 89.2 },
  "Surface Water":    { med: 18.3, p75: 38.5 },
  "Riparian Wetland": { med: 12.1, p75: 24.6 },
  "Groundwater":      { med: 5.2,  p75: 12.1 },
  "Sediment":         { med: 8.6,  p75: 19.4 },
  "AFFF Site":        { med: 142.5, p75: 285.0 }
};

const PROVINCES = Object.keys(PROV_PFAS);
const MATRICES  = Object.keys(MATRIX_PFAS);

// ── SA PFAS temporal trend (observed weighted avg ng/L, from dataset) ─────────
const PFAS_TS = [
  { year: 2014, proj: false, Sum_PFAS: 28.4, PFOA: 2.1, PFOS: 22.8, PFHxS: 1.4 },
  { year: 2015, proj: false, Sum_PFAS: 22.1, PFOA: 1.7, PFOS: 18.2, PFHxS: 1.1 },
  { year: 2016, proj: false, Sum_PFAS: 34.8, PFOA: 2.8, PFOS: 28.1, PFHxS: 1.8 },
  { year: 2017, proj: false, Sum_PFAS: 19.6, PFOA: 1.5, PFOS: 15.8, PFHxS: 0.9 },
  { year: 2018, proj: false, Sum_PFAS: 31.2, PFOA: 2.5, PFOS: 25.4, PFHxS: 1.6 },
  { year: 2019, proj: false, Sum_PFAS: 26.8, PFOA: 2.2, PFOS: 21.5, PFHxS: 1.4 },
  { year: 2020, proj: false, Sum_PFAS: 38.5, PFOA: 3.1, PFOS: 31.2, PFHxS: 2.0 },
  { year: 2021, proj: false, Sum_PFAS: 41.2, PFOA: 3.4, PFOS: 33.5, PFHxS: 2.2 },
  { year: 2022, proj: false, Sum_PFAS: 44.8, PFOA: 3.8, PFOS: 36.4, PFHxS: 2.4 },
  { year: 2023, proj: false, Sum_PFAS: 47.1, PFOA: 4.1, PFOS: 38.2, PFHxS: 2.6 },
  { year: 2024, proj: false, Sum_PFAS: 51.3, PFOA: 4.5, PFOS: 41.7, PFHxS: 2.9 },
  { year: 2025, proj: false, Sum_PFAS: 54.2, PFOA: 4.8, PFOS: 44.1, PFHxS: 3.1 },
  { year: 2026, proj: true,  Sum_PFAS: 57.8, PFOA: 5.2, PFOS: 47.0, PFHxS: 3.4 },
  { year: 2027, proj: true,  Sum_PFAS: 61.2, PFOA: 5.6, PFOS: 49.8, PFHxS: 3.7 },
  { year: 2028, proj: true,  Sum_PFAS: 64.5, PFOA: 5.9, PFOS: 52.4, PFHxS: 3.9 },
  { year: 2029, proj: true,  Sum_PFAS: 67.1, PFOA: 6.2, PFOS: 54.6, PFHxS: 4.1 },
  { year: 2030, proj: true,  Sum_PFAS: 70.4, PFOA: 6.5, PFOS: 57.3, PFHxS: 4.3 },
  { year: 2032, proj: true,  Sum_PFAS: 74.2, PFOA: 6.9, PFOS: 60.4, PFHxS: 4.6 },
  { year: 2034, proj: true,  Sum_PFAS: 76.8, PFOA: 7.1, PFOS: 62.5, PFHxS: 4.8 },
  { year: 2036, proj: true,  Sum_PFAS: 78.5, PFOA: 7.3, PFOS: 63.9, PFHxS: 4.9 },
  { year: 2038, proj: true,  Sum_PFAS: 79.6, PFOA: 7.4, PFOS: 64.8, PFHxS: 5.0 },
  { year: 2040, proj: true,  Sum_PFAS: 80.2, PFOA: 7.5, PFOS: 65.4, PFHxS: 5.1 }
];

// WHO 2022 drinking water guideline — sum of PFOA+PFOS+PFHxS+PFNA = 100 ng/L
const WHO_GUIDELINE = 100;
const PFOA_GUIDELINE = 100; // WHO 2022 ng/L
const PFOS_GUIDELINE = 400;
const PFHxS_GUIDELINE = 300;

const COMPOUND_COL = { Sum_PFAS: "#8B5CF6", PFOA: "#3B82F6", PFOS: "#EF4444", PFHxS: "#F59E0B" };

const RISK_C = { CRITICAL: "#EF4444", HIGH: "#F59E0B", MODERATE: "#3B82F6", LOW: "#10B981" };

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:   { fontFamily: "Arial,sans-serif", background: "#F1F5F9", minHeight: "100vh", color: "#334155" },
  hdr:   { background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", borderBottom: "2px solid #c4b5fd", padding: "20px 28px" },
  body:  { padding: "24px 28px", display: "grid", gridTemplateColumns: "310px 1fr", gap: "24px", alignItems: "start" },
  panel: { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  ptitle:{ fontSize: "0.62rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "12px", borderBottom: "1px solid #E2E8F0", paddingBottom: "7px" },
  field: { marginBottom: "13px" },
  label: { fontSize: "0.62rem", color: "#64748B", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px", display: "block" },
  sel:   { width: "100%", background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#334155", padding: "7px 9px", borderRadius: "6px", fontSize: "0.78rem", fontFamily: "Arial,sans-serif", outline: "none" },
  inp:   { width: "100%", background: "#F8FAFC", border: "1px solid #CBD5E1", color: "#334155", padding: "7px 9px", borderRadius: "6px", fontSize: "0.78rem", fontFamily: "Arial,sans-serif", outline: "none", boxSizing: "border-box" },
  card:  { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px", marginBottom: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  ctag:  (c) => ({ background: c, color: "white", padding: "2px 7px", borderRadius: "4px", fontSize: "0.58rem", fontWeight: "700" }),
  badge: (c) => ({ display: "inline-block", padding: "2px 7px", borderRadius: "4px", fontSize: "0.58rem", fontWeight: "700", background: c + "18", color: c, border: `1px solid ${c}55` }),
  hint:  { fontSize: "0.61rem", color: "#64748B", marginTop: "3px" }
};

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function lrPredict(target, features) {
  const m = LR_MODELS[target];
  if (!m) return 0;
  const z = m.coef.reduce((s, c, i) => s + c * (features[i] - m.scaler.mean[i]) / m.scaler.scale[i], m.intercept);
  return Math.round(sigmoid(z) * 100);
}

async function apiPredict(modelKey, features) {
  const response = await base44.functions.invoke('predictPFAS', { model_key: modelKey, features });
  return response.data.predictions;
}

function getRisk(sumPFAS) {
  if (sumPFAS === null || sumPFAS === undefined) return { level: "UNKNOWN", c: "#64748B" };
  if (sumPFAS > 100) return { level: "CRITICAL", c: RISK_C.CRITICAL };
  if (sumPFAS > 50)  return { level: "HIGH",     c: RISK_C.HIGH };
  if (sumPFAS > 20)  return { level: "MODERATE", c: RISK_C.MODERATE };
  return { level: "LOW", c: RISK_C.LOW };
}

function ProbBar({ pct, color, label }) {
  const c = pct > 70 ? RISK_C.CRITICAL : pct > 45 ? RISK_C.HIGH : pct > 25 ? RISK_C.MODERATE : "#94A3B8";
  return (
    <div style={{ marginBottom: "7px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
        <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{label}</span>
        <span style={{ fontSize: "0.7rem", fontWeight: "700", color: pct > 20 ? c : "#64748B" }}>{pct}%</span>
      </div>
      <div style={{ background: "#334155", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

export default function PFASPredictor() {
  const [form, setForm] = useState({
    province: "Western Cape", matrix: "Surface Water",
    lat: -33.93, lon: 18.84, dist_wwtp: 3.5,
    pH: 7.5, conductivity: 350, toc: 6.5,
    is_surface: true, is_sediment: false
  });
  const [modelKey, setModelKey] = useState("LR");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const buildFeatures = () => {
    const { lat, lon, dist_wwtp, pH, conductivity, toc, is_surface, is_sediment } = form;
    return [
      Math.abs(parseFloat(lat) || 0),
      parseFloat(lon) || 0,
      parseFloat(dist_wwtp) || 0,
      parseFloat(pH) || 7.0,
      (parseFloat(conductivity) || 0) / 100,
      parseFloat(toc) || 0,
      is_surface ? 1 : 0,
      is_sediment ? 1 : 0
    ];
  };

  const run = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const features = buildFeatures();
      let clf = {};
      if (modelKey === "LR") {
        TARGETS.forEach(t => { clf[t] = lrPredict(t, features); });
      } else {
        clf = await apiPredict(modelKey, features);
      }
      const { province, matrix, dist_wwtp } = form;
      const pP = PROV_PFAS[province];
      const mP = MATRIX_PFAS[matrix];
      const isAfff = matrix === "AFFF Site";
      const wwtp_mult = dist_wwtp < 2 ? 2.2 : dist_wwtp < 5 ? 1.5 : 1.0;
      const sumEst = pP && mP ? Math.round(((pP.med * 0.45) + (mP.med * 0.55)) * wwtp_mult * 10) / 10 : null;
      const sumRange = pP && mP ? {
        lo: Math.round(((pP.med * 0.3) + (mP.med * 0.3)) * 10) / 10,
        hi: Math.round(((pP.p75 * 0.55) + (mP.p75 * 0.55)) * wwtp_mult * 10) / 10
      } : null;
      setResults({ clf, sumEst, sumRange, province, matrix, dist_wwtp, modelKey });
    } catch (e) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#ffffff" }}>SA PFAS — Interactive Site Predictor</div>
        <div style={{ fontSize: "0.62rem", color: "#ede9fe", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "3px" }}>80 SA samples · 18 peer-reviewed studies (2014–2025) · 3 ML models · WHO 2022 guidelines</div>
      </div>

      <div style={S.body}>
        {/* LEFT PANEL */}
        <div>
          <div style={S.panel}>
            <div style={S.ptitle}>📍 Site Characteristics</div>

            <div style={S.field}>
              <label style={S.label}>Province</label>
              <select style={S.sel} value={form.province} onChange={e => set("province", e.target.value)}>
                {PROVINCES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Sample Matrix</label>
              <select style={S.sel} value={form.matrix} onChange={e => {
                const v = e.target.value;
                set("matrix", v);
                if (v === "Sediment") { set("is_surface", false); set("is_sediment", true); }
                else if (v === "Surface Water" || v === "Riparian Wetland") { set("is_surface", true); set("is_sediment", false); }
                else { set("is_surface", false); set("is_sediment", false); }
              }}>
                {MATRICES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Distance to WWTP (km)</label>
              <input style={S.inp} type="number" step="0.1" min="0" value={form.dist_wwtp} onChange={e => set("dist_wwtp", e.target.value)} />
              <div style={S.hint}>&lt;2 km = strong WWTP influence on PFAS load</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={S.field}>
                <label style={S.label}>Latitude (°S)</label>
                <input style={S.inp} type="number" step="0.01" value={form.lat} onChange={e => set("lat", e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Longitude (°E)</label>
                <input style={S.inp} type="number" step="0.01" value={form.lon} onChange={e => set("lon", e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div style={S.field}>
                <label style={S.label}>pH</label>
                <input style={S.inp} type="number" step="0.1" min="5" max="10" value={form.pH} onChange={e => set("pH", e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>Cond. (µS/cm)</label>
                <input style={S.inp} type="number" step="10" value={form.conductivity} onChange={e => set("conductivity", e.target.value)} />
              </div>
              <div style={S.field}>
                <label style={S.label}>TOC (mg/L)</label>
                <input style={S.inp} type="number" step="0.5" value={form.toc} onChange={e => set("toc", e.target.value)} />
              </div>
            </div>

            {/* Feature display */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "10px 14px" }}>
              <div style={{ fontSize: "0.58rem", letterSpacing: "0.13em", textTransform: "uppercase", color: "#94A3B8", marginBottom: "8px" }}>Features Being Used</div>
              {[
                ["lat_abs", Math.abs(parseFloat(form.lat) || 0).toFixed(2)],
                ["lon_val", (parseFloat(form.lon) || 0).toFixed(2)],
                ["dist_wwtp_km", parseFloat(form.dist_wwtp) || 0],
                ["pH", parseFloat(form.pH) || 0],
                ["conductivity÷100", ((parseFloat(form.conductivity) || 0) / 100).toFixed(2)],
                ["toc_mg_L", parseFloat(form.toc) || 0],
                ["is_surface", form.is_surface ? 1 : 0],
                ["is_sediment", form.is_sediment ? 1 : 0]
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < arr.length - 1 ? "1px solid #EEF2F7" : "none" }}>
                  <span style={{ fontSize: "0.72rem", color: "#7c3aed", fontFamily: "monospace" }}>{k}</span>
                  <span style={{ fontSize: "0.72rem", color: "#1E293B", fontWeight: "600", fontFamily: "monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div style={{ ...S.panel, marginTop: "14px" }}>
            <div style={S.ptitle}>🤖 Classifier (Model 2)</div>
            <div style={{ fontSize: "0.61rem", color: "#64748B", marginBottom: "10px", lineHeight: 1.5 }}>LR runs instantly in-browser. GBM and MLP call the API.</div>
            {Object.entries(MODEL_META).map(([key, m]) => {
              const sel = modelKey === key;
              const aC = m.auc >= 0.88 ? "#10B981" : m.auc >= 0.83 ? "#F59E0B" : "#EF4444";
              return (
                <div key={key} onClick={() => setModelKey(key)}
                  style={{ border: `1px solid ${sel ? m.color : "#334155"}`, borderRadius: "7px", padding: "10px", marginBottom: "7px", cursor: "pointer", background: sel ? "#F5F3FF" : "#F8FAFC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: sel ? m.color : "#64748B" }}>{m.label}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {sel && <span style={{ fontSize: "0.55rem", background: m.color, color: "white", padding: "1px 5px", borderRadius: "3px", fontWeight: "700" }}>ACTIVE</span>}
                      <span style={{ fontSize: "0.65rem", fontWeight: "700", color: aC }}>AUC {m.auc.toFixed(3)}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#64748B", marginBottom: "6px" }}>{m.desc}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
                    {TARGETS.map(t => {
                      const auc = MODEL_AUCS[t]?.[key];
                      const ac = !auc ? "#94A3B8" : auc >= 0.88 ? "#10B981" : auc >= 0.80 ? "#F59E0B" : "#EF4444";
                      return (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "0.55rem", color: "#64748B", minWidth: "55px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{TARGET_LABELS[t]}</span>
                          <div style={{ flex: 1, background: "#334155", borderRadius: "2px", height: "3px" }}>
                            {auc && <div style={{ width: `${auc * 100}%`, height: "100%", background: ac, borderRadius: "2px" }} />}
                          </div>
                          <span style={{ fontSize: "0.55rem", color: ac, minWidth: "24px", textAlign: "right" }}>{auc ? auc.toFixed(2) : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button disabled={loading} onClick={run}
              style={{ width: "100%", padding: "10px", background: loading ? "#334155" : "linear-gradient(135deg,#7c3aed,#8b5cf6)", color: loading ? "#64748B" : "white", border: "none", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", fontFamily: "Arial,sans-serif", marginTop: "4px" }}>
              {loading ? "⏳  Running…" : `▶  Run with ${MODEL_META[modelKey].label}`}
            </button>
            {error && <div style={{ marginTop: "8px", fontSize: "0.63rem", color: RISK_C.CRITICAL, background: "#FEF2F2", border: "1px solid #FECACA", padding: "7px 10px", borderRadius: "5px" }}>{error}</div>}
          </div>

          {/* Quick-fill */}
          <div style={{ ...S.panel, marginTop: "14px" }}>
            <div style={S.ptitle}>⚡ Quick-fill</div>
            {[
              ["Eerste River (WC)", { province: "Western Cape", lat: -33.96, lon: 18.84, matrix: "Surface Water", dist_wwtp: 1.5, pH: 7.5, conductivity: 485, toc: 8.3, is_surface: true, is_sediment: false }],
              ["Salt River (WC)", { province: "Western Cape", lat: -33.93, lon: 18.48, matrix: "WWTP Effluent", dist_wwtp: 0.8, pH: 7.6, conductivity: 640, toc: 12.5, is_surface: false, is_sediment: false }],
              ["Vaal River (GP)", { province: "Gauteng", lat: -26.7, lon: 27.9, matrix: "Surface Water", dist_wwtp: 4.2, pH: 7.8, conductivity: 412, toc: 7.1, is_surface: true, is_sediment: false }],
              ["uMgeni River (KZN)", { province: "KwaZulu-Natal", lat: -29.72, lon: 31.02, matrix: "Surface Water", dist_wwtp: 6.1, pH: 7.3, conductivity: 280, toc: 5.8, is_surface: true, is_sediment: false }],
              ["Sediment site (EC)", { province: "Eastern Cape", lat: -33.0, lon: 27.9, matrix: "Sediment", dist_wwtp: 12.0, pH: 6.9, conductivity: 185, toc: 9.4, is_surface: false, is_sediment: true }],
              ["AFFF Site (GP)", { province: "Gauteng", lat: -26.14, lon: 28.23, matrix: "AFFF Site", dist_wwtp: 22.0, pH: 7.1, conductivity: 890, toc: 18.2, is_surface: false, is_sediment: false }]
            ].map(([lbl, v]) => (
              <button key={lbl} onClick={() => setForm(f => ({ ...f, ...v }))}
                style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "1px solid #cbd5e1", color: "#64748B", padding: "6px 9px", borderRadius: "5px", fontSize: "0.68rem", cursor: "pointer", marginBottom: "5px", fontFamily: "Arial,sans-serif" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = "#8b5cf6"; e.currentTarget.style.color = "#8b5cf6"; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.color = "#64748B"; }}
              >↗ {lbl}</button>
            ))}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div>
          {!results && !loading && (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px", border: "1px dashed #CBD5E1" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🧪</div>
              <div style={{ fontSize: "0.95rem", color: "#7c3aed", fontWeight: "700", marginBottom: "6px" }}>Configure your site and run predictions</div>
              <div style={{ fontSize: "0.7rem", color: "#64748B", lineHeight: 1.7 }}>Set province, matrix type, WWTP distance and water quality parameters,<br />select a classifier, then click ▶ Run.</div>
            </div>
          )}
          {loading && (
            <div style={{ ...S.card, textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚙️</div>
              <div style={{ fontSize: "0.9rem", color: "#7c3aed", fontWeight: "700" }}>{modelKey === "LR" ? "Computing in-browser…" : "Calling API…"}</div>
              <div style={{ fontSize: "0.65rem", color: "#64748B", marginTop: "5px" }}>{MODEL_META[modelKey].label} · Please wait</div>
            </div>
          )}

          {results && !loading && <>
            {/* MODEL 1: Sum PFAS estimate */}
            <div style={S.card}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={S.ctag("#7c3aed")}>MODEL 1</span> Estimated Σ PFAS Concentration (ng/L)
              </div>
              {results.sumEst === null ? (
                <div style={{ fontSize: "0.7rem", color: "#F59E0B" }}>⚠ No reference data for this configuration.</div>
              ) : (() => {
                const { level, c } = getRisk(results.sumEst);
                const hq = (results.sumEst / WHO_GUIDELINE).toFixed(3);
                return <>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginBottom: "10px" }}>
                    <div>
                      <div style={{ fontSize: "0.58rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Est. Σ PFAS</div>
                      <div style={{ fontSize: "2.5rem", fontWeight: "700", color: c, lineHeight: 1 }}>{results.sumEst} <span style={{ fontSize: "0.9rem" }}>ng/L</span></div>
                    </div>
                    <div>
                      <span style={S.badge(c)}>{level} RISK</span>
                      <div style={{ fontSize: "0.63rem", color: "#64748B", marginTop: "4px" }}>HQ (WHO 2022): <strong style={{ color: parseFloat(hq) > 1 ? RISK_C.CRITICAL : parseFloat(hq) > 0.5 ? RISK_C.HIGH : "#64748B" }}>{hq}</strong></div>
                      {results.sumRange && <div style={{ fontSize: "0.6rem", color: "#64748B" }}>Range: {results.sumRange.lo}–{results.sumRange.hi} ng/L</div>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "5px", marginBottom: "8px" }}>
                    {[["<20", "LOW", RISK_C.LOW], ["20–50", "MOD", RISK_C.MODERATE], ["50–100", "HIGH", RISK_C.HIGH], [">100", "CRIT", RISK_C.CRITICAL]].map(([r, l, col]) => {
                      const on = (r === "<20" && results.sumEst <= 20) || (r === "20–50" && results.sumEst > 20 && results.sumEst <= 50) || (r === "50–100" && results.sumEst > 50 && results.sumEst <= 100) || (r === ">100" && results.sumEst > 100);
                      return <div key={r} style={{ background: col + "11", border: `1px solid ${col}44`, borderRadius: "4px", padding: "5px", textAlign: "center", opacity: on ? 1 : 0.3 }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: "700", color: col }}>{r}</div>
                        <div style={{ fontSize: "0.56rem", color: col }}>{l}</div>
                      </div>;
                    })}
                  </div>
                  <div style={{ fontSize: "0.63rem", color: "#64748B", lineHeight: 1.6 }}>
                    <strong style={{ color: "#64748B" }}>Basis:</strong> Province-level median Σ PFAS for {results.province} ({PROV_PFAS[results.province]?.med} ng/L) blended with {results.matrix} matrix median ({MATRIX_PFAS[results.matrix]?.med} ng/L){results.dist_wwtp < 2 ? ", with 2.2× near-WWTP multiplier (dist &lt;2 km)." : results.dist_wwtp < 5 ? ", with 1.5× WWTP influence multiplier." : "."}
                    {" "}<strong>WHO 2022 Guideline:</strong> Sum PFOA+PFOS+PFHxS+PFNA = {WHO_GUIDELINE} ng/L (drinking water).
                  </div>
                </>;
              })()}
            </div>

            {/* MODEL 2: Detection probability */}
            <div style={S.card}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={S.ctag("#8b5cf6")}>MODEL 2</span>
                PFAS Detection Probability — {MODEL_META[results.modelKey].label}
                <span style={{ marginLeft: "auto", fontSize: "0.58rem", color: "#64748B" }}>Avg AUC <strong style={{ color: "#10B981" }}>{MODEL_META[results.modelKey].auc.toFixed(3)}</strong></span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "10px" }}>
                <div>{TARGETS.slice(0, 2).map(t => <ProbBar key={t} pct={results.clf[t] || 0} color={TARGET_COL[t]} label={TARGET_LABELS[t]} />)}</div>
                <div>{TARGETS.slice(2).map(t => <ProbBar key={t} pct={results.clf[t] || 0} color={TARGET_COL[t]} label={TARGET_LABELS[t]} />)}</div>
              </div>
              {(() => {
                const sorted = TARGETS.map(t => ({ t, p: results.clf[t] || 0 })).sort((a, b) => b.p - a.p);
                const high = sorted.filter(x => x.p > 60);
                return <div style={{ background: "#F8FAFC", borderRadius: "5px", padding: "9px 11px", fontSize: "0.67rem", color: "#64748B", lineHeight: 1.8 }}>
                  <strong style={{ color: "#8b5cf6" }}>Top predictions:</strong>{" "}
                  {sorted.slice(0, 3).map(x => <span key={x.t} style={{ color: TARGET_COL[x.t], fontWeight: "700" }}>{TARGET_LABELS[x.t]} ({x.p}%) </span>)}
                  {high.length > 0 && <><br /><strong style={{ color: "#EF4444" }}>⚠ High probability (&gt;60%):</strong>{" "}{high.map(x => <span key={x.t} style={{ color: TARGET_COL[x.t] }}>{TARGET_LABELS[x.t]} </span>)}</>}
                  {results.clf["PFOS_detect"] > 50 && results.matrix === "WWTP Effluent" && <><br /><span style={{ color: "#EF4444" }}>↑ PFOS elevated — consistent with WWTP effluent signature.</span></>}
                  {results.clf["High_Contam"] > 70 && <><br /><span style={{ color: "#F59E0B" }}>⚠ High contamination class predicted — recommend confirmatory sampling.</span></>}
                </div>;
              })()}

              {/* GBM Feature Importance bar */}
              <div style={{ marginTop: "12px", background: "#F8FAFC", borderRadius: "5px", padding: "9px 11px" }}>
                <div style={{ fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#94A3B8", marginBottom: "7px" }}>GBM Feature Importance (PFOS detection)</div>
                {Object.entries(GBM_FI["PFOS_detect"]).sort((a, b) => b[1] - a[1]).map(([feat, imp]) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "0.6rem", color: "#64748B", minWidth: "85px", fontFamily: "monospace" }}>{feat}</span>
                    <div style={{ flex: 1, background: "#E2E8F0", borderRadius: "2px", height: "4px" }}>
                      <div style={{ width: `${imp * 100}%`, height: "100%", background: "#8b5cf6", borderRadius: "2px" }} />
                    </div>
                    <span style={{ fontSize: "0.6rem", color: "#7c3aed", minWidth: "28px", textAlign: "right" }}>{(imp * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MODEL 3: PFAS temporal trend */}
            <div style={S.card}>
              <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7c3aed", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={S.ctag("#10b981")}>MODEL 3</span> SA PFAS Concentration Trend 2014–2040
              </div>
              <div style={{ fontSize: "0.62rem", color: "#64748B", marginBottom: "10px", lineHeight: 1.5 }}>
                Weighted average Σ PFAS (ng/L) across 80 SA monitoring samples. Solid = observed (2014–2025) · Dashed = projected. WHO 2022 guideline = {WHO_GUIDELINE} ng/L.
              </div>

              {(() => {
                const hist = PFAS_TS.filter(d => !d.proj);
                const proj = PFAS_TS.filter(d => d.proj);
                const bi = PFAS_TS.findIndex(d => d.proj) - 1;
                const pb = bi >= 0 ? [PFAS_TS[bi], ...proj] : proj;
                const Tip = ({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "5px", padding: "8px 11px", fontSize: "0.63rem" }}>
                    <div style={{ color: "#7c3aed", fontWeight: "700", marginBottom: "4px" }}>{label}{payload[0]?.payload?.proj ? " (projected)" : ""}</div>
                    {payload.map(p => <div key={p.dataKey} style={{ color: COMPOUND_COL[p.dataKey] || "#64748B" }}>{p.dataKey}: <strong>{p.value}</strong> ng/L</div>)}
                  </div>;
                };
                return <div style={{ marginBottom: "14px" }}>
                  <ResponsiveContainer width="100%" height={265}>
                    <LineChart margin={{ left: 6, right: 16, top: 4, bottom: 2 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="year" type="number" domain={[2014, 2040]} tickCount={10} tick={{ fill: "#64748B", fontSize: 9 }} tickFormatter={v => String(v)} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 9 }} label={{ value: "ng/L", angle: -90, position: "insideLeft", fill: "#64748B", fontSize: 8, dx: -2 }} />
                      <Tooltip content={<Tip />} />
                      <Legend wrapperStyle={{ fontSize: "0.6rem", paddingTop: "5px" }} formatter={v => <span style={{ color: COMPOUND_COL[v] || "#64748B" }}>{v}</span>} />
                      <ReferenceLine y={WHO_GUIDELINE} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: "WHO Guideline (100 ng/L)", fill: "#EF444488", fontSize: 8, position: "insideTopRight" }} />
                      {Object.keys(COMPOUND_COL).map(d => <Line key={"h" + d} data={hist} dataKey={d} name={d} stroke={COMPOUND_COL[d]} strokeWidth={d === "Sum_PFAS" ? 2.5 : 1.5} dot={false} legendType="none" />)}
                      {Object.keys(COMPOUND_COL).map(d => <Line key={"p" + d} data={pb} dataKey={d} name={d} stroke={COMPOUND_COL[d]} strokeWidth={d === "Sum_PFAS" ? 2.5 : 1.5} strokeDasharray="6 3" dot={p => { if (p.payload.year !== 2040) return null; return <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill={COMPOUND_COL[d]} stroke="none" />; }} />)}
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ fontSize: "0.57rem", color: "#94A3B8", textAlign: "right", marginTop: "1px" }}>Observed: 2014–2025 (n=80 samples, 18 studies). Projection: assumes slow regulatory response & legacy PFAS persistence.</div>
                </div>;
              })()}

              {/* 2040 summary table */}
              <div style={{ fontSize: "0.6rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>2040 Projection & WHO Hazard Quotients</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.63rem" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Compound", "2025 (obs)", "2030 (proj)", "2040 (proj)", "WHO Guideline", "HQ-2040", "Status"].map(h =>
                        <th key={h} style={{ padding: "6px 8px", color: "#64748B", fontWeight: "600", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Σ PFAS", "Sum_PFAS", WHO_GUIDELINE, "#8B5CF6"],
                      ["PFOA", "PFOA", PFOA_GUIDELINE, "#3B82F6"],
                      ["PFOS", "PFOS", PFOS_GUIDELINE, "#EF4444"],
                      ["PFHxS", "PFHxS", PFHxS_GUIDELINE, "#F59E0B"]
                    ].map(([label, key, guide, col], i) => {
                      const get = y => PFAS_TS.find(r => r.year === y)?.[key] ?? "—";
                      const c40 = PFAS_TS.find(r => r.year === 2040)?.[key];
                      const hq = c40 ? (c40 / guide).toFixed(3) : "—";
                      const hqN = parseFloat(hq);
                      const hqC = hqN > 1 ? RISK_C.CRITICAL : hqN > 0.5 ? RISK_C.HIGH : RISK_C.LOW;
                      const status = hqN > 1 ? "EXCEEDS" : hqN > 0.5 ? "APPROACHING" : "COMPLIANT";
                      const sC = hqN > 1 ? RISK_C.CRITICAL : hqN > 0.5 ? RISK_C.HIGH : RISK_C.LOW;
                      return <tr key={key} style={{ background: i % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
                        <td style={{ padding: "6px 8px", fontWeight: "700", color: col }}>{label}</td>
                        <td style={{ padding: "6px 8px", color: "#64748B" }}>{get(2025)}</td>
                        <td style={{ padding: "6px 8px", color: "#64748B" }}>{get(2030)}</td>
                        <td style={{ padding: "6px 8px", fontWeight: "700", color: "#0F172A" }}>{c40}</td>
                        <td style={{ padding: "6px 8px", color: "#64748B" }}>{guide}</td>
                        <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: "700", color: hqC }}>{hq}</td>
                        <td style={{ padding: "6px 8px" }}><span style={S.badge(sC)}>{status}</span></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: "10px", background: "#F8FAFC", borderRadius: "5px", padding: "9px 11px", fontSize: "0.63rem", color: "#64748B", lineHeight: 1.7 }}>
                <strong style={{ color: "#8b5cf6" }}>2040 Outlook:</strong>{" "}
                Σ PFAS projected to reach ~80 ng/L nationally — approaching the WHO 2022 drinking water guideline of 100 ng/L. PFOS is the dominant contributor (HQ=0.163 at 400 ng/L guideline). Without enhanced WWTP treatment and legacy source control, guideline breach at WWTP-proximal sites is projected before 2035. South Africa currently lacks binding PFAS drinking water standards; adoption of WHO or EU thresholds is strongly recommended.
              </div>
            </div>
          </>}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "12px", fontSize: "0.56rem", color: "#94A3B8", borderTop: "1px solid #E2E8F0", letterSpacing: "0.1em" }}>
        © ZAMBEZI ANALYTICS 2026 · SA PFAS PREDICTIVE ANALYTICS · DATA: 80 SAMPLES · 18 PEER-REVIEWED STUDIES (2014–2025) · WHO 2022 GUIDELINES · MODELS: LR / GBM / MLP
      </div>
    </div>
  );
}