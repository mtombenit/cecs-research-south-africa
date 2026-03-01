import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function BackgroundPaperProcessor() {
  const queryClient = useQueryClient();

  const { data: pendingPapers = [] } = useQuery({
    queryKey: ['pending-papers'],
    queryFn: () => base44.entities.PendingPaper.list('-created_date', 50),
    refetchInterval: 5000,
  });

  useEffect(() => {
    // Process papers that need processing
    const papersToProcess = pendingPapers.filter(p => 
      ['uploading', 'extracting', 'validating'].includes(p.status)
    );

    // Process only one paper at a time to avoid rate limits
    if (papersToProcess.length > 0) {
      processPaper(papersToProcess[0]);
    }
  }, [pendingPapers]);



  const processPaper = async (paper) => {
    try {
      // Skip if already processing (prevent concurrent processing)
      const processingKey = `processing_${paper.id}`;
      if (window[processingKey]) return;
      window[processingKey] = true;

      if (paper.status === 'uploading') {
        // Move to extraction
        await base44.entities.PendingPaper.update(paper.id, {
          status: "extracting",
          progress: 30
        });
        window[processingKey] = false;
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
7. STUDY LOCATION: Find specific cities, regions, or areas in South Africa where the study was conducted
8. PROVINCE: Identify which South African province(s): Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, Western Cape
9. RESEARCH TYPE: Classify as: Environmental Monitoring, Human Health, Water Quality, Soil Contamination, Wildlife, Treatment Technology, Risk Assessment, or Review
10. PFAS COMPOUNDS: List all PFAS chemicals studied (e.g., PFOA, PFOS, PFHxS, PFNA, etc.)
11. SAMPLE MATRIX: List sample types analyzed (e.g., water, soil, sediment, blood, fish)
12. KEY FINDINGS: Summarize the main results and conclusions
13. CONCENTRATIONS: Report any PFAS concentration ranges or values found
14. KEYWORDS: Extract research keywords
15. INSTITUTION: Identify the affiliated university or research organization

IMPORTANT: Extract data exactly as it appears in the document. If a field is not found, return null or empty array.`,
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
          window[processingKey] = false;
          return;
        }

        const extractedPaper = {
          ...result,
          pdf_url: paper.file_url,
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
        window[processingKey] = false;
        return;
      }

      if (paper.status === 'validating') {
        const extractedPaper = paper.extracted_data;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Validate South African origin
        const validationResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this research paper and determine if it is specifically about South African research, locations, or studies conducted in South Africa.

Research Paper:
Title: ${extractedPaper.title || 'N/A'}
Abstract: ${extractedPaper.abstract || 'N/A'}
Keywords: ${extractedPaper.keywords?.join(', ') || 'N/A'}
Study Location: ${extractedPaper.study_location || 'N/A'}
Province: ${extractedPaper.province || 'N/A'}
Institution: ${extractedPaper.institution || 'N/A'}

Determine if this paper is about South African research. Look for:
1. Study conducted in South Africa
2. South African locations, provinces, cities
3. South African institutions or authors
4. Research specifically about South African water resources, environment, or populations

Return your analysis.`,
          response_json_schema: {
            type: "object",
            properties: {
              is_south_african: { type: "boolean" },
              confidence: { type: "number" },
              reason: { type: "string" }
            }
          }
        });

        if (!validationResult.is_south_african) {
          await base44.entities.PendingPaper.update(paper.id, {
            status: "rejected",
            error_message: `Not South African research: ${validationResult.reason}`,
            progress: 100
          });
          window[processingKey] = false;
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
        window[processingKey] = false;
        return;
      }

      window[processingKey] = false;

    } catch (error) {
      let errorMessage = error.message;

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
      
      window[`processing_${paper.id}`] = false;
      console.error('Background processing error:', error);
    }
  };

  return null; // This is a headless component
}