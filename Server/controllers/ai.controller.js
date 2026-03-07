const { createResponse } = require('../utils/response.util');
const aiExtractionService = require('../services/ai-extraction.service');
const clinicSettingService = require('../services/clinicSetting.service');
const auditService = require('../services/audit.service');

// Extract medical data from text using AI
const extractMedicalData = async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const doctorId = req.doctor.id;
    const clinicId = req.doctor?.clinic_id || req.user?.clinic_id;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json(
        createResponse(false, null, 'Text is required and must be non-empty', 400)
      );
    }

    if (text.length > 10000) {
      return res.status(400).json(
        createResponse(false, null, 'Text is too long (max 10000 characters)', 400)
      );
    }

    // Fetch clinic's registered medicines & tests to inject into AI prompt
    let clinicMedicines = [];
    let clinicTests = [];
    if (clinicId) {
      try {
        [clinicMedicines, clinicTests] = await Promise.all([
          clinicSettingService.getMedicines(clinicId),
          clinicSettingService.getTests(clinicId)
        ]);
      } catch (fetchErr) {
        // Non-fatal — AI will fall back to generic examples
        console.warn('Could not fetch clinic catalog for AI prompt:', fetchErr.message);
      }
    }

    // Extract medical data using AI service (passes clinic catalog for smarter matching)
    const extractedData = await aiExtractionService.extractMedicalData(
      text,
      language,
      clinicMedicines,
      clinicTests
    );
    
    // Create audit log for AI extraction
    await auditService.createAIExtractionAudit(text, extractedData, doctorId);
    
    // Validate the extracted data
    const validation = aiExtractionService.validateExtractedData(extractedData);
    
    // Return response with validation warnings if any
    const response = {
      data: extractedData,
      validation: {
        isValid: validation.isValid,
        warnings: validation.errors
      }
    };

    res.status(200).json(
      createResponse(true, response, 'Medical data extracted successfully')
    );

  } catch (error) {
    console.error('AI extraction error:', error);
    
    // Create audit log for failed extraction
    const doctorId = req.doctor?.id || 'unknown';
    await auditService.createAIExtractionAudit(
      req.body?.text || '', 
      null, 
      doctorId
    );
    
    // Return safe empty structure on failure
    const emptyStructure = aiExtractionService.getEmptyStructure();
    
    res.status(500).json(
      createResponse(false, {
        data: emptyStructure,
        error: 'AI extraction service temporarily unavailable'
      }, 'Failed to extract medical data', 500)
    );
  }
};

module.exports = {
  extractMedicalData
};
