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
    const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: file_url,
      json_schema: {
        type: "object",
        properties: {
          records: {
            type: "array",
            description: "Extract all data rows from the spreadsheet. Skip the header row. The first column contains compound names in format 'Category ~ Compound'. Map each row to the properties below.",
            items: {
              type: "object",
              properties: {
                col_0: { type: "string", description: "Contaminant Name (first column or 'KNOWLEDGE HUB CEC DATA EXPORT')" },
                col_1: { type: "string", description: "Commonly Known As" },
                col_2: { type: "string", description: "Metabolites" },
                col_3: { type: "string", description: "IUPAC Name" },
                col_4: { type: "string", description: "Synonym" },
                col_5: { type: "string", description: "Formula" },
                col_6: { type: "string", description: "Molar Mass" },
                col_7: { type: "string", description: "Density" },
                col_8: { type: "string", description: "Melting Point" },
                col_9: { type: "string", description: "Boiling Point" },
                col_10: { type: "string", description: "Solubility In Water" },
                col_11: { type: "string", description: "Sampling Site" },
                col_12: { type: "string", description: "Feature At Sampling Site" },
                col_13: { type: ["string", "number"], description: "Point Latitude" },
                col_14: { type: ["string", "number"], description: "Point Longitude" },
                col_15: { type: "string", description: "Coordinate Notes" },
                col_16: { type: "string", description: "Sample Collection Notes" },
                col_17: { type: "string", description: "Instrument Used" },
                col_18: { type: ["string", "number"], description: "Concentration Detected In Sample" },
                col_19: { type: "string", description: "Chemical Abundance In Sample" },
                col_20: { type: "string", description: "Reference For Analysis Method" },
                col_21: { type: "string", description: "Replicated Collected" },
                col_22: { type: "string", description: "Unit Of Measure" },
                col_23: { type: "string", description: "Unit Of Measure Full Name" },
                col_24: { type: "string", description: "Data Reference" }
              },
              required: ["col_0"]
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
      // Parse category from col_0 (e.g., "Alkylphenols and Alkylphenol Ethoxylates ~ Alkylphenol ethoxylates")
      const categoryMatch = record.col_0?.match(/^([^~]+)~(.+)$/);
      const cec_category = categoryMatch ? categoryMatch[1].trim() : "Unclassified";
      const contaminant_name = categoryMatch ? categoryMatch[2].trim() : (record.col_0 || "").trim();

      // Parse coordinates - handle both string and number types, -999 is missing data
      const lat = typeof record.col_13 === 'number' 
        ? record.col_13 
        : parseFloat(String(record.col_13 || ''));
      const lon = typeof record.col_14 === 'number'
        ? record.col_14
        : parseFloat(String(record.col_14 || ''));
      const latitude = (!isNaN(lat) && lat !== -999 && lat !== 0) ? lat : null;
      const longitude = (!isNaN(lon) && lon !== -999 && lon !== 0) ? lon : null;

      // Parse concentration - handle both string and number types
      let concentration_numeric = null;
      const concValue = record.col_18;
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
      const province = inferProvince(record.col_11, latitude, longitude);

      // Infer water body type from sampling site description
      const water_body_type = inferWaterBodyType(
        record.col_11, 
        record.col_12
      );

      // Extract study year from data reference
      const study_year = extractYearFromReference(record.col_24);

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
        commonly_known_as: cleanValue(record.col_1),
        metabolites: cleanValue(record.col_2),
        iupac_name: cleanValue(record.col_3),
        synonym: cleanValue(record.col_4),
        formula: cleanValue(record.col_5),
        molar_mass: cleanValue(record.col_6),
        density: cleanValue(record.col_7),
        melting_point: cleanValue(record.col_8),
        boiling_point: cleanValue(record.col_9),
        solubility_in_water: cleanValue(record.col_10),
        province,
        municipality: null,
        sampling_site: cleanValue(record.col_11),
        feature_at_site: cleanValue(record.col_12),
        water_body_type,
        latitude,
        longitude,
        coordinate_notes: cleanValue(record.col_15),
        sample_collection_notes: cleanValue(record.col_16),
        concentration_detected: cleanValue(record.col_18),
        concentration_numeric,
        chemical_abundance: cleanValue(record.col_19),
        unit_of_measure: cleanValue(record.col_22),
        unit_of_measure_full: cleanValue(record.col_23),
        instrument_used: cleanValue(record.col_17),
        reference_for_analysis: cleanValue(record.col_20),
        replicated_collected: cleanValue(record.col_21),
        data_reference: cleanValue(record.col_24),
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