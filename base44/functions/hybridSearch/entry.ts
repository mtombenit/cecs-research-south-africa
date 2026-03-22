import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── BM25 Implementation ────────────────────────────────────────────────────────
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function buildBM25Index(documents) {
  const k1 = 1.5;
  const b = 0.75;
  const N = documents.length;
  const avgDocLen = documents.reduce((sum, d) => sum + d.tokens.length, 0) / (N || 1);

  // Document frequency per term
  const df = {};
  for (const doc of documents) {
    const seen = new Set(doc.tokens);
    for (const t of seen) {
      df[t] = (df[t] || 0) + 1;
    }
  }

  return { k1, b, N, avgDocLen, df };
}

function bm25Score(queryTokens, docTokens, index) {
  const { k1, b, N, avgDocLen, df } = index;
  const docLen = docTokens.length;
  const tf = {};
  for (const t of docTokens) tf[t] = (tf[t] || 0) + 1;

  let score = 0;
  for (const qt of queryTokens) {
    if (!tf[qt]) continue;
    const idf = Math.log((N - (df[qt] || 0) + 0.5) / ((df[qt] || 0) + 0.5) + 1);
    const tfNorm = (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - b + b * (docLen / avgDocLen)));
    score += idf * tfNorm;
  }
  return score;
}

// ── TF-IDF Vector for semantic similarity (lightweight, no external API) ──────
function buildTFIDF(documents) {
  const N = documents.length;
  const df = {};
  for (const doc of documents) {
    const seen = new Set(doc.tokens);
    for (const t of seen) df[t] = (df[t] || 0) + 1;
  }

  // Compute TF-IDF vectors
  return documents.map(doc => {
    const tf = {};
    for (const t of doc.tokens) tf[t] = (tf[t] || 0) + 1;
    const vec = {};
    for (const [t, count] of Object.entries(tf)) {
      const idf = Math.log(N / ((df[t] || 1)));
      vec[t] = (count / doc.tokens.length) * idf;
    }
    return vec;
  });
}

