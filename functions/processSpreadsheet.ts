import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, filename } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Step 1: Extract raw data from the uploaded file
    // The spreadsheet has a specific format with "KNOWLEDGE HUB CEC DATA EXPORT" as first column header
    // and col_1, col_2, etc. as subsequent columns. We need to map these correctly.
    const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
      json_schema: {
        type: "object",
        properties: {
          records: {
            type: "array",
            description: "Extract all data rows, mapping column headers to their actual names",
            items: {
              type: "object",
              properties: {
                contaminant_name: { 
                  type: "string",
                  description: "From 'Contaminant Name' column - includes category prefix like 'Category ~ Compound'"
                },
                commonly_known_as: { 
                  type: "string",
                  description: "From 'Commonly Known As' column"
                },
                metabolites: { 
                  type: "string",
                  description: "From 'Metabolites' column"
                },
                iupac_name: { 
                  type: "string",
                  description: "From 'IUPAC Name' column"
                },
                synonym: { 
                  type: "string",
                  description: "From 'Synonym' column"
                },
                formula: { 
                  type: "string",
                  description: "From 'Formula' column - chemical formula"
                },
                molar_mass: { 
                  type: "string",
                  description: "From 'Molar Mass' column - with units"
                },
                density: { 
                  type: "string",
                  description: "From 'Density' column - with units"
                },
                melting_point: { 
                  type: "string",
                  description: "From 'Melting Point' column - may include multiple temperature units"
                },
                boiling_point: { 
                  type: "string",
                  description: "From 'Boiling Point' column - may include multiple temperature units"
                },
                solubility_in_water: { 
                  type: "string",
                  description: "From 'Solubility In Water' column"
                },
                sampling_site: { 
                  type: "string",
                  description: "From 'Sampling Site' column - geographic location"
                },
                feature_at_site: { 
                  type: "string",
                  description: "From 'Feature At Sampling Site' column - sampling context"
                },
                point_latitude: { 
                  type: ["string", "number"],
                  description: "From 'Point Latitude' column - may be -999 for missing data"
                },
                point_longitude: { 
                  type: ["string", "number"],
                  description: "From 'Point Longitude' column - may be -999 for missing data"
                },
                coordinate_notes: { 
                  type: "string",
                  description: "From 'Coordinate Notes' column"
                },
                sample_collection_notes: { 
                  type: "string",
                  description: "From 'Sample Collection Notes' column"
                },
                instrument_used: { 
                  type: "string",
                  description: "From 'Instrument Used' column - analytical instrument"
                },
                concentration_detected: { 
                  type: ["string", "number"],
                  description: "From 'Concentration Detected In Sample' column"
                },
                chemical_abundance: { 
                  type: "string",
                  description: "From 'Chemical Abundance In Sample' column"
                },
                reference_for_analysis: { 
                  type: "string",
                  description: "From 'Reference For Analysis Method' column - DOI or reference"
                },
                replicated_collected: { 
                  type: "string",
                  description: "From 'Replicated Collected' column - e.g. n=6"
                },
                unit_of_measure: { 
                  type: "string",
                  description: "From 'Unit Of Measure' column - abbreviation"
                },
                unit_of_measure_full: { 
                  type: "string",
                  description: "From 'Unit Of Measure Full Name' column"
                },
                data_reference: { 
                  type: "string",
                  description: "From 'Data Reference' column - source URL or DOI"
                }
              },
              required: ["contaminant_name"]
            }
          }
        },
        required: ["records"]
      }
    });

    if (extractionResult.status !== 'success' || !extractionResult.output) {
      return Response.json({ 
        error: 'Failed to extract data from file', 
        details: extractionResult.details 
      }, { status: 400 });
    }

    const rawRecords = extractionResult.output.records || [];
    
    if (rawRecords.length === 0) {
      return Response.json({ 
        error: 'No data found in spreadsheet. Please ensure the file has data in the expected format with headers.' 
      }, { status: 400 });
    }

    // Step 2: Clean and standardize the data
    const cleanedRecords = rawRecords.map(record => {
      // Parse category from contaminant_name (e.g., "Alkylphenols and Alkylphenol Ethoxylates ~ Alkylphenol ethoxylates")
      const categoryMatch = record.contaminant_name?.match(/^([^~]+)~(.+)$/);
      const cec_category = categoryMatch ? categoryMatch[1].trim() : "Unclassified";
      const contaminant_name = categoryMatch ? categoryMatch[2].trim() : (record.contaminant_name || "").trim();

      // Parse coordinates - handle both string and number types, -999 is missing data
      const lat = typeof record.point_latitude === 'number' 
        ? record.point_latitude 
        : parseFloat(String(record.point_latitude || ''));
      const lon = typeof record.point_longitude === 'number'
        ? record.point_longitude
        : parseFloat(String(record.point_longitude || ''));
      const latitude = (!isNaN(lat) && lat !== -999 && lat !== 0) ? lat : null;
      const longitude = (!isNaN(lon) && lon !== -999 && lon !== 0) ? lon : null;

      // Parse concentration - handle both string and number types
      let concentration_numeric = null;
      const concValue = record.concentration_detected;
      if (concValue !== null && concValue !== undefined && concValue !== '-') {
        if (typeof concValue === 'number') {
          concentration_numeric = concValue;
        } else {
          const numMatch = String(concValue).match(/[\d.]+/);
          if (numMatch) {
            concentration_numeric = parseFloat(numMatch[0]);
          }
        }
      }

      // Infer province from sampling site or coordinates
      const province = inferProvince(record.sampling_site, latitude, longitude);

      // Infer water body type from sampling site description
      const water_body_type = inferWaterBodyType(
        record.sampling_site, 
        record.feature_at_site
      );

      // Extract study year from data reference
      const study_year = extractYearFromReference(record.data_reference);

      // Clean up null-like values (-, --, None, etc.)
      const cleanValue = (val) => {
        if (val === null || val === undefined) return null;
        const str = String(val).trim();
        if (str === '-' || str === '--' || str === '- -' || str === 'None' || str === '') return null;
        return str;
      };

      return {
        cec_category,
        contaminant_name: contaminant_name || null,
        commonly_known_as: cleanValue(record.commonly_known_as),
        metabolites: cleanValue(record.metabolites),
        iupac_name: cleanValue(record.iupac_name),
        synonym: cleanValue(record.synonym),
        formula: cleanValue(record.formula),
        molar_mass: cleanValue(record.molar_mass),
        density: cleanValue(record.density),
        melting_point: cleanValue(record.melting_point),
        boiling_point: cleanValue(record.boiling_point),
        solubility_in_water: cleanValue(record.solubility_in_water),
        province,
        municipality: null,
        sampling_site: cleanValue(record.sampling_site),
        feature_at_site: cleanValue(record.feature_at_site),
        water_body_type,
        latitude,
        longitude,
        coordinate_notes: cleanValue(record.coordinate_notes),
        sample_collection_notes: cleanValue(record.sample_collection_notes),
        concentration_detected: cleanValue(record.concentration_detected),
        concentration_numeric,
        chemical_abundance: cleanValue(record.chemical_abundance),
        unit_of_measure: cleanValue(record.unit_of_measure),
        unit_of_measure_full: cleanValue(record.unit_of_measure_full),
        instrument_used: cleanValue(record.instrument_used),
        reference_for_analysis: cleanValue(record.reference_for_analysis),
        replicated_collected: cleanValue(record.replicated_collected),
        data_reference: cleanValue(record.data_reference),
        study_year,
        source_file: filename || 'unknown',
        upload_date: new Date().toISOString()
      };
    });

    // Step 3: Filter valid records
    const validRecords = cleanedRecords.filter(r => r.contaminant_name);
    
    if (validRecords.length === 0) {
      return Response.json({ 
        error: 'No valid records found. All records are missing contaminant names.' 
      }, { status: 400 });
    }

    // Step 4: Insert into database
    const inserted = await base44.asServiceRole.entities.CECRecord.bulkCreate(validRecords);

    return Response.json({
      success: true,
      records_processed: rawRecords.length,
      records_inserted: inserted.length,
      sample_record: inserted[0] || null
    });

  } catch (error) {
    console.error('Processing error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack,
      details: String(error)
    }, { status: 500 });
  }
});

