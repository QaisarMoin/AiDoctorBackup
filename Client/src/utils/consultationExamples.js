import { consultationAPI } from '../services/api';

// Example function to demonstrate how to save consultation data
export const saveConsultationExample = async () => {
  try {
    const consultationData = {
      patientId: 1,
      chiefComplaint: "Patient complains of persistent cough and fever",
      history: "Patient has been experiencing symptoms for the past 3 days. No history of respiratory illnesses.",
      examination: "Temperature: 38.5°C, Respiratory rate: 20/min, Chest clear on auscultation",
      diagnosis: "Upper respiratory tract infection",
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "5 days"
        },
        {
          name: "Azithromycin",
          dosage: "500mg",
          frequency: "once daily",
          duration: "3 days"
        }
      ],
      notes: "Patient advised to rest and increase fluid intake. Follow up in 3 days if symptoms persist.",
      // AI integration placeholders
      transcription: "Doctor says patient has cough and fever for three days...", // Will be filled by AI
      aiAnalysis: {
        severity: "mild",
        urgency: "low",
        recommendations: ["rest", "hydration", "monitoring"]
      }
    };

    const response = await consultationAPI.saveConsultation(consultationData);
    console.log('Consultation saved successfully:', response);
    return response;
  } catch (error) {
    console.error('Error saving consultation:', error);
    throw error;
  }
};

// Example function to fetch consultations for a patient
export const fetchPatientConsultations = async (patientId) => {
  try {
    const response = await consultationAPI.getConsultationsByPatientId(patientId, {
      page: 1,
      limit: 10
    });
    console.log('Patient consultations:', response);
    return response;
  } catch (error) {
    console.error('Error fetching consultations:', error);
    throw error;
  }
};

// Example function to get latest consultation
export const fetchLatestConsultation = async (patientId) => {
  try {
    const response = await consultationAPI.getLatestConsultation(patientId);
    console.log('Latest consultation:', response);
    return response;
  } catch (error) {
    console.error('Error fetching latest consultation:', error);
    throw error;
  }
};

// Example usage in a React component
export const useConsultationAPI = () => {
  const saveConsultation = async (data) => {
    try {
      return await consultationAPI.saveConsultation(data);
    } catch (error) {
      throw error;
    }
  };

  const getConsultations = async (patientId, options) => {
    try {
      return await consultationAPI.getConsultationsByPatientId(patientId, options);
    } catch (error) {
      throw error;
    }
  };

  const getLatestConsultation = async (patientId) => {
    try {
      return await consultationAPI.getLatestConsultation(patientId);
    } catch (error) {
      throw error;
    }
  };

  return {
    saveConsultation,
    getConsultations,
    getLatestConsultation
  };
};
