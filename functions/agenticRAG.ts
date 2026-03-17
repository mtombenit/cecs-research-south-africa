import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ── Agentic RAG Orchestrator ───────────────────────────────────────────────────
// The LLM acts as an agent that:
//  1. Analyses the user query to decide the best search strategy
//  2. Rewrites the query for better retrieval
//  3. Dynamically sets keyword vs semantic weighting
//  4. Iteratively refines search if initial results are insufficient
//  5. Synthesises a final answer from retrieved chunks

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

    if (!user_query || user_query.trim().length === 0) {
      return Response.json({ error: 'user_query is required' }, { status: 400 });
    }

    // ── Step 1: Agent plans the search strategy ───────────────────────────────
    const strategyPrompt = `You are an expert research agent for a South African Contaminants of Emerging Concern (CEC) and PFAS research database.

Analyse the following user question and decide the best search strategy. Return ONLY valid JSON with no markdown or code fences.

User question: "${user_query}"

Decide:
1. "rewritten_query": A refined, expanded search query that will find the most relevant documents. Remove filler words, expand abbreviations (e.g. PFAS → "per- and polyfluoroalkyl substances PFAS"), add synonyms.
2. "keyword_weight": A float from 0.0 to 1.0 indicating how much to weight keyword search vs semantic search. Use HIGH (0.7-0.9) when the query contains specific compound names, IDs, acronyms, site names, or exact terms. Use LOW (0.1-0.3) when the query is conceptual/general. Use MEDIUM (0.4-0.6) for mixed queries.
3. "filters": An object with optional keys: province (string), research_type (string), year_from (integer), year_to (integer). Only add filters if clearly specified in the query.
4. "include_cec_records": boolean — true if the question is about concentration data, specific sites, or monitoring measurements.
5. "top_k": integer between 5 and 20 — how many documents to retrieve. Use higher for broad questions, lower for specific ones.
6. "search_intent": one of "factual_lookup", "synthesis", "comparison", "trend_analysis", "compound_specific"
7. "reasoning": Brief explanation of your strategy decision.

Return JSON only, example:
{
  "rewritten_query": "PFAS per- and polyfluoroalkyl substances surface water KwaZulu-Natal concentration",
  "keyword_weight": 0.65,
  "filters": { "province": "KwaZulu-Natal" },
  "include_cec_records": true,
  "top_k": 12,
  "search_intent": "factual_lookup",
  "reasoning": "Query contains specific province and compound type, favouring keyword search."
}`;

    const strategyResult = await base44.integrations.Core.InvokeLLM({
      prompt: strategyPrompt,
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
    const steps = [`🔍 **Search strategy**: ${strategy.search_intent} | keyword weight: ${Math.round(strategy.keyword_weight * 100)}% | semantic weight: ${Math.round((1 - strategy.keyword_weight) * 100)}%`];
    steps.push(`✏️ **Query rewrite**: "${strategy.rewritten_query}"`);
    if (strategy.reasoning) steps.push(`💡 **Reasoning**: ${strategy.reasoning}`);

    // ── Step 2: First hybrid search pass ─────────────────────────────────────
    const searchPayload = {
      query: strategy.rewritten_query || user_query,
      top_k: Math.min(Math.max(strategy.top_k || 10, 5), 20),
      keyword_weight: Math.min(Math.max(strategy.keyword_weight || 0.4, 0), 1),
      filters: strategy.filters || {},
      include_cec_records: strategy.include_cec_records || false
    };

    // If specific papers are pre-selected, ignore filters
    if (selected_paper_ids.length > 0) {
      searchPayload.filters = {};
    }

    const firstSearchResponse = await base44.functions.invoke('hybridSearch', searchPayload);
    let searchResults = firstSearchResponse.results || [];
    let totalCorpus = firstSearchResponse.total_corpus || 0;
    steps.push(`📚 **Retrieved**: ${searchResults.length} documents from corpus of ${totalCorpus}`);

    // ── Step 3: Agent evaluates if results are sufficient or needs refinement ──
    let allRetrievedChunks = [...searchResults];
    let iteration = 1;

    while (iteration < max_iterations && searchResults.length > 0) {
      const topSnippets = searchResults.slice(0, 5).map(r => r.snippet).join('\n\n---\n\n');
      const sufficiencyPrompt = `You are evaluating whether retrieved research documents are sufficient to answer a user question.

User question: "${user_query}"
Search intent: ${strategy.search_intent}

Top retrieved documents:
${topSnippets}

Assess:
1. "is_sufficient": boolean — Are these documents enough to give a comprehensive, accurate answer?
2. "refinement_needed": boolean — Should you search again with a different query/weighting?
3. "refined_query": string — If refinement needed, provide a different query focusing on missing aspects.
4. "refined_keyword_weight": number (0-1) — Adjusted weighting for the refinement search.
5. "missing_aspects": string — What aspects of the question are not covered by current results.

Return JSON only.`;

      const sufficiencyResult = await base44.integrations.Core.InvokeLLM({
        prompt: sufficiencyPrompt,
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

      if (!sufficiencyResult.refinement_needed || sufficiencyResult.is_sufficient) {
        if (sufficiencyResult.missing_aspects) {
          steps.push(`✅ **Results sufficient** — Coverage: good`);
        }
        break;
      }

      // Perform a refinement search
      steps.push(`🔄 **Refining search** (iteration ${iteration + 1}): "${sufficiencyResult.refined_query}"`);
      
      const refinedResponse = await base44.functions.invoke('hybridSearch', {
        query: sufficiencyResult.refined_query,
        top_k: 8,
        keyword_weight: Math.min(Math.max(sufficiencyResult.refined_keyword_weight || 0.5, 0), 1),
        filters: {},
        include_cec_records: strategy.include_cec_records || false
      });

      const refinedResults = refinedResponse.results || [];
      
      // Merge and deduplicate by id
      const existingIds = new Set(allRetrievedChunks.map(r => r.id));
      const newResults = refinedResults.filter(r => !existingIds.has(r.id));
      allRetrievedChunks = [...allRetrievedChunks, ...newResults];
      searchResults = refinedResults;
      
      steps.push(`📄 **Additional documents found**: ${newResults.length} new unique documents`);
      iteration++;
    }

    // ── Step 4: Filter by selected papers if provided ─────────────────────────
    let finalChunks = allRetrievedChunks;
    if (selected_paper_ids.length > 0) {
      const selectedSet = new Set(selected_paper_ids);
      const filtered = finalChunks.filter(r => selectedSet.has(r.id));
      // If filtered is empty, fall back to all retrieved
      if (filtered.length > 0) finalChunks = filtered;
      steps.push(`🎯 **Filtered to ${finalChunks.length} selected papers** out of ${allRetrievedChunks.length} retrieved`);
    }

    // ── Step 5: Build context and synthesise answer ────────────────────────────
    const topChunks = finalChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const contextDocs = topChunks.map((r, i) =>
      `[Document ${i + 1}] (score: ${r.score}, type: ${r.type})\n${r.snippet}`
    ).join('\n\n────────────────────────────\n\n');

    const convHistory = conversation_history
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const synthesisPrompt = `You are an expert research analyst specialising in South African Contaminants of Emerging Concern (CECs), PFAS, and environmental science.

${convHistory ? `CONVERSATION HISTORY:\n${convHistory}\n\n` : ''}RETRIEVED DOCUMENTS (${topChunks.length} most relevant, ranked by hybrid search score):

${contextDocs}

USER QUESTION: ${user_query}

INSTRUCTIONS:
- Answer based primarily on the retrieved documents above
- Cite specific papers by title or "[Document N]" when making factual claims
- For compound-specific questions, provide concentrations, units, and site information where available
- Highlight geographical patterns, temporal trends, and research gaps
- If documents don't fully answer the question, clearly state what data is missing
- Be scholarly, precise, and comprehensive
- Structure your answer with headings if the response will be long
- Always conclude with key takeaways or a brief summary`;

    const finalAnswer = await base44.integrations.Core.InvokeLLM({
      prompt: synthesisPrompt,
      model: 'claude_sonnet_4_6'
    });

    steps.push(`✨ **Synthesis complete** — Answer generated from ${topChunks.length} documents`);

    // ── Return full response ───────────────────────────────────────────────────
    return Response.json({
      answer: finalAnswer,
      agent_steps: steps,
      strategy: {
        search_intent: strategy.search_intent,
        rewritten_query: strategy.rewritten_query,
        keyword_weight: strategy.keyword_weight,
        semantic_weight: 1 - strategy.keyword_weight,
        iterations: iteration
      },
      retrieved_count: topChunks.length,
      total_corpus: totalCorpus,
      sources: topChunks.slice(0, 5).map(r => ({
        id: r.id,
        type: r.type,
        score: r.score,
        snippet_preview: r.snippet?.substring(0, 150) + '...'
      }))
    });

  } catch (error) {
    console.error('agenticRAG error:', error);
    return Response.json({
      error: error.message,
      answer: 'I encountered an error while processing your request. Please try again.',
      agent_steps: ['❌ Error during agentic search: ' + error.message]
    }, { status: 500 });
  }
});