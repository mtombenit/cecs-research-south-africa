import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import { base44 } from "@/api/base44Client";

// ── LR Model — runs entirely in-browser, no API (only 5KB) ───────────────────
const LR_MODELS = {"Pharmaceuticals & PPCPs":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[0.8904,0.3703,-0.3862,1.4076,-0.6957,0.1572,-1.0001,0.1745],"intercept":-0.3814},"Microplastics":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[0.9308,1.9010,-1.0134,0.9026,-0.2056,-0.4339,1.0011,-0.4671],"intercept":-2.9544},"Polycyclic Aromatic Hydrocarbons":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[0.1822,-0.9097,-0.6505,0.8436,-1.1765,-0.6101,-0.5544,0.5999],"intercept":-1.0515},"Antiretrovirals (ARVs)":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[0.7216,1.6201,0.7616,0.7376,-0.0197,1.3241,-0.2946,-0.3273],"intercept":-4.0151},"Pesticides":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[-0.3206,-0.7574,0.3793,-0.3608,0.3993,-0.2374,0.3730,0.0769],"intercept":-0.2264},"Heavy Metals":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[-0.8983,-0.0776,0.1117,-0.7489,-0.0935,-0.4285,-0.7939,-0.8717],"intercept":-0.7951},"Alkylphenols & APEOs":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[-1.7774,-0.6962,1.1629,-0.0383,0.1766,0.4588,-0.1557,1.0300],"intercept":-2.4012},"Microbial CECs":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[-0.2316,0.1129,0.2732,-0.0397,0.5790,0.4177,-0.5552,0.6837],"intercept":-0.4801},"Nanomaterials":{"scaler":{"mean":[29.284,28.055,2.907,9.091,63.093,0.179,0.086,0.314],"scale":[3.253,3.396,1.590,3.678,20.822,0.383,0.280,0.464]},"coef":[-0.7797,-1.1420,0.7258,-1.6136,0.7533,-0.3551,-0.0416,1.2986],"intercept":-4.0725}};

// ── GBM feature importances — passed to API for GBM/MLP predictions ──────────
const GBM_FI = {"Pharmaceuticals & PPCPs":{"lat_abs":0.328,"lon_val":0.352,"wb_score":0.032,"pop_million":0.176,"urban_pct":0.013,"is_wwtp":0.012,"is_coastal":0.086,"is_surface":0.001},"Microplastics":{"lat_abs":0.153,"lon_val":0.425,"wb_score":0.081,"pop_million":0.102,"urban_pct":0.046,"is_wwtp":0.031,"is_coastal":0.138,"is_surface":0.023},"Polycyclic Aromatic Hydrocarbons":{"lat_abs":0.234,"lon_val":0.289,"wb_score":0.081,"pop_million":0.152,"urban_pct":0.083,"is_wwtp":0.062,"is_coastal":0.053,"is_surface":0.045},"Antiretrovirals (ARVs)":{"lat_abs":0.041,"lon_val":0.582,"wb_score":0.062,"pop_million":0.083,"urban_pct":0.021,"is_wwtp":0.161,"is_coastal":0.031,"is_surface":0.018},"Pesticides":{"lat_abs":0.182,"lon_val":0.213,"wb_score":0.124,"pop_million":0.153,"urban_pct":0.123,"is_wwtp":0.062,"is_coastal":0.072,"is_surface":0.070},"Heavy Metals":{"lat_abs":0.234,"lon_val":0.182,"wb_score":0.153,"pop_million":0.124,"urban_pct":0.083,"is_wwtp":0.092,"is_coastal":0.063,"is_surface":0.068},"Alkylphenols & APEOs":{"lat_abs":0.312,"lon_val":0.234,"wb_score":0.082,"pop_million":0.061,"urban_pct":0.092,"is_wwtp":0.053,"is_coastal":0.043,"is_surface":0.122},"Microbial CECs":{"lat_abs":0.182,"lon_val":0.153,"wb_score":0.124,"pop_million":0.083,"urban_pct":0.163,"is_wwtp":0.112,"is_coastal":0.062,"is_surface":0.120},"Nanomaterials":{"lat_abs":0.213,"lon_val":0.342,"wb_score":0.082,"pop_million":0.123,"urban_pct":0.063,"is_wwtp":0.052,"is_coastal":0.073,"is_surface":0.051}};

// ── CV AUC per model per category (5-fold, 140 SA sites) ─────────────────────
const MODEL_AUCS = {"Pharmaceuticals & PPCPs":{"GBM":0.911,"MLP":0.910,"LR":0.783},"Microplastics":{"GBM":0.962,"MLP":0.947,"LR":0.986},"Polycyclic Aromatic Hydrocarbons":{"GBM":0.544,"MLP":0.415,"LR":0.570},"Antiretrovirals (ARVs)":{"GBM":0.988,"MLP":0.988,"LR":0.963},"Pesticides":{"GBM":0.844,"MLP":0.810,"LR":0.721},"Heavy Metals":{"GBM":0.875,"MLP":0.842,"LR":0.827},"Alkylphenols & APEOs":{"GBM":0.704,"MLP":0.765,"LR":0.580},"Microbial CECs":{"GBM":0.389,"MLP":0.452,"LR":0.244},"Nanomaterials":{"GBM":0.985,"MLP":0.993,"LR":0.985}};

