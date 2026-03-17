import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── BM25 ──────────────────────────────────────────────────────────────────────
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
}

function buildBM25Index(corpus) {
  const k1 = 1.5, b = 0.75, N = corpus.length;
  const avgDocLen = corpus.reduce((s, d) => s + d.tokens.length, 0) / (N || 1);
  const df = {};
  for (const doc of corpus) {
    for (const t of new Set(doc.tokens)) df[t] = (df[t] || 0) + 1;
  }
  return { k1, b, N, avgDocLen, df };
}

function bm25Score(queryTokens, docTokens, idx) {
  const { k1, b, N, avgDocLen, df } = idx;
  const tf = {};
  for (const t of docTokens) tf[t] = (tf[t] || 0) + 1;
  let score = 0;
  for (const qt of queryTokens) {
    if (!tf[qt]) continue;
    const idf = Math.log((N - (df[qt] || 0) + 0.5) / ((df[qt] || 0) + 0.5) + 1);
    const tfN = (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - b + b * (docTokens.length / avgDocLen)));
    score += idf * tfN;
  }
  return score;
}

// ── TF-IDF Cosine ─────────────────────────────────────────────────────────────
function buildTFIDFVectors(tokensList) {
  const N = tokensList.length;
  const df = {};
  for (const tokens of tokensList) {
    for (const t of new Set(tokens)) df[t] = (df[t] || 0) + 1;
  }
  return tokensList.map(tokens => {
    const tf = {};
    for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
    const vec = {};
    for (const [t, count] of Object.entries(tf)) {
      vec[t] = (count / (tokens.length || 1)) * Math.log(N / (df[t] || 1));
    }
    return vec;
  });
}

function cosine(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (const k of Object.keys(a)) {
    dot += (a[k] || 0) * (b[k] || 0);
    ma += a[k] * a[k];
  }
  for (const v of Object.values(b)) mb += v * v;
  const d = Math.sqrt(ma) * Math.sqrt(mb);
  return d === 0 ? 0 : dot / d;
}

