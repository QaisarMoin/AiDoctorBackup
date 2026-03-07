const { executeQuery } = require('../config/db');

class AuditService {
  // Create audit log for consultation
  async createConsultationAudit(consultationData, doctorId) {
    try {
      const auditQuery = `
        INSERT INTO consultation_audit (
          consultation_id, doctor_id, action_type,
          voice_transcript_raw, ai_analysis_raw, final_data_json,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;

      const params = [
        consultationData.consultationId || null,
        doctorId,
        'CONSULTATION_CREATED',
        consultationData.voiceTranscript || null,
        consultationData.aiAnalysis ? JSON.stringify(consultationData.aiAnalysis) : null,
        JSON.stringify({
          diagnosisProvisional: consultationData.diagnosisProvisional,
          diagnosisNotes: consultationData.diagnosisNotes,
          testsRecommended: consultationData.testsRecommended,
          medications: consultationData.medications,
          doctorAdvice: consultationData.doctorAdvice,
          followUpDays: consultationData.followUpDays,
          followUpInstructions: consultationData.followUpInstructions
        })
      ];

      await executeQuery(auditQuery, params);
      
      console.log(`Audit log created for consultation by doctor ${doctorId}`);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error - audit failure shouldn't break main flow
    }
  }

  // Create audit log for AI extraction
  async createAIExtractionAudit(transcript, aiAnalysis, doctorId) {
    try {
      const auditQuery = `
        INSERT INTO ai_extraction_audit (
          doctor_id, transcript_raw, ai_response_raw,
          extraction_success, created_at
        ) VALUES (?, ?, ?, ?, NOW())
      `;

      const params = [
        doctorId,
        transcript,
        JSON.stringify(aiAnalysis),
        aiAnalysis && Object.keys(aiAnalysis).length > 0 ? 1 : 0
      ];

      await executeQuery(auditQuery, params);
      
      console.log(`AI extraction audit created for doctor ${doctorId}`);
    } catch (error) {
      console.error('Failed to create AI extraction audit log:', error);
      // Don't throw error - audit failure shouldn't break main flow
    }
  }

  // Get audit logs for a consultation
  async getConsultationAuditLogs(consultationId, doctorId) {
    try {
      const query = `
        SELECT * FROM consultation_audit 
        WHERE consultation_id = ? AND doctor_id = ?
        ORDER BY created_at DESC
      `;

      const logs = await executeQuery(query, [consultationId, doctorId]);
      
      // Parse JSON fields
      logs.forEach(log => {
        if (log.ai_analysis_raw) {
          try {
            log.ai_analysis_raw = JSON.parse(log.ai_analysis_raw);
          } catch (e) {
            log.ai_analysis_raw = null;
          }
        }
        if (log.final_data_json) {
          try {
            log.final_data_json = JSON.parse(log.final_data_json);
          } catch (e) {
            log.final_data_json = null;
          }
        }
      });

      return logs;
    } catch (error) {
      console.error('Failed to get consultation audit logs:', error);
      throw error;
    }
  }

  // Get AI extraction logs for a doctor
  async getAIExtractionLogs(doctorId, limit = 50) {
    try {
      const query = `
        SELECT * FROM ai_extraction_audit 
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;

      return await executeQuery(query, [doctorId, limit]);
    } catch (error) {
      console.error('Failed to get AI extraction logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
