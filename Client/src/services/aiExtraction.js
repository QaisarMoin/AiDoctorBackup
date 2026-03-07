import api from './api';

class AIExtractionService {
  constructor() {
    this.apiEndpoint = '/ai/extract-medical-data';
  }

  async extractMedicalData(text, language = 'en') {
    try {
      if (!text) throw new Error('No speech detected.');

      // Triggers for extracting speech
      const lowerText = text.toLowerCase();
      
      const startTriggers = ['hey maddy', 'start maddy', 'start'];
      const endTriggers = ['stop maddy', 'stop'];

      // Find the LAST occurrence of ANY start trigger
      let lastStartIndex = -1;
      let usedStartTrigger = '';
      
      for (const trigger of startTriggers) {
        const index = lowerText.lastIndexOf(trigger);
        if (index > lastStartIndex) {
          lastStartIndex = index;
          usedStartTrigger = trigger;
        }
      }

      if (lastStartIndex === -1) {
        throw new Error('Start trigger not found. Please say "Hey Maddy" or "Start" to begin.');
      }

      const contentStartIndex = lastStartIndex + usedStartTrigger.length;
      
      // Find the FIRST occurrence of ANY end trigger occurring AFTER the start trigger
      let firstEndIndex = Infinity;
      let usedEndTrigger = '';
      
      for (const trigger of endTriggers) {
        const index = lowerText.indexOf(trigger, contentStartIndex);
        if (index !== -1 && index < firstEndIndex) {
          firstEndIndex = index;
          usedEndTrigger = trigger;
        }
      }

      if (firstEndIndex === Infinity) {
        throw new Error('End trigger not found after your start command. Make sure to say "Stop" or "Stop Maddy".');
      }

      // Extract only the speech between the triggers
      const filteredText = text.substring(contentStartIndex, firstEndIndex).trim();

      if (!filteredText) {
         throw new Error(`No speech detected between "${usedStartTrigger}" and "${usedEndTrigger}".`);
      }

      // Call backend AI extraction endpoint using the configured Axios instance
      // This automatically attaches the JWT auth token
      const response = await api.post(this.apiEndpoint, {
        text: filteredText,
        language: language
      });

      console.log('--- AI Extraction Raw Response ---', response);

      if (response.success && response.data) {
        // The API interceptor unwraps the base Axios response, returning the JSON body.
        // The backend ai.controller wraps the structure inside `data.data`:
        // { success: true, data: { data: { diagnosis... }, validation: ... } }
        const extractedData = response.data.data || response.data;
        console.log('--- AI Extraction Mapped Data ---', extractedData);
        return extractedData;
      }

      // Return empty structure on failure
      return this.getEmptyStructure();
    } catch (error) {
      console.error('AI extraction failed:', error);
      // Re-throw so the UI can catch the specific missing trigger messages
      throw error;
    }
  }

  // Parse any timing format into a clean string array ["morning","night",...]
  parseTiming(raw) {
    const VALID = ['morning', 'afternoon', 'evening', 'night'];
    if (!raw) return ['morning'];

    if (Array.isArray(raw)) {
      const result = raw.map(v => String(v).toLowerCase().trim()).filter(v => VALID.includes(v));
      return result.length > 0 ? result : ['morning'];
    }
    if (typeof raw === 'object') {
      const result = VALID.filter(k => raw[k]);
      return result.length > 0 ? result : ['morning'];
    }
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase();
      const result = VALID.filter(t => lower.includes(t));
      return result.length > 0 ? result : ['morning'];
    }
    return ['morning'];
  }

  // Extract foodRelation from text like "(after food)" or existing value
  parseFoodRelation(raw, existing) {
    const VALID = ['beforeFood', 'afterFood', 'withFood', 'noRelation'];
    if (existing && VALID.includes(existing)) return existing;
    const text = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (text.includes('before food') || text.includes('before meal')) return 'beforeFood';
    if (text.includes('after food') || text.includes('after meal')) return 'afterFood';
    if (text.includes('with food') || text.includes('with meal')) return 'withFood';
    return 'afterFood';
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
        ? data.medications.map((med, index) => ({
            id: Math.floor(Date.now() + index + 100),
            name: med.name || 'Unknown Medicine',
            dosage: med.dosage || 'As directed',
            timing: this.parseTiming(med.timing),
            foodRelation: this.parseFoodRelation(
              typeof med.timing === 'string' ? med.timing : '',
              med.foodRelation
            ),
            duration: med.duration || '5 days',
            instructions: med.instructions || ''
          }))
        : [],
      doctorAdvice: data.doctorAdvice || '',
      followUp: {
        afterDays: data.followUp?.afterDays || 7,
        instructions: data.followUp?.instructions || ''
      }
    };
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

  getEmptyStructure() {
    return {
      diagnosis: {
        provisional: '',
        notes: ''
      },
      testsRecommended: [],
      medications: [],
      doctorAdvice: '',
      followUp: {
        afterDays: 7,
        instructions: ''
      }
    };
  }

  // Validate extracted data
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
}

export default new AIExtractionService();