// Helper functions
function inferProvince(site, lat, lon) {
  if (!site) return null;
  
  const siteUpper = site.toUpperCase();
  
  // Province keywords
  if (siteUpper.includes('KWAZULU') || siteUpper.includes('KZN') || siteUpper.includes('DURBAN') || 
      siteUpper.includes('UMGENI') || siteUpper.includes('PHOENIX') || siteUpper.includes('INANDA')) {
    return 'KwaZulu-Natal';
  }
  if (siteUpper.includes('GAUTENG') || siteUpper.includes('JOHANNESBURG') || 
      siteUpper.includes('PRETORIA') || siteUpper.includes('JUKSKEI')) {
    return 'Gauteng';
  }
  if (siteUpper.includes('WESTERN CAPE') || siteUpper.includes('CAPE TOWN')) {
    return 'Western Cape';
  }
  if (siteUpper.includes('EASTERN CAPE') || siteUpper.includes('UMTATA') || 
      siteUpper.includes('MADEN') || siteUpper.includes('ROOIKRANTZ') || 
      siteUpper.includes('KING WILLIAM')) {
    return 'Eastern Cape';
  }
  if (siteUpper.includes('LIMPOPO') || siteUpper.includes('POLOKWANE') || 
      siteUpper.includes('THOHOYANDOU') || siteUpper.includes('MULEDANE') ||
      siteUpper.includes('SILIOM')) {
    return 'Limpopo';
  }
  if (siteUpper.includes('FREE STATE') || siteUpper.includes('BLOEMFONTEIN')) {
    return 'Free State';
  }
  if (siteUpper.includes('NORTH WEST') || siteUpper.includes('NW DAM')) {
    return 'North West';
  }
  if (siteUpper.includes('MPUMALANGA')) {
    return 'Mpumalanga';
  }
  if (siteUpper.includes('NORTHERN CAPE')) {
    return 'Northern Cape';
  }

  // Coordinate-based inference
  if (lat && lon) {
    if (lat >= -31 && lat <= -28 && lon >= 29 && lon <= 32) return 'KwaZulu-Natal';
    if (lat >= -26.5 && lat <= -25.5 && lon >= 27.5 && lon <= 29) return 'Gauteng';
    if (lat >= -34.5 && lat <= -33 && lon >= 18 && lon <= 19) return 'Western Cape';
    if (lat >= -33 && lat <= -31 && lon >= 26 && lon <= 28) return 'Eastern Cape';
    if (lat >= -24 && lat <= -22 && lon >= 29 && lon <= 31) return 'Limpopo';
  }

  return null;
}

