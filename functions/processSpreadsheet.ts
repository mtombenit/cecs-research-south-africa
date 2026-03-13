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
            items: {
              type: "object",
              properties: {
                contaminant_name: { type: "string" },
                commonly_known_as: { type: "string" },
                metabolites: { type: "string" },
                iupac_name: { type: "string" },
                synonym: { type: "string" },
                formula: { type: "string" },
                molar_mass: { type: "string" },
                density: { type: "string" },
                melting_point: { type: "string" },
                boiling_point: { type: "string" },
                solubility_in_water: { type: "string" },
                sampling_site: { type: "string" },
                feature_at_site: { type: "string" },
                point_latitude: { type: "string" },
                point_longitude: { type: "string" },
                coordinate_notes: { type: "string" },
                sample_collection_notes: { type: "string" },
                instrument_used: { type: "string" },
                concentration_detected: { type: "string" },
                chemical_abundance: { type: "string" },
                reference_for_analysis: { type: "string" },
                replicated_collected: { type: "string" },
                unit_of_measure: { type: "string" },
                unit_of_measure_full: { type: "string" },
                data_reference: { type: "string" }
              }
            }
          }
        }
      }
    });

    if (extractionResult.status !== 'success' || !extractionResult.output) {
      return Response.json({ 
        error: 'Failed to extract data from file', 
        details: extractionResult.details 
      }, { status: 400 });
    }

    const rawRecords = extractionResult.output.records || [];

    // Step 2: Clean and standardize the data
    const cleanedRecords = rawRecords.map(record => {
      // Parse category from contaminant_name (e.g., "Heavy Metals ~ Cadmium")
      const categoryMatch = record.contaminant_name?.match(/^([^~]+)~(.+)$/);
      const cec_category = categoryMatch ? categoryMatch[1].trim() : "Unclassified";
      const contaminant_name = categoryMatch ? categoryMatch[2].trim() : record.contaminant_name;

      // Parse coordinates
      const lat = parseFloat(record.point_latitude);
      const lon = parseFloat(record.point_longitude);
      const latitude = (!isNaN(lat) && lat !== -999) ? lat : null;
      const longitude = (!isNaN(lon) && lon !== -999) ? lon : null;

      // Parse concentration - extract first number from text
      let concentration_numeric = null;
      if (record.concentration_detected) {
        const numMatch = record.concentration_detected.match(/[\d.]+/);
        if (numMatch) {
          concentration_numeric = parseFloat(numMatch[0]);
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

      return {
        cec_category,
        contaminant_name,
        commonly_known_as: record.commonly_known_as || null,
        metabolites: record.metabolites || null,
        iupac_name: record.iupac_name || null,
        synonym: record.synonym || null,
        formula: record.formula || null,
        molar_mass: record.molar_mass || null,
        density: record.density || null,
        melting_point: record.melting_point || null,
        boiling_point: record.boiling_point || null,
        solubility_in_water: record.solubility_in_water || null,
        province,
        municipality: null,
        sampling_site: record.sampling_site || null,
        feature_at_site: record.feature_at_site || null,
        water_body_type,
        latitude,
        longitude,
        coordinate_notes: record.coordinate_notes || null,
        sample_collection_notes: record.sample_collection_notes || null,
        concentration_detected: record.concentration_detected || null,
        concentration_numeric,
        chemical_abundance: record.chemical_abundance || null,
        unit_of_measure: record.unit_of_measure || null,
        unit_of_measure_full: record.unit_of_measure_full || null,
        instrument_used: record.instrument_used || null,
        reference_for_analysis: record.reference_for_analysis || null,
        replicated_collected: record.replicated_collected || null,
        data_reference: record.data_reference || null,
        study_year,
        source_file: filename || 'unknown',
        upload_date: new Date().toISOString()
      };
    });

    // Step 3: Insert into database
    const inserted = await base44.asServiceRole.entities.CECRecord.bulkCreate(
      cleanedRecords.filter(r => r.contaminant_name)
    );

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