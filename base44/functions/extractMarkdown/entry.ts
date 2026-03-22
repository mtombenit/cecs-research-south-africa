import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paper_id, file_url } = await req.json();

    if (!paper_id || !file_url) {
      return Response.json({ error: 'paper_id and file_url are required' }, { status: 400 });
    }

    // Use the LLM vision capability to convert the PDF to structured Markdown
    const markdownContent = await base44.integrations.Core.InvokeLLM({
      prompt: `Convert this research paper PDF into clean, well-structured Markdown format. 

Extract and preserve ALL content including:
- Title, authors, affiliations, publication details
- Abstract
- All section headings and body text
- Tables (convert to Markdown tables)
- Figure captions
- Results and discussion text
- Conclusions
- References list

Format requirements:
- Use # for main title, ## for major sections, ### for subsections
- Preserve all numerical data, concentration values, and statistical results exactly
- Format tables using Markdown table syntax
- Keep all scientific notation and units intact
- Preserve all citations in text as they appear

Output ONLY the Markdown content, no preamble or explanation.`,
      file_urls: [file_url],
    });

    // Store the markdown content on the paper record
    await base44.asServiceRole.entities.ResearchPaper.update(paper_id, {
      markdown_content: markdownContent
    });

    return Response.json({ success: true, markdown_length: markdownContent?.length || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});