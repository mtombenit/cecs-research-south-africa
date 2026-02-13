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
      ['uploading', 'extracting', 'validating', 'checking_duplicates'].includes(p.status)
    );

    papersToProcess.forEach(paper => {
      processPaper(paper);
    });
  }, [pendingPapers]);

  const checkDuplicate = async (extractedPaper) => {
    const { data: existingPapers } = await base44.entities.ResearchPaper.list();
    
    const prompt = `Check if this paper is a duplicate of any existing papers in the database.

NEW PAPER:
Title: ${extractedPaper.title}
Authors: ${extractedPaper.authors?.join(', ')}
Year: ${extractedPaper.publication_year}
DOI: ${extractedPaper.doi || 'N/A'}

EXISTING PAPERS:
${existingPapers.slice(0, 50).map(p => `- ${p.title} (${p.publication_year}) by ${p.authors?.join(', ')}`).join('\n')}

Is this a duplicate? Consider title similarity, same authors, same year, or same DOI.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          is_duplicate: { type: "boolean" },
          duplicate_title: { type: "string" },
          reason: { type: "string" }
        }
      }
    });

    return {
      isDuplicate: result.is_duplicate,
      title: result.duplicate_title || ''
    };
  };

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
        return;
      }

      if (paper.status === 'extracting') {
        // Extract metadata
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract detailed metadata from this research paper. Pay special attention to:

PUBLICATION YEAR: Look for publication date in header, footer, citations, or metadata. Extract the 4-digit year.
JOURNAL: Find the journal/publication name - often at the top of the first page or in citations.
DOI: Look for "DOI:", "doi.org/", or similar identifiers. Extract the full DOI (e.g., 10.1234/example).
STUDY LOCATION: Identify specific cities, regions, provinces, or areas in South Africa where research was conducted.
PROVINCE: Determine which South African province(s): Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, Northern Cape, North West, or Western Cape.
INSTITUTION: Find the affiliated university or research institution.

Extract all available information accurately. If a field is not found, leave it empty or null.`,
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

        if (!result) {
          await base44.entities.PendingPaper.update(paper.id, {
            status: "error",
            error_message: "Failed to extract metadata",
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

        await base44.entities.PendingPaper.update(paper.id, {
          status: "checking_duplicates",
          progress: 70
        });
        window[processingKey] = false;
        return;
      }

      if (paper.status === 'checking_duplicates') {
        const extractedPaper = paper.extracted_data;
        
        // Check for duplicates
        const duplicateCheck = await checkDuplicate(extractedPaper);
        if (duplicateCheck.isDuplicate) {
          await base44.entities.PendingPaper.update(paper.id, {
            status: "duplicate",
            duplicate_of: duplicateCheck.title,
            progress: 100
          });
          window[processingKey] = false;
          return;
        }

        // Save to database
        await base44.entities.ResearchPaper.create(extractedPaper);
        
        // Mark as complete
        await base44.entities.PendingPaper.update(paper.id, {
          status: "complete",
          progress: 100
        });

        queryClient.invalidateQueries({ queryKey: ['papers'] });
        toast.success(`"${extractedPaper.title}" added to database!`);
        window[processingKey] = false;
        return;
      }

      window[processingKey] = false;

    } catch (error) {
      await base44.entities.PendingPaper.update(paper.id, {
        status: "error",
        error_message: error.message,
        progress: 100
      });
      window[`processing_${paper.id}`] = false;
      console.error('Background processing error:', error);
    }
  };

  return null; // This is a headless component
}