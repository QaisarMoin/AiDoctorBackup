const { HfInference } = require("@huggingface/inference");

class AIExtractionService {
  constructor() {
    // Initialize HuggingFace client with server-side token
    this.client = new HfInference(process.env.HUGGINGFACE_TOKEN);

    // ✅ CHANGED MODEL ONLY
    this.model = "meta-llama/Meta-Llama-3-8B-Instruct";
  }

  async extractMedicalData(text, language = 'en', clinicMedicines = [], clinicTests = []) {
    try {
      const systemPrompt = this.buildSystemPrompt(language, clinicMedicines, clinicTests);
      const userPrompt = this.buildUserPrompt(text);

      const response = await this.client.chatCompletion({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 900,
        temperature: 0.1
      });

      const rawOutput = response.choices?.[0]?.message?.content || '';
      console.log('--- AI Raw LLM Output ---\n', rawOutput);
      
      const extractedData = this.safeJSONParse(rawOutput);
      console.log('--- AI Parsed JSON ---\n', JSON.stringify(extractedData, null, 2));
      
      return this.normalizeStructure(extractedData);

    } catch (error) {
      console.error('AI extraction service error:', error);
      return this.getEmptyStructure();
    }
  }

  buildSystemPrompt(language, clinicMedicines = [], clinicTests = []) {
    // Build dynamic medicine list from clinic's catalog
    const medList = clinicMedicines.length > 0
      ? clinicMedicines.map(m => m.name).join(', ')
      : 'Paracetamol, Amoxicillin, Azithromycin, Pantoprazole, Cetirizine, Ibuprofen, Multivitamin';

    // Build dynamic test list from clinic's catalog
    const testList = clinicTests.length > 0
      ? clinicTests.map(t => t.name).join(', ')
      : 'CBC, Liver Function Test (LFT), Kidney Function Test (KFT), Lipid Profile, Thyroid Profile, Urine Routine, HbA1c, X-Ray, Ultrasound';

    const basePrompt = `You are a medical data extraction AI.
Your task is to analyze medical text and return ONLY valid JSON.
No explanation, no markdown, no extra text.

**CRITICAL EXTRACTION RULES:**
1. **Clinical Notes & Provisional Diagnosis Boundaries**: 
   - The doctor will say "Provisional diagnosis" or "diagnosis" or "Provisional" or "diagnosis is" or "Provisional is" to start the diagnosis section, and "note is" or "clinical notes" or "notes" or "clinical" or "clinical notes is" or "clinical notes are" to start the notes section.
   - Extract EVERYTHING between "Provisional diagnosis..." and "...note is" into \`diagnosis.provisional\`.
   - Extract EVERYTHING after "note is..." (until the next section like tests/medicines begins) into \`diagnosis.notes\`.
   - Extract these *verbatim* (word-for-word). Do NOT summarize, shorten, or mix them up.
2. **Medicines**: When extracting medications, ALWAYS try to match the spoken/dictated name to the clinic's registered medicine catalog (listed below). Prefer exact or closest match from the catalog in 95% of cases. Only use a free-text name if there is clearly no matching entry.
   - **Clinic Medicine Catalog**: ${medList}
3. **Tests**: When extracting recommended tests, ALWAYS try to match the spoken/dictated name to the clinic's registered test catalog (listed below). Prefer exact or closest match from the catalog in 95% of cases.
   - **Clinic Test Catalog**: ${testList}

Return JSON strictly in this format:
{
  "diagnosis": {
    "provisional": "",
    "notes": ""
  },
  "testsRecommended": [],
  "medications": [
    {
      "name": "Medicine Name",
      "dosage": "dose",
      "timing": ["morning", "evening"],
      "foodRelation": "afterFood",
      "duration": "5 days",
      "instructions": ""
    }
  ],
  "doctorAdvice": "",
  "followUp": {
    "afterDays": 7,
    "instructions": ""
  }
}`;

    return language === 'hindi' 
      ? basePrompt + '\n\nRespond in English regardless of input language.' 
      : basePrompt;
  }

  buildUserPrompt(text) {
    return `Analyze the following medical case and extract structured data.

MEDICAL TEXT:
"""${text}"""`;
  }