// ── Hybrid Search Core ────────────────────────────────────────────────────────
async function hybridSearch(base44, { query, top_k = 10, keyword_weight = 0.4, filters = {}, include_cec_records = false }) {
  const semanticWeight = 1 - keyword_weight;

  const [papers, cecRecords] = await Promise.all([
    base44.asServiceRole.entities.ResearchPaper.list('-publication_year', 500),
    include_cec_records
      ? base44.asServiceRole.entities.CECRecord.list('-upload_date', 300)
      : Promise.resolve([])
  ]);

  const corpus = [];

  for (const p of papers) {
    if (filters.province && p.province !== filters.province) continue;
    if (filters.research_type && p.research_type !== filters.research_type) continue;
    if (filters.year_from && p.publication_year < filters.year_from) continue;
    if (filters.year_to && p.publication_year > filters.year_to) continue;

    const fullText = [p.title, p.abstract, p.key_findings, p.authors?.join(' '),
      p.pfas_compounds?.join(' '), p.province, p.research_type, p.sample_matrix?.join(' '),
      p.concentrations_reported, p.journal, p.keywords?.join(' ')].filter(Boolean).join(' ');

    corpus.push({
      id: p.id, type: 'paper', fullText, tokens: tokenize(fullText),
      snippet: `**${p.title}** (${p.publication_year})\nAuthors: ${p.authors?.join(', ') || 'N/A'}\nProvince: ${p.province || 'N/A'}\nCompounds: ${p.pfas_compounds?.join(', ') || 'N/A'}\nKey Findings: ${p.key_findings?.substring(0, 400) || 'N/A'}\nAbstract: ${p.abstract?.substring(0, 300) || 'N/A'}`
    });
  }

  for (const r of cecRecords) {
    if (filters.province && r.province !== filters.province) continue;
    const fullText = [r.contaminant_name, r.cec_category, r.commonly_known_as,
      r.sampling_site, r.province, r.water_body_type, r.iupac_name, r.formula, r.data_reference].filter(Boolean).join(' ');
    corpus.push({
      id: r.id, type: 'cec_record', fullText, tokens: tokenize(fullText),
      snippet: `**CEC: ${r.contaminant_name}** (${r.cec_category})\nSite: ${r.sampling_site || 'N/A'}\nProvince: ${r.province || 'N/A'}\nConcentration: ${r.concentration_detected || 'N/A'} ${r.unit_of_measure || ''}\nWater Body: ${r.water_body_type || 'N/A'}`
    });
  }

  if (corpus.length === 0) return { results: [], total_corpus: 0 };

  const queryTokens = tokenize(query);
  const bm25Idx = buildBM25Index(corpus);
  const rawBM25 = corpus.map(d => bm25Score(queryTokens, d.tokens, bm25Idx));
  const maxBM25 = Math.max(...rawBM25, 0.0001);
  const normBM25 = rawBM25.map(s => s / maxBM25);

  const allTokensList = [...corpus.map(d => d.tokens), queryTokens];
  const tfidfVecs = buildTFIDFVectors(allTokensList);
  const queryVec = tfidfVecs[tfidfVecs.length - 1];
  const rawSemantic = corpus.map((_, i) => cosine(queryVec, tfidfVecs[i]));
  const maxSemantic = Math.max(...rawSemantic, 0.0001);
  const normSemantic = rawSemantic.map(s => s / maxSemantic);

  const hybridScores = corpus.map((_, i) => keyword_weight * normBM25[i] + semanticWeight * normSemantic[i]);

  const ranked = corpus
    .map((d, i) => ({ ...d, score: hybridScores[i], bm25_score: normBM25[i], semantic_score: normSemantic[i] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, top_k);

  return {
    results: ranked,
    total_corpus: corpus.length
  };
}

// ── Agentic RAG Orchestrator ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      user_query,
      conversation_history = [],
      selected_paper_ids = [],
      max_iterations = 3
    } = await req.json();

    if (!user_query?.trim()) {
      return Response.json({ error: 'user_query is required' }, { status: 400 });
    }

    // ── Step 1: Agent plans search strategy ───────────────────────────────────
    const strategyResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert research agent for a South African CEC and PFAS research database.

Analyse this user question and return ONLY valid JSON (no markdown):
"${user_query}"

Return:
{
  "rewritten_query": "expanded query with synonyms and full terms",
  "keyword_weight": 0.0-1.0 (HIGH 0.7+ for specific names/IDs/acronyms, LOW 0.2 for conceptual),
  "filters": { "province": "...", "research_type": "...", "year_from": N, "year_to": N },
  "include_cec_records": boolean,
  "top_k": 5-20,
  "search_intent": "factual_lookup|synthesis|comparison|trend_analysis|compound_specific",
  "reasoning": "brief explanation"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          rewritten_query: { type: "string" },
          keyword_weight: { type: "number" },
          filters: { type: "object" },
          include_cec_records: { type: "boolean" },
          top_k: { type: "number" },
          search_intent: { type: "string" },
          reasoning: { type: "string" }
        },
        required: ["rewritten_query", "keyword_weight", "filters", "include_cec_records", "top_k", "search_intent", "reasoning"]
      }
    });

    const strategy = strategyResult;
    const steps = [
      `🔍 **Strategy**: ${strategy.search_intent} | keyword: ${Math.round((strategy.keyword_weight || 0.4) * 100)}% | semantic: ${Math.round((1 - (strategy.keyword_weight || 0.4)) * 100)}%`,
      `✏️ **Query rewrite**: "${strategy.rewritten_query || user_query}"`,
      `💡 ${strategy.reasoning || 'Hybrid search initiated'}`
    ];

    // ── Step 2: First hybrid search ───────────────────────────────────────────
    const searchParams = {
      query: strategy.rewritten_query || user_query,
      top_k: Math.min(Math.max(strategy.top_k || 10, 5), 20),
      keyword_weight: Math.min(Math.max(strategy.keyword_weight || 0.4, 0), 1),
      filters: selected_paper_ids.length > 0 ? {} : (strategy.filters || {}),
      include_cec_records: strategy.include_cec_records || false
    };

    let { results: searchResults, total_corpus } = await hybridSearch(base44, searchParams);
    steps.push(`📚 **Retrieved**: ${searchResults.length} documents from ${total_corpus} total`);

    let allChunks = [...searchResults];
    let iteration = 1;

    // ── Step 3: Iterative refinement ──────────────────────────────────────────
    while (iteration < max_iterations && searchResults.length > 0) {
      const topSnippets = searchResults.slice(0, 5).map(r => r.snippet).join('\n\n---\n\n');

      const sufficiency = await base44.integrations.Core.InvokeLLM({
        prompt: `Evaluate if these documents are sufficient to answer: "${user_query}"

Top documents:
${topSnippets}

Return JSON only:
{
  "is_sufficient": boolean,
  "refinement_needed": boolean,
  "refined_query": "alternative search query for missing aspects",
  "refined_keyword_weight": 0.0-1.0,
  "missing_aspects": "what's missing"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            is_sufficient: { type: "boolean" },
            refinement_needed: { type: "boolean" },
            refined_query: { type: "string" },
            refined_keyword_weight: { type: "number" },
            missing_aspects: { type: "string" }
          },
          required: ["is_sufficient", "refinement_needed", "refined_query", "refined_keyword_weight", "missing_aspects"]
        }
      });

      if (!sufficiency.refinement_needed || sufficiency.is_sufficient) {
        steps.push(`✅ **Coverage good** — proceeding to synthesis`);
        break;
      }

      steps.push(`🔄 **Refining** (iteration ${iteration + 1}): "${sufficiency.refined_query}"`);

      const refined = await hybridSearch(base44, {
        query: sufficiency.refined_query,
        top_k: 8,
        keyword_weight: Math.min(Math.max(sufficiency.refined_keyword_weight || 0.5, 0), 1),
        filters: {},
        include_cec_records: strategy.include_cec_records || false
      });

      const existingIds = new Set(allChunks.map(r => r.id));
      const newDocs = (refined.results || []).filter(r => !existingIds.has(r.id));
      allChunks = [...allChunks, ...newDocs];
      searchResults = refined.results || [];
      steps.push(`📄 **Found ${newDocs.length} new documents**`);
      iteration++;
    }

    // ── Step 4: Filter to selected papers if applicable ────────────────────────
    let finalChunks = allChunks;
    if (selected_paper_ids.length > 0) {
      const sel = new Set(selected_paper_ids);
      const filtered = finalChunks.filter(r => sel.has(r.id));
      if (filtered.length > 0) {
        finalChunks = filtered;
        steps.push(`🎯 **Filtered to ${finalChunks.length} selected papers**`);
      }
    }

    // ── Step 5: Synthesise answer ──────────────────────────────────────────────
    const topChunks = finalChunks.sort((a, b) => b.score - a.score).slice(0, 15);
    const contextDocs = topChunks.map((r, i) =>
      `[Doc ${i + 1}] (relevance: ${Math.round(r.score * 100)}%, type: ${r.type})\n${r.snippet}`
    ).join('\n\n────────────\n\n');

    const convHistory = conversation_history.slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');

    const finalAnswer = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert research analyst specialising in South African Contaminants of Emerging Concern (CECs), PFAS, and environmental science.

${convHistory ? `CONVERSATION HISTORY:\n${convHistory}\n\n` : ''}RETRIEVED DOCUMENTS (${topChunks.length} most relevant by hybrid search):

${contextDocs}

USER QUESTION: ${user_query}

INSTRUCTIONS:
- Answer based primarily on the retrieved documents
- Cite papers by title or [Doc N] when making factual claims
- Provide concentrations, units, and site details where available
- Highlight geographical patterns, temporal trends, and research gaps
- If documents don't fully answer the question, clearly state what's missing
- Be scholarly, precise, and comprehensive
- Use markdown headings for longer responses
- Conclude with key takeaways`,
      model: 'claude_sonnet_4_6'
    });

    steps.push(`✨ **Synthesis complete** from ${topChunks.length} documents`);

    return Response.json({
      answer: finalAnswer,
      agent_steps: steps,
      strategy: {
        search_intent: strategy.search_intent,
        rewritten_query: strategy.rewritten_query,
        keyword_weight: strategy.keyword_weight || 0.4,
        semantic_weight: 1 - (strategy.keyword_weight || 0.4),
        iterations: iteration
      },
      retrieved_count: topChunks.length,
      total_corpus,
      sources: topChunks.slice(0, 5).map(r => ({
        id: r.id, type: r.type, score: r.score,
        snippet_preview: r.snippet?.substring(0, 150) + '...'
      }))
    });

  } catch (error) {
    console.error('agenticRAG error:', error);
    return Response.json({
      error: error.message,
      answer: 'I encountered an error while searching the research database. Please try again.',
      agent_steps: ['❌ Error: ' + error.message]
    }, { status: 500 });
  }
});