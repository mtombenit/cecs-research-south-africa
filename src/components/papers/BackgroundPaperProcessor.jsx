import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Module-level set so it persists across re-renders — exported for external cancel
export const processingSet = new Set();
const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function BackgroundPaperProcessor() {
  const queryClient = useQueryClient();

  const { data: pendingPapers = [] } = useQuery({
    queryKey: ['pending-papers'],
    queryFn: () => base44.entities.PendingPaper.list('-created_date', 50),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const now = Date.now();

    // Reset papers stuck for more than 5 minutes
    const stuckPapers = pendingPapers.filter(p => 
      ['extracting', 'validating'].includes(p.status) &&
      p.updated_date &&
      (now - new Date(p.updated_date).getTime()) > STALE_TIMEOUT_MS &&
      !processingSet.has(p.id)
    );
    stuckPapers.forEach(p => {
      base44.entities.PendingPaper.update(p.id, { status: 'uploading', progress: 10 });
    });

    // Process papers that need processing
    const papersToProcess = pendingPapers.filter(p => 
      ['uploading', 'extracting', 'validating'].includes(p.status) &&
      !processingSet.has(p.id)
    );

    // Process only one paper at a time to avoid rate limits
    if (papersToProcess.length > 0) {
      processPaper(papersToProcess[0]);
    }
  }, [pendingPapers]);



  const processPaper = async (paper) => {
    try {
      // Skip if already processing (prevent concurrent processing)
      if (processingSet.has(paper.id)) return;
      processingSet.add(paper.id);

      if (paper.status === 'uploading') {
        // Move to extraction
        await base44.entities.PendingPaper.update(paper.id, {
          status: "extracting",
          progress: 30
        });
        processingSet.delete(paper.id);
        return;
      }

      if (paper.status === 'extracting') {
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract metadata with improved prompt
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are extracting metadata from a research paper PDF. Extract ALL available information with maximum accuracy.

CRITICAL INSTRUCTIONS:
1. TITLE: Extract the complete, exact title of the paper
2. AUTHORS: List ALL authors in order as they appear
3. ABSTRACT: Extract the full abstract text
4. PUBLICATION YEAR: Find the 4-digit year (check header, footer, citations, copyright notices)
5. JOURNAL: Identify the journal/publication source name
6. DOI: Look for "DOI:", "doi:", "doi.org/", "dx.doi.org/" - extract the complete identifier
7. STUDY LOCATION: Find specific cities, regions, or areas where the study was conducted
8. COUNTRY: Identify the African country where the study was conducted. Must be one of: Algeria, Angola, Benin, Botswana, Burkina Faso, Burundi, Cabo Verde, Cameroon, Central African Republic, Chad, Comoros, Democratic Republic of Congo, Republic of Congo, Djibouti, Egypt, Equatorial Guinea, Eritrea, Eswatini, Ethiopia, Gabon, Gambia, Ghana, Guinea, Guinea-Bissau, Ivory Coast, Kenya, Lesotho, Liberia, Libya, Madagascar, Malawi, Mali, Mauritania, Mauritius, Morocco, Mozambique, Namibia, Niger, Nigeria, Rwanda, São Tomé and Príncipe, Senegal, Seychelles, Sierra Leone, Somalia, South Africa, South Sudan, Sudan, Tanzania, Togo, Tunisia, Uganda, Zambia, Zimbabwe, Global (Review), Multiple Countries. Default to "South Africa" only if the study is clearly South African.
9. PROVINCE: Only for South African studies — identify the province: Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, Western Cape, or National. Leave null for non-South African studies.
10. RESEARCH TYPE: Classify as: Environmental Monitoring, Human Health, Water Quality, Soil Contamination, Wildlife, Treatment Technology, Risk Assessment, or Review
11. PFAS COMPOUNDS: List all PFAS chemicals studied (e.g., PFOA, PFOS, PFHxS, PFNA, etc.)
12. SAMPLE MATRIX: List sample types analyzed (e.g., water, soil, sediment, blood, fish)
13. KEY FINDINGS: Summarize the main results and conclusions
14. CONCENTRATIONS: Report any PFAS concentration ranges or values found
15. KEYWORDS: Extract research keywords
16. INSTITUTION: Identify the affiliated university or research organization

IMPORTANT: Extract data exactly as it appears in the document. Identify the correct African country — do NOT default everything to South Africa. If a field is not found, return null or empty array.`,
          file_urls: [paper.file_url],
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              authors: { type: "array", items: { type: "string" } },
              abstract: { type: "string" },
              publication_year: { type: "number" },
              journal: { type: "string" },
              doi: { type: "string" },
              pfas_compounds: { type: "array", items: { type: "string" } },
              study_location: { type: "string" },
              country: { type: "string" },
              province: { type: "string" },
              research_type: { type: "string" },
              sample_matrix: { type: "array", items: { type: "string" } },
              key_findings: { type: "string" },
              concentrations_reported: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              institution: { type: "string" }
            }
          }
        });

        if (!result || !result.title) {
          await base44.entities.PendingPaper.update(paper.id, {
            status: "error",
            error_message: "Failed to extract metadata - could not read title",
            progress: 100
          });
          processingSet.delete(paper.id);
          return;
        }

        const extractedPaper = {
          ...result,
          pdf_url: paper.file_url,
          country: result.country || "South Africa",
          authors: result.authors || [],
          pfas_compounds: result.pfas_compounds || [],
          sample_matrix: result.sample_matrix || [],
          keywords: result.keywords || [],
          publication_year: result.publication_year || new Date().getFullYear()
        };

        await base44.entities.PendingPaper.update(paper.id, {
          status: "validating",
          progress: 50,
          extracted_data: extractedPaper
        });
        processingSet.delete(paper.id);
        return;
      }

      if (paper.status === 'validating') {
        const extractedPaper = paper.extracted_data;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Validate African origin
        const validationResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this research paper and determine if it is about research conducted in Africa or related to African countries, locations, or environments.

Research Paper:
Title: ${extractedPaper.title || 'N/A'}
Abstract: ${extractedPaper.abstract || 'N/A'}
Keywords: ${extractedPaper.keywords?.join(', ') || 'N/A'}
Study Location: ${extractedPaper.study_location || 'N/A'}
Province: ${extractedPaper.province || 'N/A'}
Institution: ${extractedPaper.institution || 'N/A'}

Determine if this paper is about African research. Look for:
1. Study conducted in any African country (South Africa, Kenya, Nigeria, Ghana, Egypt, Ethiopia, Uganda, Tanzania, Burundi, Mozambique, Zimbabwe, Zambia, Malawi, Madagascar, Morocco, Tunisia, Libya, Sudan, Chad, Cameroon, Angola, Botswana, Namibia, Lesotho, Eswatini, Rwanda, DRC, Seychelles, Mauritius, Comoros, etc.)
2. African locations, cities, rivers, lakes, or regions
3. African institutions or research organizations
4. Research specifically about African water resources, environment, or populations

Return your analysis.`,
          response_json_schema: {
            type: "object",
            properties: {
              is_african: { type: "boolean" },
              confidence: { type: "number" },
              reason: { type: "string" }
            }
          }
        });

        if (!validationResult.is_african) {
          await base44.entities.PendingPaper.update(paper.id, {
            status: "rejected",
            error_message: `Not African research: ${validationResult.reason}`,
            progress: 100
          });
          processingSet.delete(paper.id);
          return;
        }

        // Save to database
        const extractedPaper2 = paper.extracted_data;
        const newPaper = await base44.entities.ResearchPaper.create(extractedPaper2);
        
        // Mark as complete
        await base44.entities.PendingPaper.update(paper.id, {
          status: "complete",
          progress: 100
        });

        // Kick off background Markdown extraction for richer AI context
        if (newPaper?.id && paper.file_url) {
          base44.functions.invoke('extractMarkdown', {
            paper_id: newPaper.id,
            file_url: paper.file_url
          }).catch(() => {}); // Non-blocking, best-effort
        }

        queryClient.invalidateQueries({ queryKey: ['papers'] });
        toast.success(`"${extractedPaper2.title}" added to database!`);
        processingSet.delete(paper.id);
        return;
      }

      processingSet.delete(paper.id);

    } catch (error) {
      let errorMessage = error.message;

      // If the entity no longer exists, just clean up and move on
      if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
        processingSet.delete(paper.id);
        return;
      }

      // Handle specific error types
      if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded - will retry in 10 seconds';
        // Wait longer before retry
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Reset status to retry
        await base44.entities.PendingPaper.update(paper.id, {
          status: paper.status, // Keep same status to retry
          progress: paper.progress
        });
      } else if (errorMessage.includes('slice')) {
        errorMessage = 'Cannot read properties of undefined (reading \'slice\')';
        await base44.entities.PendingPaper.update(paper.id, {
          status: "error",
          error_message: errorMessage,
          progress: 100
        });
      } else if (errorMessage.includes('10MB') || errorMessage.includes('file size')) {
        errorMessage = 'PDF file size must be under 10MB';
        await base44.entities.PendingPaper.update(paper.id, {
          status: "error",
          error_message: errorMessage,
          progress: 100
        });
      } else {
        await base44.entities.PendingPaper.update(paper.id, {
          status: "error",
          error_message: errorMessage,
          progress: 100
        });
      }
      
      processingSet.delete(paper.id);
      console.error('Background processing error:', error);
    }
  };

  return null; // This is a headless component
}