const MODEL_META = {
  LR:  {label:"Logistic Regression", auc:0.740, f1:0.370, acc:0.805, color:"#06B6D4", desc:"Instant in-browser. L2-regularised, balanced classes. Best for Microplastics (AUC 0.986)."},
  GBM: {label:"Gradient Boosting",   auc:0.800, f1:0.422, acc:0.926, color:"#F59E0B", desc:"60 boosted trees, depth-3. Best overall AUC (0.800). Runs via Anthropic API."},
  MLP: {label:"Neural Network (MLP)",auc:0.791, f1:0.395, acc:0.931, color:"#A78BFA", desc:"32→16 ReLU, L2=0.01. Highest accuracy (93.1%). Best for Nanomaterials. Runs via API."},
};
const CATS = Object.keys(MODEL_AUCS);

// ── Config ─────────────────────────────────────────────────────────────────────
const WBT_SCORE  = {"WWTP":5,"Surface Water":4,"Sediment":3,"Marine/Coastal":3,"Groundwater":2,"Agricultural Water":2,"Unclassified":1};
const PROV_POP   = {"KwaZulu-Natal":11.5,"Gauteng":15.2,"Eastern Cape":7.1,"Western Cape":7.2,"North West":4.1,"Free State":3.0,"Mpumalanga":4.7,"Limpopo":5.9,"Northern Cape":1.3,"South Africa (unclassified)":5.0};
const PROV_URBAN = {"KwaZulu-Natal":65,"Gauteng":97,"Eastern Cape":44,"Western Cape":92,"North West":44,"Free State":70,"Mpumalanga":42,"Limpopo":13,"Northern Cape":79,"South Africa (unclassified)":60};
const COASTAL    = new Set(["KwaZulu-Natal","Eastern Cape","Western Cape"]);
const PROVINCES  = Object.keys(PROV_POP);
const CAT_COL    = {"Pharmaceuticals & PPCPs":"#3B82F6","Microplastics":"#7C3AED","Polycyclic Aromatic Hydrocarbons":"#EF4444","Antiretrovirals (ARVs)":"#10B981","Pesticides":"#F59E0B","Heavy Metals":"#6B7280","Alkylphenols & APEOs":"#EC4899","Microbial CECs":"#06B6D4","Nanomaterials":"#84CC16"};
const CAT_SHORT  = {"Pharmaceuticals & PPCPs":"PPCPs","Microplastics":"Microplastics","Polycyclic Aromatic Hydrocarbons":"PAHs","Antiretrovirals (ARVs)":"ARVs","Pesticides":"Pesticides","Heavy Metals":"Heavy Metals","Alkylphenols & APEOs":"APEOs","Microbial CECs":"Microbial CECs","Nanomaterials":"Nanomaterials"};
const HI_PROV    = {"Eastern Cape":{med:12.64,p75:32.35},"KwaZulu-Natal":{med:0.09,p75:3.08},"Gauteng":{med:0.13,p75:0.59},"Western Cape":{med:0.17,p75:0.25},"North West":{med:0.0,p75:0.0},"Free State":{med:0.0,p75:0.0},"Mpumalanga":{med:0.0,p75:0.0},"Limpopo":{med:0.0,p75:0.0},"Northern Cape":{med:null,p75:null},"South Africa (unclassified)":{med:0.14,p75:0.14}};
const HI_WBT     = {"WWTP":{med:2.8,p75:19.68},"Surface Water":{med:1.25,p75:12.64},"Sediment":{med:1.68,p75:2.26},"Marine/Coastal":{med:0.14,p75:0.14},"Groundwater":{med:0.0,p75:0.0},"Agricultural Water":{med:0.0,p75:0.0},"Unclassified":{med:0.03,p75:0.19}};
const DRUG_COL   = {Efavirenz:"#EF4444",Nevirapine:"#3B82F6",Lopinavir:"#F59E0B",Zidovudine:"#A855F7",Lamivudine:"#06B6D4",Raltegravir:"#10B981"};
const DRUG_PNEC  = {Efavirenz:500,Nevirapine:1000,Lopinavir:1500,Zidovudine:20000,Lamivudine:50000,Raltegravir:2000};
const DRUG_RE    = {Efavirenz:1.2,Nevirapine:26.3,Lopinavir:-100,Zidovudine:98.0,Lamivudine:94.1,Raltegravir:84.4};
const DRUG_RISK  = {Efavirenz:"HIGH",Nevirapine:"MODERATE",Lopinavir:"HIGH",Zidovudine:"LOW",Lamivudine:"LOW",Raltegravir:"LOW"};
const RISK_C     = {CRITICAL:"#EF4444",HIGH:"#F59E0B",MODERATE:"#3B82F6",LOW:"#10B981"};
const ARV_TS     = [{year:2004,proj:false,Efavirenz:1.6,Nevirapine:1.2,Lopinavir:0.6,Zidovudine:12.3,Lamivudine:2.8,Raltegravir:0.4},{year:2006,proj:false,Efavirenz:12.3,Nevirapine:9.1,Lopinavir:4.9,Zidovudine:93.1,Lamivudine:21.2,Raltegravir:2.9},{year:2008,proj:false,Efavirenz:18.5,Nevirapine:13.6,Lopinavir:7.3,Zidovudine:138.6,Lamivudine:31.2,Raltegravir:4.8},{year:2010,proj:false,Efavirenz:34.9,Nevirapine:25.7,Lopinavir:13.8,Zidovudine:261.4,Lamivudine:58.9,Raltegravir:9.1},{year:2012,proj:false,Efavirenz:53.4,Nevirapine:39.3,Lopinavir:21.1,Zidovudine:400.2,Lamivudine:90.1,Raltegravir:13.9},{year:2014,proj:false,Efavirenz:69.8,Nevirapine:51.4,Lopinavir:27.6,Zidovudine:523.1,Lamivudine:117.9,Raltegravir:18.2},{year:2016,proj:false,Efavirenz:86.2,Nevirapine:63.5,Lopinavir:34.1,Zidovudine:645.8,Lamivudine:145.5,Raltegravir:22.4},{year:2018,proj:false,Efavirenz:106.7,Nevirapine:78.7,Lopinavir:42.2,Zidovudine:799.4,Lamivudine:180.2,Raltegravir:27.8},{year:2020,proj:false,Efavirenz:121.1,Nevirapine:89.3,Lopinavir:47.9,Zidovudine:908.2,Lamivudine:204.7,Raltegravir:31.6},{year:2022,proj:false,Efavirenz:125.2,Nevirapine:92.3,Lopinavir:49.5,Zidovudine:939.1,Lamivudine:211.6,Raltegravir:32.7},{year:2024,proj:true,Efavirenz:134.4,Nevirapine:99.1,Lopinavir:53.1,Zidovudine:1009.0,Lamivudine:227.4,Raltegravir:35.1},{year:2026,proj:true,Efavirenz:141.6,Nevirapine:104.4,Lopinavir:56.0,Zidovudine:1063.1,Lamivudine:239.5,Raltegravir:37.0},{year:2028,proj:true,Efavirenz:146.7,Nevirapine:108.2,Lopinavir:58.0,Zidovudine:1101.4,Lamivudine:248.2,Raltegravir:38.3},{year:2030,proj:true,Efavirenz:149.8,Nevirapine:110.5,Lopinavir:59.2,Zidovudine:1126.4,Lamivudine:253.9,Raltegravir:39.2},{year:2032,proj:true,Efavirenz:153.8,Nevirapine:113.4,Lopinavir:60.8,Zidovudine:1156.7,Lamivudine:260.7,Raltegravir:40.3},{year:2034,proj:true,Efavirenz:157.1,Nevirapine:115.8,Lopinavir:62.1,Zidovudine:1181.4,Lamivudine:266.3,Raltegravir:41.2},{year:2036,proj:true,Efavirenz:159.9,Nevirapine:117.8,Lopinavir:63.2,Zidovudine:1202.4,Lamivudine:271.0,Raltegravir:41.9},{year:2038,proj:true,Efavirenz:162.2,Nevirapine:119.5,Lopinavir:64.2,Zidovudine:1220.3,Lamivudine:275.1,Raltegravir:42.5},{year:2040,proj:true,Efavirenz:164.1,Nevirapine:120.8,Lopinavir:65.0,Zidovudine:1235.2,Lamivudine:278.4,Raltegravir:43.0}];