  safeJSONParse(rawOutput) {
    try {
      const jsonStart = rawOutput.indexOf("{");
      const jsonEnd = rawOutput.lastIndexOf("}") + 1;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON found in AI response');
      }

      const jsonString = rawOutput.slice(jsonStart, jsonEnd);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parsing failed:', error);
      throw error;
    }
  }

  // Parse any timing format into a clean string array ["morning","night",...]
  parseTiming(raw) {
    const VALID = ['morning', 'afternoon', 'evening', 'night'];
    if (!raw) return ['morning']; // sensible fallback

    // If already an array - filter to valid values
    if (Array.isArray(raw)) {
      const result = raw
        .map(v => String(v).toLowerCase().trim())
        .filter(v => VALID.includes(v));
      return result.length > 0 ? result : ['morning'];
    }

    // If it's an object {morning:true, night:true}
    if (typeof raw === 'object') {
      const result = VALID.filter(k => raw[k]);
      return result.length > 0 ? result : ['morning'];
    }

    // If it's a free-text string — extract keywords
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase();
      const result = VALID.filter(t => lower.includes(t));
      return result.length > 0 ? result : ['morning'];
    }

    return ['morning'];
  }

  // Extract foodRelation from text like "(after food)" or "before food"
  parseFoodRelation(raw, existingRelation) {
    const VALID_RELATIONS = ['beforeFood', 'afterFood', 'withFood', 'noRelation'];
    if (existingRelation && VALID_RELATIONS.includes(existingRelation)) return existingRelation;

    const text = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (text.includes('before food') || text.includes('before meal')) return 'beforeFood';
    if (text.includes('after food') || text.includes('after meal')) return 'afterFood';
    if (text.includes('with food') || text.includes('with meal')) return 'withFood';
    return 'afterFood'; // default
  }

  categorizeTest(testName) {
    const name = testName.toLowerCase();
    
    if (name.includes('blood') || name.includes('cbc') || name.includes('lipid') || 
        name.includes('liver') || name.includes('kidney') || name.includes('sugar') ||
        name.includes('thyroid') || name.includes('hba1c')) {
      return 'blood';
    }
    
    if (name.includes('x-ray') || name.includes('ct') || name.includes('mri') || 
        name.includes('ultrasound') || name.includes('pet') || name.includes('mammogram')) {
      return 'imaging';
    }
    
    if (name.includes('urine') || name.includes('stool') || name.includes('swab') || 
        name.includes('culture') || name.includes('sputum') || name.includes('csf')) {
      return 'laboratory';
    }
    
    if (name.includes('ecg') || name.includes('echo') || name.includes('stress') || 
        name.includes('holter') || name.includes('tmt')) {
      return 'cardiac';
    }
    
    return 'other';
  }

  normalizeStructure(data) {
    return {
      diagnosis: {
        provisional: data.diagnosis?.provisional || '',
        notes: data.diagnosis?.notes || ''
      },
      testsRecommended: Array.isArray(data.testsRecommended) 
        ? data.testsRecommended.map((test, index) => ({
            id: Math.floor(Date.now() + index),
            name: typeof test === 'string' ? test : test.name || 'Unknown Test',
            category: this.categorizeTest(typeof test === 'string' ? test : test.name || ''),
            urgency: 'routine',
            instructions: ''
          }))
        : [],
      medications: Array.isArray(data.medications)
        ? data.medications.map((med, index) => {
            const parsedTiming = this.parseTiming(med.timing);
            return {
              id: Math.floor(Date.now() + index + 100),
              name: med.name || 'Unknown Medicine',
              dosage: med.dosage || 'As directed',
              timing: parsedTiming,
              foodRelation: this.parseFoodRelation(
                typeof med.timing === 'string' ? med.timing : '',
                med.foodRelation
              ),
              duration: med.duration || '5 days',
              instructions: med.instructions || ''
            };
          })
        : [],
      doctorAdvice: data.doctorAdvice || '',
      followUp: {
        afterDays: data.followUp?.afterDays || 7,
        instructions: data.followUp?.instructions || ''
      }
    };
  }

  // ✅ ADDED BACK (ONLY FIX)
  validateExtractedData(data) {
    const errors = [];
    
    if (!data.diagnosis.provisional && !data.diagnosis.notes) {
      errors.push('No diagnosis information found');
    }
    
    if (!Array.isArray(data.testsRecommended)) {
      errors.push('Tests should be an array');
    }
    
    if (!Array.isArray(data.medications)) {
      errors.push('Medications should be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  getEmptyStructure() {
    return {
      diagnosis: { provisional: '', notes: '' },
      testsRecommended: [],
      medications: [],
      doctorAdvice: '',
      followUp: { afterDays: 7, instructions: '' }
    };
  }
}

module.exports = new AIExtractionService();