function inferWaterBodyType(site, feature) {
  if (!site && !feature) return 'Unclassified';
  
  const text = `${site || ''} ${feature || ''}`.toUpperCase();
  
  if (text.includes('WWTP') || text.includes('WASTEWATER') || 
      text.includes('SEWAGE') || text.includes('EFFLUENT') || 
      text.includes('INFLUENT')) {
    return 'WWTP';
  }
  if (text.includes('BOREHOLE') || text.includes('GROUNDWATER')) {
    return 'Groundwater';
  }
  if (text.includes('SEDIMENT') || text.includes('SLUDGE')) {
    return 'Sediment';
  }
  if (text.includes('MARINE') || text.includes('COASTAL') || 
      text.includes('BAY') || text.includes('OCEAN')) {
    return 'Marine/Coastal';
  }
  if (text.includes('RIVER') || text.includes('DAM') || 
      text.includes('SURFACE') || text.includes('STREAM')) {
    return 'Surface Water';
  }
  if (text.includes('AGRICULTURAL') || text.includes('IRRIGATION')) {
    return 'Agricultural Water';
  }

  return 'Unclassified';
}

function extractYearFromReference(ref) {
  if (!ref) return null;
  
  // Look for 4-digit year in the reference
  const yearMatch = ref.match(/20\d{2}/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}