// ── Inference ─────────────────────────────────────────────────────────────────
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

function lrPredict(cat, features) {
  const m = LR_MODELS[cat];
  if (!m) return 0;
  const z = m.coef.reduce((s, c, i) => s + c * (features[i] - m.scaler.mean[i]) / m.scaler.scale[i], m.intercept);
  return Math.round(sigmoid(z) * 100);
}

async function apiPredict(modelKey, features) {
  const response = await base44.functions.invoke('predictCEC', {
    model_key: modelKey,
    features: features
  });
  return response.data.predictions;
}

// ── Styles — Light theme ──────────────────────────────────────────────────────
const S = {
  app:   {fontFamily:"Arial,sans-serif",background:"#F1F5F9",minHeight:"100vh",color:"#334155"},
  hdr:   {background:"linear-gradient(135deg,#1E3A5F,#2563EB)",borderBottom:"2px solid #BFDBFE",padding:"20px 28px"},
  body:  {padding:"24px 28px",display:"grid",gridTemplateColumns:"310px 1fr",gap:"24px",alignItems:"start"},
  panel: {background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:"10px",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"},
  ptitle:{fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#2563EB",marginBottom:"12px",borderBottom:"1px solid #E2E8F0",paddingBottom:"7px"},
  field: {marginBottom:"13px"},
  label: {fontSize:"0.62rem",color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"4px",display:"block"},
  sel:   {width:"100%",background:"#F8FAFC",border:"1px solid #CBD5E1",color:"#334155",padding:"7px 9px",borderRadius:"6px",fontSize:"0.78rem",fontFamily:"Arial,sans-serif",outline:"none"},
  inp:   {width:"100%",background:"#F8FAFC",border:"1px solid #CBD5E1",color:"#334155",padding:"7px 9px",borderRadius:"6px",fontSize:"0.78rem",fontFamily:"Arial,sans-serif",outline:"none",boxSizing:"border-box"},
  card:  {background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:"8px",padding:"14px",marginBottom:"14px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"},
  ctag:  (c) => ({background:c,color:"white",padding:"2px 7px",borderRadius:"4px",fontSize:"0.58rem",fontWeight:"700"}),
  badge: (c) => ({display:"inline-block",padding:"2px 7px",borderRadius:"4px",fontSize:"0.58rem",fontWeight:"700",background:c+"18",color:c,border:`1px solid ${c}55`}),
  hint:  {fontSize:"0.61rem",color:"#64748B",marginTop:"3px"},
};

function getRisk(hi) {
  if (hi===null||hi===undefined) return {level:"UNKNOWN",c:"#64748B"};
  if (hi>10) return {level:"CRITICAL",c:RISK_C.CRITICAL};
  if (hi>3)  return {level:"HIGH",c:RISK_C.HIGH};
  if (hi>1)  return {level:"MODERATE",c:RISK_C.MODERATE};
  return {level:"LOW",c:RISK_C.LOW};
}

function ProbBar({pct,color,label}) {
  const c = pct>70?RISK_C.CRITICAL:pct>45?RISK_C.HIGH:pct>25?RISK_C.MODERATE:"#94A3B8";
  return (
    <div style={{marginBottom:"7px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"2px"}}>
        <span style={{fontSize:"0.7rem",color:"#64748B"}}>{label}</span>
        <span style={{fontSize:"0.7rem",fontWeight:"700",color:pct>20?c:"#64748B"}}>{pct}%</span>
      </div>
      <div style={{background:"#334155",borderRadius:"3px",height:"4px",overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:"3px",transition:"width 0.5s ease"}}/>
      </div>
    </div>
  );
}

export default function ARCWRCCECs() {
  const [form, setForm] = useState({province:"KwaZulu-Natal",wbt:"Surface Water",lat:-29.8,lon:30.9,is_wwtp:false,is_coastal:false,is_surface:true});
  const [modelKey, setModelKey] = useState("LR");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const buildFeatures = () => {
    const {province,wbt,lat,lon,is_wwtp,is_coastal,is_surface} = form;
    return [Math.abs(parseFloat(lat)||0), parseFloat(lon)||0, WBT_SCORE[wbt]||1, PROV_POP[province]||5, PROV_URBAN[province]||50, is_wwtp?1:0, is_coastal?1:0, is_surface?1:0];
  };

  const run = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const features = buildFeatures();
      let clf = {};
      if (modelKey === "LR") {
        CATS.forEach(cat => { clf[cat] = lrPredict(cat, features); });
      } else {
        clf = await apiPredict(modelKey, features);
      }
      const {province,wbt,is_wwtp,is_coastal} = form;
      const pH = HI_PROV[province]; const wH = HI_WBT[wbt];
      const hiEst = pH?.med !== null && pH?.med !== undefined
        ? Math.round(((pH.med*0.5)+(wH?.med||0)*0.5)*(is_wwtp?2.5:is_coastal?0.4:1.0)*10)/10
        : null;
      const hiRange = pH?.med !== null ? {lo:Math.round(((pH?.med||0)*0.3+(wH?.med||0)*0.3)*10)/10,hi:Math.round(((pH?.p75||0)*0.6+(wH?.p75||0)*0.6)*10)/10} : null;
      const arvScale = province==="KwaZulu-Natal"?1.0:province==="Gauteng"?0.8:province==="Eastern Cape"?0.6:0.3;
      setResults({clf,hiEst,hiRange,arvScale,province,wbt,is_wwtp,modelKey});
    } catch(e) {
      setError("Error: "+e.message);
    }
    setLoading(false);
  };

  const WBT_OPTS = ["Surface Water","WWTP","Sediment","Marine/Coastal","Groundwater","Agricultural Water","Unclassified"];

  return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{fontSize:"1.4rem",fontWeight:"700",color:"#60A5FA"}}>SA CEC — Interactive Site Predictor</div>
        <div style={{fontSize:"0.62rem",color:"#BFDBFE",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:"3px"}}>Configure site · Select ML model · Run 3 analytical predictions</div>
      </div>

      <div style={S.body}>
        {/* LEFT */}
        <div>
          <div style={S.panel}>
            <div style={S.ptitle}>📍 Site Characteristics</div>

            <div style={S.field}>
              <label style={S.label}>Province</label>
              <select style={S.sel} value={form.province} onChange={e=>{
                const p=e.target.value;
                if(!COASTAL.has(p)&&form.wbt==="Marine/Coastal") setForm(f=>({...f,province:p,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}));
                else setForm(f=>({...f,province:p,is_coastal:COASTAL.has(p)?f.is_coastal:false}));
              }}>
                {PROVINCES.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Water Body Type</label>
              <select style={S.sel} value={form.wbt} onChange={e=>{
                const v=e.target.value;
                setForm(f=>({...f,wbt:v,is_wwtp:v==="WWTP",is_coastal:v==="Marine/Coastal",is_surface:v==="Surface Water"}));
              }}>
                {WBT_OPTS.filter(w=>w!=="Marine/Coastal"||COASTAL.has(form.province)).map(w=><option key={w}>{w}</option>)}
              </select>
              {!COASTAL.has(form.province)&&<div style={{...S.hint,color:"#F59E0B"}}>⚠ Marine/Coastal unavailable — landlocked province</div>}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              <div style={S.field}>
                <label style={S.label}>Latitude (°S)</label>
                <input style={S.inp} type="number" step="0.01" value={form.lat} onChange={e=>set("lat",e.target.value)}/>
                <div style={S.hint}>e.g. –29.85 (Durban)</div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Longitude (°E)</label>
                <input style={S.inp} type="number" step="0.01" value={form.lon} onChange={e=>set("lon",e.target.value)}/>
                <div style={S.hint}>e.g. 30.98</div>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Site Flags</label>
              {[["is_wwtp","WWTP site"],["is_coastal","Coastal / Marine"],["is_surface","Surface Water body"]].map(([k,lbl])=>{
                const dis=k==="is_coastal"&&!COASTAL.has(form.province);
                return (
                  <label key={k} style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"5px",cursor:dis?"not-allowed":"pointer",opacity:dis?0.3:1}}>
                    <input type="checkbox" checked={form[k]} disabled={dis} onChange={e=>set(k,e.target.checked)} style={{accentColor:"#2563EB"}}/>
                    <span style={{fontSize:"0.72rem",color:"#64748B"}}>{lbl}{dis?" (landlocked)":""}</span>
                  </label>
                );
              })}
            </div>

            {/* Features being used */}
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:"6px",padding:"10px 14px"}}>
              <div style={{fontSize:"0.58rem",letterSpacing:"0.13em",textTransform:"uppercase",color:"#94A3B8",marginBottom:"8px"}}>Features Being Used</div>
              {[
                ["lat_abs",    Math.abs(parseFloat(form.lat)||0).toFixed(2)],
                ["lon_val",    (parseFloat(form.lon)||0).toFixed(2)],
                ["wb_score",   WBT_SCORE[form.wbt]||1],
                ["pop_million",PROV_POP[form.province]||5],
                ["urban_pct",  PROV_URBAN[form.province]||50],
                ["is_wwtp",    form.is_wwtp?1:0],
                ["is_coastal", form.is_coastal?1:0],
                ["is_surface", form.is_surface?1:0],
              ].map(([k,v],i,arr)=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<arr.length-1?"1px solid #EEF2F7":"none"}}>
                  <span style={{fontSize:"0.72rem",color:"#2563EB",fontFamily:"monospace"}}>{k}</span>
                  <span style={{fontSize:"0.72rem",color:"#1E293B",fontWeight:"600",fontFamily:"monospace"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Classifier selector */}
          <div style={{...S.panel,marginTop:"14px"}}>
            <div style={S.ptitle}>🤖 Classifier (Model 2)</div>
            <div style={{fontSize:"0.61rem",color:"#64748B",marginBottom:"10px",lineHeight:1.5}}>LR runs instantly in-browser. GBM and MLP call the Anthropic API.</div>
            {Object.entries(MODEL_META).map(([key,m])=>{
              const sel=modelKey===key;
              const aC=m.auc>=0.79?"#10B981":m.auc>=0.75?"#F59E0B":"#EF4444";
              return (
                <div key={key} onClick={()=>setModelKey(key)}
                  style={{border:`1px solid ${sel?m.color:"#334155"}`,borderRadius:"7px",padding:"10px",marginBottom:"7px",cursor:"pointer",background:sel?"#EFF6FF":"#F8FAFC"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3px"}}>
                    <span style={{fontSize:"0.75rem",fontWeight:"700",color:sel?m.color:"#64748B"}}>{m.label}</span>
                    <div style={{display:"flex",gap:"6px"}}>
                      {sel&&<span style={{fontSize:"0.55rem",background:m.color,color:"white",padding:"1px 5px",borderRadius:"3px",fontWeight:"700"}}>ACTIVE</span>}
                      <span style={{fontSize:"0.65rem",fontWeight:"700",color:aC}}>AUC {m.auc.toFixed(3)}</span>
                    </div>
                  </div>
                  <div style={{fontSize:"0.6rem",color:"#64748B",marginBottom:"6px"}}>{m.desc}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 8px"}}>
                    {CATS.map(cat=>{
                      const auc=MODEL_AUCS[cat]?.[key];
                      const ac=!auc?"#94A3B8":auc>=0.85?"#10B981":auc>=0.70?"#F59E0B":"#EF4444";
                      return (
                        <div key={cat} style={{display:"flex",alignItems:"center",gap:"4px"}}>
                          <span style={{fontSize:"0.55rem",color:"#64748B",minWidth:"40px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{CAT_SHORT[cat]}</span>
                          <div style={{flex:1,background:"#334155",borderRadius:"2px",height:"3px"}}>
                            {auc&&<div style={{width:`${auc*100}%`,height:"100%",background:ac,borderRadius:"2px"}}/>}
                          </div>
                          <span style={{fontSize:"0.55rem",color:ac,minWidth:"24px",textAlign:"right"}}>{auc?auc.toFixed(2):"—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              disabled={loading}
              onClick={run}
              style={{width:"100%",padding:"10px",background:loading?"#334155":"linear-gradient(135deg,#1D4ED8,#2563EB)",color:loading?"#64748B":"white",border:"none",borderRadius:"6px",fontSize:"0.78rem",fontWeight:"700",cursor:loading?"not-allowed":"pointer",fontFamily:"Arial,sans-serif",marginTop:"4px"}}>
              {loading?"⏳  Running…":`▶  Run with ${MODEL_META[modelKey].label}`}
            </button>
            {error&&<div style={{marginTop:"8px",fontSize:"0.63rem",color:RISK_C.CRITICAL,background:"#FEF2F2",border:"1px solid #FECACA",padding:"7px 10px",borderRadius:"5px"}}>{error}</div>}
          </div>

          {/* Quick-fill */}
          <div style={{...S.panel,marginTop:"14px"}}>
            <div style={S.ptitle}>⚡ Quick-fill</div>
            {[["Durban (KZN)",{province:"KwaZulu-Natal",lat:-29.85,lon:30.98,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],["Johannesburg (GP)",{province:"Gauteng",lat:-26.2,lon:28.04,wbt:"WWTP",is_wwtp:true,is_coastal:false,is_surface:false}],["Cape Town (WC)",{province:"Western Cape",lat:-33.93,lon:18.42,wbt:"Marine/Coastal",is_wwtp:false,is_coastal:true,is_surface:false}],["Grahamstown (EC)",{province:"Eastern Cape",lat:-33.3,lon:26.52,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],["Kimberley (NC)",{province:"Northern Cape",lat:-28.74,lon:24.77,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],["Nelspruit (MP)",{province:"Mpumalanga",lat:-25.47,lon:30.97,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}]].map(([lbl,v])=>(
              <button key={lbl} onClick={()=>setForm(f=>({...f,...v}))}
                style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"1px solid #E2E8F0",color:"#64748B",padding:"6px 9px",borderRadius:"5px",fontSize:"0.68rem",cursor:"pointer",marginBottom:"5px",fontFamily:"Arial,sans-serif"}}
                onMouseOver={e=>{e.currentTarget.style.borderColor="#2563EB";e.currentTarget.style.color="#2563EB"}}
                onMouseOut={e=>{e.currentTarget.style.borderColor="#334155";e.currentTarget.style.color="#64748B"}}
              >↗ {lbl}</button>
            ))}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div>
          {!results&&!loading&&(
            <div style={{...S.card,textAlign:"center",padding:"60px 20px",border:"1px dashed #CBD5E1"}}>
              <div style={{fontSize:"2.5rem",marginBottom:"12px"}}>🔬</div>
              <div style={{fontSize:"0.95rem",color:"#1D4ED8",fontWeight:"700",marginBottom:"6px"}}>Configure your site and run predictions</div>
              <div style={{fontSize:"0.7rem",color:"#64748B",lineHeight:1.7}}>Set province, water body type and coordinates,<br/>select a classifier, then click ▶ Run.</div>
            </div>
          )}
          {loading&&(
            <div style={{...S.card,textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:"2rem",marginBottom:"12px",animation:"spin 1s linear infinite"}}>⚙️</div>
              <div style={{fontSize:"0.9rem",color:"#1D4ED8",fontWeight:"700"}}>{modelKey==="LR"?"Computing in-browser…":"Calling Anthropic API…"}</div>
              <div style={{fontSize:"0.65rem",color:"#64748B",marginTop:"5px"}}>{MODEL_META[modelKey].label} · Please wait</div>
            </div>
          )}

          {results&&!loading&&<>
            {/* Model 1: HI */}
            <div style={S.card}>
              <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#3B82F6",marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={S.ctag("#1D4ED8")}>MODEL 1</span> Mixture Hazard Index Estimate
              </div>
              {results.hiEst===null?(
                <div style={{fontSize:"0.7rem",color:"#F59E0B"}}>⚠ No HI reference data for {results.province} — zero monitoring records (critical monitoring gap).</div>
              ):(()=>{
                const {level,c}=getRisk(results.hiEst);
                return <>
                  <div style={{display:"flex",alignItems:"flex-end",gap:"14px",marginBottom:"10px"}}>
                    <div>
                      <div style={{fontSize:"0.58rem",color:"#64748B",textTransform:"uppercase",letterSpacing:"0.1em"}}>Estimated HI</div>
                      <div style={{fontSize:"2.5rem",fontWeight:"700",color:c,lineHeight:1}}>{results.hiEst}</div>
                    </div>
                    <div>
                      <span style={S.badge(c)}>{level} RISK</span>
                      {results.hiRange&&<div style={{fontSize:"0.63rem",color:"#64748B",marginTop:"4px"}}>Range: {results.hiRange.lo}–{results.hiRange.hi}</div>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"8px"}}>
                    {[["<1","LOW",RISK_C.LOW],["1–3","MOD",RISK_C.MODERATE],["3–10","HIGH",RISK_C.HIGH],[">10","CRIT",RISK_C.CRITICAL]].map(([r,l,col])=>{
                      const on=(r==="<1"&&results.hiEst<=1)||(r==="1–3"&&results.hiEst>1&&results.hiEst<=3)||(r==="3–10"&&results.hiEst>3&&results.hiEst<=10)||(r===">10"&&results.hiEst>10);
                      return <div key={r} style={{background:col+"11",border:`1px solid ${col}44`,borderRadius:"4px",padding:"5px",textAlign:"center",opacity:on?1:0.3}}>
                        <div style={{fontSize:"0.7rem",fontWeight:"700",color:col}}>{r}</div>
                        <div style={{fontSize:"0.56rem",color:col}}>{l}</div>
                      </div>;
                    })}
                  </div>
                  <div style={{fontSize:"0.63rem",color:"#64748B",lineHeight:1.6}}><strong style={{color:"#64748B"}}>Basis:</strong> Median HI at {results.province} sites ({HI_PROV[results.province]?.med??'N/A'}) and {results.wbt} ({HI_WBT[results.wbt]?.med??'N/A'}), blended 50/50{results.is_wwtp?" with 2.5× WWTP multiplier.":"."}</div>
                </>;
              })()}
            </div>

            {/* Model 2: Classifier */}
            <div style={S.card}>
              <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#3B82F6",marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={S.ctag("#7C3AED")}>MODEL 2</span>
                CEC Detection Probability — {MODEL_META[results.modelKey].label}
                <span style={{marginLeft:"auto",fontSize:"0.58rem",color:"#64748B"}}>AUC <strong style={{color:"#10B981"}}>{MODEL_META[results.modelKey].auc.toFixed(3)}</strong></span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"10px"}}>
                <div>{CATS.slice(0,5).map(c=><ProbBar key={c} pct={results.clf[c]||0} color={CAT_COL[c]} label={CAT_SHORT[c]}/>)}</div>
                <div>{CATS.slice(5).map(c=><ProbBar key={c} pct={results.clf[c]||0} color={CAT_COL[c]} label={CAT_SHORT[c]}/>)}</div>
              </div>
              {(()=>{
                const sorted=CATS.map(c=>({c,p:results.clf[c]||0})).sort((a,b)=>b.p-a.p);
                const top=sorted.slice(0,3); const high=sorted.filter(x=>x.p>60);
                return <div style={{background:"#F8FAFC",borderRadius:"5px",padding:"9px 11px",fontSize:"0.67rem",color:"#64748B",lineHeight:1.8}}>
                  <strong style={{color:"#60A5FA"}}>Top detections:</strong>{" "}
                  {top.map(x=><span key={x.c} style={{color:CAT_COL[x.c],fontWeight:"700"}}>{CAT_SHORT[x.c]} ({x.p}%) </span>)}
                  {high.length>0&&<><br/><strong style={{color:"#EF4444"}}>⚠ High probability (&gt;60%):</strong>{" "}{high.map(x=><span key={x.c} style={{color:CAT_COL[x.c]}}>{CAT_SHORT[x.c]} </span>)}</>}
                  {results.clf["Antiretrovirals (ARVs)"]>30&&results.province==="KwaZulu-Natal"&&<><br/><span style={{color:"#10B981"}}>↑ ARV signal elevated — consistent with KZN treatment catchment.</span></>}
                </div>;
              })()}
            </div>

            {/* Model 3: ARV Forecast */}
            <div style={S.card}>
              <div style={{fontSize:"0.6rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#3B82F6",marginBottom:"10px",display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={S.ctag("#059669")}>MODEL 3</span> ARV Environmental Loading Forecast 2004–2040
              </div>
              <div style={{fontSize:"0.62rem",color:"#64748B",marginBottom:"10px",lineHeight:1.5}}>
                Receiving water concentrations (ng/L) scaled to {results.province} ({Math.round(results.arvScale*100)}% of KZN baseline). Solid = historical · Dashed = projected.
              </div>
              {results.arvScale<0.5&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:"5px",padding:"7px 10px",marginBottom:"10px",fontSize:"0.63rem",color:"#F59E0B"}}>⚠ {results.province} ART load lower than KZN — concentrations scaled down proportionally.</div>}

              {(()=>{
                const scaled=ARV_TS.map(r=>{const o={year:r.year,proj:r.proj};Object.keys(DRUG_COL).forEach(d=>{o[d]=Math.round((r[d]||0)*results.arvScale*10)/10;});return o;});
                const hist=scaled.filter(d=>!d.proj);
                const proj=scaled.filter(d=>d.proj);
                const bi=scaled.findIndex(d=>d.proj)-1;
                const pb=bi>=0?[scaled[bi],...proj]:proj;
                const Tip=({active,payload,label})=>{
                  if(!active||!payload?.length)return null;
                  return <div style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:"5px",padding:"8px 11px",fontSize:"0.63rem"}}>
                    <div style={{color:"#1D4ED8",fontWeight:"700",marginBottom:"4px"}}>{label}{payload[0]?.payload?.proj?" (projected)":""}</div>
                    {payload.map(p=><div key={p.dataKey} style={{color:DRUG_COL[p.dataKey]||"#64748B"}}>{p.dataKey}: <strong>{p.value}</strong> ng/L{DRUG_PNEC[p.dataKey]?<span style={{color:"#64748B",fontSize:"0.58rem"}}> / PNEC {DRUG_PNEC[p.dataKey].toLocaleString()}</span>:null}</div>)}
                  </div>;
                };
                return <div style={{marginBottom:"14px"}}>
                  <ResponsiveContainer width="100%" height={265}>
                    <LineChart margin={{left:6,right:16,top:4,bottom:2}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
                      <XAxis dataKey="year" type="number" domain={[2004,2040]} tickCount={10} tick={{fill:"#64748B",fontSize:9}} tickFormatter={v=>String(v)}/>
                      <YAxis tick={{fill:"#64748B",fontSize:9}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} label={{value:"ng/L",angle:-90,position:"insideLeft",fill:"#64748B",fontSize:8,dx:-2}}/>
                      <Tooltip content={<Tip/>}/>
                      <Legend wrapperStyle={{fontSize:"0.6rem",paddingTop:"5px"}} formatter={v=><span style={{color:DRUG_COL[v]||"#64748B"}}>{v}</span>}/>
                      <ReferenceLine y={DRUG_PNEC.Efavirenz*results.arvScale} stroke="#EF4444" strokeDasharray="5 3" strokeWidth={1} label={{value:"EFV PNEC",fill:"#EF444488",fontSize:8,position:"insideTopRight"}}/>
                      {Object.keys(DRUG_COL).map(d=><Line key={"h"+d} data={hist} dataKey={d} name={d} stroke={DRUG_COL[d]} strokeWidth={2} dot={false} legendType="none"/>)}
                      {Object.keys(DRUG_COL).map(d=><Line key={"p"+d} data={pb} dataKey={d} name={d} stroke={DRUG_COL[d]} strokeWidth={2} strokeDasharray="6 3" dot={p=>{if(p.payload.year!==2040)return null;return <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill={DRUG_COL[d]} stroke="none"/>;}}/>)}
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{fontSize:"0.57rem",color:"#94A3B8",textAlign:"right",marginTop:"1px"}}>Last observed: 2022. Projection assumes NSP 2023–2028 ART targets with plateau from ~2032.</div>
                </div>;
              })()}

              <div style={{fontSize:"0.6rem",color:"#64748B",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"6px"}}>2040 Projection Summary</div>
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",width:"100%",fontSize:"0.63rem"}}>
                  <thead>
                    <tr style={{background:"#334155"}}>
                      {["Drug","Removal","2022","2030","2040","PNEC","HQ-2040","Risk"].map(h=><th key={h} style={{padding:"6px 8px",color:"#64748B",fontWeight:"600",textAlign:"left",whiteSpace:"nowrap",borderBottom:"1px solid #E2E8F0"}}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(DRUG_COL).map((drug,i)=>{
                      const g=y=>Math.round((ARV_TS.find(r=>r.year===y)?.[drug]||0)*results.arvScale*10)/10;
                      const c40=g(2040),pnec=DRUG_PNEC[drug],re=DRUG_RE[drug];
                      const hq=(c40/pnec).toFixed(3),hqN=parseFloat(hq);
                      const hqC=hqN>1?RISK_C.CRITICAL:hqN>0.3?RISK_C.HIGH:RISK_C.LOW;
                      const reC=re<0?RISK_C.CRITICAL:re>80?RISK_C.LOW:RISK_C.HIGH;
                      return <tr key={drug} style={{background:i%2===0?"#F8FAFC":"#FFFFFF"}}>
                        <td style={{padding:"6px 8px",fontWeight:"700",color:DRUG_COL[drug]}}>{drug}</td>
                        <td style={{padding:"6px 8px",color:reC,fontWeight:"600"}}>{re<0?`${re}% ⚠`:`${re}%`}</td>
                        <td style={{padding:"6px 8px",textAlign:"right",color:"#64748B"}}>{g(2022)}</td>
                        <td style={{padding:"6px 8px",textAlign:"right",color:"#64748B"}}>{g(2030)}</td>
                        <td style={{padding:"6px 8px",textAlign:"right",fontWeight:"700",color:"#0F172A"}}>{c40}</td>
                        <td style={{padding:"6px 8px",textAlign:"right",color:"#64748B"}}>{pnec.toLocaleString()}</td>
                        <td style={{padding:"6px 8px",textAlign:"center",fontWeight:"700",color:hqC}}>{hq}</td>
                        <td style={{padding:"6px 8px"}}><span style={S.badge(RISK_C[DRUG_RISK[drug]])}>{DRUG_RISK[drug]}</span></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:"10px",background:"#F8FAFC",borderRadius:"5px",padding:"9px 11px",fontSize:"0.63rem",color:"#64748B",lineHeight:1.7}}>
                <strong style={{color:"#60A5FA"}}>2040 outlook — {results.province}:</strong>{" "}
                {results.arvScale>=0.9?"Efavirenz reaches ~164 ng/L (33% of PNEC). Without WWTP upgrades, breach projected before 2045. Lopinavir's negative removal is a unique risk requiring urgent investigation."
                  :results.arvScale>=0.6?"Moderate ARV load projected. Efavirenz and Nevirapine are priority compounds given poor WWTP removal. Province-level monitoring critically needed."
                  :"Lower ARV concentrations than KZN. However, Efavirenz and Lopinavir resist treatment and will remain detectable at any WWTP discharge point through 2040."}
              </div>
            </div>
          </>}
        </div>
      </div>
      <div style={{textAlign:"center",padding:"12px",fontSize:"0.56rem",color:"#94A3B8",borderTop:"1px solid #E2E8F0",letterSpacing:"0.1em"}}>
        © ZAMBEZI ANALYTICS 2026 · SA CEC PREDICTIVE ANALYTICS · MODELS: MIXTURE HI · {results?.modelKey||"LR/GBM/MLP"} CLASSIFIER · ARV MASS BALANCE FORECAST 2040
      </div>
    </div>
  );
}