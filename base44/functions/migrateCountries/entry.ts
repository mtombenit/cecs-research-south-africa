import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch all papers missing a country
    const allPapers = await base44.asServiceRole.entities.ResearchPaper.list();
    const papersToFix = allPapers.filter(p => !p.country || p.country === 'none');

    let updated = 0;
    let failed = 0;

    for (const paper of papersToFix) {
      try {
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 1500));

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Identify the African country where this research was conducted.

Title: ${paper.title || 'N/A'}
Abstract: ${paper.abstract || 'N/A'}
Study Location: ${paper.study_location || 'N/A'}
Institution: ${paper.institution || 'N/A'}
Keywords: ${paper.keywords?.join(', ') || 'N/A'}

Pick ONE country from this exact list: Algeria, Angola, Benin, Botswana, Burkina Faso, Burundi, Cabo Verde, Cameroon, Central African Republic, Chad, Comoros, Democratic Republic of Congo, Republic of Congo, Djibouti, Egypt, Equatorial Guinea, Eritrea, Eswatini, Ethiopia, Gabon, Gambia, Ghana, Guinea, Guinea-Bissau, Ivory Coast, Kenya, Lesotho, Liberia, Libya, Madagascar, Malawi, Mali, Mauritania, Mauritius, Morocco, Mozambique, Namibia, Niger, Nigeria, Rwanda, São Tomé and Príncipe, Senegal, Seychelles, Sierra Leone, Somalia, South Africa, South Sudan, Sudan, Tanzania, Togo, Tunisia, Uganda, Zambia, Zimbabwe, Global (Review), Multiple Countries.

Default to "South Africa" only if the study is clearly South African. If it spans multiple African countries use "Multiple Countries". If it is a global review use "Global (Review)".`,
          response_json_schema: {
            type: "object",
            properties: {
              country: { type: "string" },
              countries: { type: "array", items: { type: "string" } },
              confidence: { type: "number" }
            }
          }
        });

        if (result?.country) {
          await base44.asServiceRole.entities.ResearchPaper.update(paper.id, {
            country: result.country,
            countries: result.countries?.length > 0 ? result.countries : [result.country]
          });
          updated++;
        }
      } catch (err) {
        console.error(`Failed to update paper ${paper.id}: ${err.message}`);
        failed++;
      }
    }

    return Response.json({ 
      success: true, 
      total: papersToFix.length, 
      updated, 
      failed 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});