function cosineSimilarity(vecA, vecB) {
  const keysA = Object.keys(vecA);
  if (keysA.length === 0) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (const k of keysA) {
    const a = vecA[k] || 0;
    const bv = vecB[k] || 0;
    dot += a * bv;
    magA += a * a;
  }
  for (const v of Object.values(vecB)) magB += v * v;

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── Main Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow both user-authenticated and service-role calls (e.g. from agenticRAG)
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      query,
      top_k = 10,
      keyword_weight = 0.4,  // 0.0 = pure semantic, 1.0 = pure keyword
      filters = {},           // e.g. { province, research_type, year_from, year_to }
      include_cec_records = false
    } = await req.json();

    if (!query || query.trim().length === 0) {
      return Response.json({ error: 'query is required' }, { status: 400 });
    }

    const semanticWeight = 1 - keyword_weight;

    // ── Fetch documents ────────────────────────────────────────────────────────
    const [papers, cecRecords] = await Promise.all([
      base44.asServiceRole.entities.ResearchPaper.list('-publication_year', 500),
      include_cec_records
        ? base44.asServiceRole.entities.CECRecord.list('-upload_date', 300)
        : Promise.resolve([])
    ]);

    // ── Build corpus ───────────────────────────────────────────────────────────
    const corpus = [];

    for (const p of papers) {
      // Apply filters
      if (filters.province && p.province !== filters.province) continue;
      if (filters.research_type && p.research_type !== filters.research_type) continue;
      if (filters.year_from && p.publication_year < filters.year_from) continue;
      if (filters.year_to && p.publication_year > filters.year_to) continue;

      const fullText = [
        p.title,
        p.abstract,
        p.key_findings,
        p.authors?.join(' '),
        p.pfas_compounds?.join(' '),
        p.province,
        p.research_type,
        p.sample_matrix?.join(' '),
        p.concentrations_reported,
        p.journal,
        p.keywords?.join(' ')
      ].filter(Boolean).join(' ');

      corpus.push({
        id: p.id,
        type: 'paper',
        source: p,
        fullText,
        tokens: tokenize(fullText),
        snippet: `**${p.title}** (${p.publication_year})\nAuthors: ${p.authors?.join(', ') || 'N/A'}\nProvince: ${p.province || 'N/A'}\nCompounds: ${p.pfas_compounds?.join(', ') || 'N/A'}\nKey Findings: ${p.key_findings?.substring(0, 400) || 'N/A'}\nAbstract: ${p.abstract?.substring(0, 300) || 'N/A'}`
      });
    }

    for (const r of cecRecords) {
      if (filters.province && r.province !== filters.province) continue;

      const fullText = [
        r.contaminant_name,
        r.cec_category,
        r.commonly_known_as,
        r.sampling_site,
        r.province,
        r.water_body_type,
        r.iupac_name,
        r.formula,
        r.data_reference
      ].filter(Boolean).join(' ');

      corpus.push({
        id: r.id,
        type: 'cec_record',
        source: r,
        fullText,
        tokens: tokenize(fullText),
        snippet: `**CEC Record: ${r.contaminant_name}** (${r.cec_category})\nSite: ${r.sampling_site || 'N/A'}\nProvince: ${r.province || 'N/A'}\nConcentration: ${r.concentration_detected || 'N/A'} ${r.unit_of_measure || ''}\nWater Body: ${r.water_body_type || 'N/A'}\nReference: ${r.data_reference || 'N/A'}`
      });
    }

    if (corpus.length === 0) {
      return Response.json({ results: [], total_corpus: 0, query_used: query });
    }

    // ── BM25 Scores ────────────────────────────────────────────────────────────
    const queryTokens = tokenize(query);
    const bm25Index = buildBM25Index(corpus);
    const bm25Scores = corpus.map(doc => bm25Score(queryTokens, doc.tokens, bm25Index));

    // Normalize BM25 scores to [0, 1]
    const maxBM25 = Math.max(...bm25Scores, 0.0001);
    const normBM25 = bm25Scores.map(s => s / maxBM25);

    // ── TF-IDF Semantic Scores ─────────────────────────────────────────────────
    const tfidfVectors = buildTFIDF(corpus);
    
    // Build query vector
    const queryDoc = { tokens: queryTokens };
    const tempCorpus = [...corpus, queryDoc];
    const allVectors = buildTFIDF(tempCorpus.map(d => ({ tokens: d.tokens || queryTokens })));
    const queryVec = allVectors[allVectors.length - 1];

    const semanticScores = tfidfVectors.map((vec, i) => cosineSimilarity(queryVec, vec));

    // Normalize semantic scores
    const maxSemantic = Math.max(...semanticScores, 0.0001);
    const normSemantic = semanticScores.map(s => s / maxSemantic);

    // ── Hybrid Scores ──────────────────────────────────────────────────────────
    const hybridScores = corpus.map((_, i) =>
      keyword_weight * normBM25[i] + semanticWeight * normSemantic[i]
    );

    // ── Rank and Select Top-K ──────────────────────────────────────────────────
    const ranked = corpus
      .map((doc, i) => ({
        ...doc,
        score: hybridScores[i],
        bm25_score: normBM25[i],
        semantic_score: normSemantic[i]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, top_k);

    // ── Return Results ─────────────────────────────────────────────────────────
    return Response.json({
      results: ranked.map(r => ({
        id: r.id,
        type: r.type,
        score: Math.round(r.score * 1000) / 1000,
        bm25_score: Math.round(r.bm25_score * 1000) / 1000,
        semantic_score: Math.round(r.semantic_score * 1000) / 1000,
        snippet: r.snippet
      })),
      total_corpus: corpus.length,
      query_used: query,
      weights_used: { keyword: keyword_weight, semantic: semanticWeight }
    });

  } catch (error) {
    console.error('hybridSearch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});