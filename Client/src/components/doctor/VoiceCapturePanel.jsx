import React, { useState } from 'react';
import { Mic, MicOff, Brain, Trash2, Download, AlertCircle } from 'lucide-react';
import aiExtractionService from '../../services/aiExtraction';
import Loader from '../loader/Loader';

// Added by Qaisar Moin: Hindi Translations for Voice Capture Panel
const TRANSLATIONS = {
  en: {
    alertSpeakFirst: 'Please speak some medical content first!',
    alertExtractFail: 'Failed to extract medical data. Please try again.',
    listening: 'Listening...',
    clickToStart: 'Click to Start',
    speakClearly: 'Speak clearly',
    tapMic: 'Tap the microphone',
    voiceTranscript: 'Voice Transcript',
    placeholder: 'Your voice will appear here...',
    extracting: 'Extracting...',
    extractMedicalData: 'Extract Medical Data',
    aiAnalysisDesc: 'AI will analyze the transcript and extract structured medical data',
    aiExtractedData: 'AI Extracted Data',
    applyToForm: 'Apply to Form',
    diagnosis: 'Diagnosis:',
    tests: 'Tests:',
    medications: 'Medications:',
    advice: 'Advice:',
    voiceCommands: 'Voice Commands',
    voiceCommandSave: '• "Save" or "सेव" - Save consultation',
    voiceCommandPrint: '• "Print" or "प्रिंट" - Print prescription',
    voiceCommandExtract: '• "Extract Medical Data" or "डेटा निकालो" - AI extract',
    voiceCommandClear: '• "Clear all" or "सब मिटाओ" - Reset form'
  },
  hindi: {
    alertSpeakFirst: 'कृपया पहले कुछ मेडिकल जानकारी बोलें!',
    alertExtractFail: 'मेडिकल डेटा निकालने में विफल। कृपया पुनः प्रयास करें।',
    listening: 'सुन रहा हूँ...',
    clickToStart: 'शुरू करने के लिए क्लिक करें',
    speakClearly: 'साफ बोलें',
    tapMic: 'माइक पर टैप करें',
    voiceTranscript: 'आवाज़ का ट्रांसक्रिप्ट (Voice Transcript)',
    placeholder: 'आपकी आवाज़ यहाँ दिखाई देगी...',
    extracting: 'निकाल रहा हूँ...',
    extractMedicalData: 'मेडिकल डेटा निकालें (Extract Data)',
    aiAnalysisDesc: 'AI ट्रांसक्रिप्ट का विश्लेषण करेगा और मेडिकल डेटा निकालेगा',
    aiExtractedData: 'AI द्वारा निकाला गया डेटा (Extracted Data)',
    applyToForm: 'फॉर्म पर लागू करें (Apply)',
    diagnosis: 'निदान (Diagnosis):',
    tests: 'टेस्ट (Tests):',
    medications: 'दवाइयां (Medications):',
    advice: 'सलाह (Advice):',
    voiceCommands: 'आवाज़ के निर्देश (Voice Commands)',
    voiceCommandSave: '• "Save" या "सेव" - कंसल्टेशन सेव करें',
    voiceCommandPrint: '• "Print" या "प्रिंट" - पर्चा प्रिंट करें',
    voiceCommandExtract: '• "Extract Medical Data" या "डेटा निकालो" - AI से डेटा निकालें',
    voiceCommandClear: '• "Clear all" या "सब मिटाओ" - फॉर्म रीसेट करें'
  }
};

export default function VoiceCapturePanel({
  isListening,
  isProcessing,
  transcript,
  aiAnalysis,
  onToggleListening,
  onTranscriptChange,
  onAIAnalysis,
  language = 'en'
}) {
  const [isExtracting, setIsExtracting] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const extractMedicalData = async () => {
    if (!transcript.trim()) {
      alert(t.alertSpeakFirst);
      return;
    }

    setIsExtracting(true);
    
    try {
      // Use the AI extraction service
      const extractedData = await aiExtractionService.extractMedicalData(transcript, language);
      
      // Validate the extracted data
      const validation = aiExtractionService.validateExtractedData(extractedData);
      
      if (!validation.isValid) {
        console.warn('AI extraction validation warnings:', validation.errors);
      }
      
      onAIAnalysis(extractedData);
    } catch (error) {
      console.error('AI extraction error:', error);
      alert(error.message || t.alertExtractFail);
    } finally {
      setIsExtracting(false);
    }
  };

  const clearTranscript = () => {
    onTranscriptChange('');
    onAIAnalysis(null);
  };

  const applyAIAnalysis = () => {
    // This is handled by the parent component through the useEffect
    // The AI analysis is automatically applied when it changes
    console.log('AI Analysis ready to be applied:', aiAnalysis);
  };

  return (
    <div className="space-y-6">
      {/* Voice Control */}
      <div className="text-center">
        <button
          onClick={onToggleListening}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            {isListening ? t.listening : t.clickToStart}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {isListening ? t.speakClearly : t.tapMic}
          </p>
        </div>
      </div>

      {/* Transcript */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">{t.voiceTranscript}</h3>
          <button
            onClick={clearTranscript}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-transparent text-sm text-gray-700 resize-none focus:outline-none"
            rows={6}
          />
        </div>
      </div>

      {/* AI Extraction */}
      <div className="relative">
        <button
          onClick={extractMedicalData}
          disabled={!transcript.trim() || isExtracting}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Brain className="w-4 h-4" />
          <span>{isExtracting ? t.extracting : t.extractMedicalData}</span>
        </button>
        {isExtracting && <Loader message={t.extracting} />}
        <p className="text-xs text-gray-500 mt-2 text-center">
          {t.aiAnalysisDesc}
        </p>
      </div>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-900">{t.aiExtractedData}</h3>
            <button
              onClick={applyAIAnalysis}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {t.applyToForm}
            </button>
          </div>
          
          <div className="space-y-2 text-xs">
            {aiAnalysis.diagnosis?.provisional && (
              <div>
                <span className="font-medium text-blue-700">{t.diagnosis}</span>
                <span className="text-blue-600 ml-1">{aiAnalysis.diagnosis.provisional}</span>
              </div>
            )}
            
            {aiAnalysis.testsRecommended && aiAnalysis.testsRecommended.length > 0 && (
              <div>
                <span className="font-medium text-blue-700">{t.tests}</span>
                <span className="text-blue-600 ml-1">
                  {aiAnalysis.testsRecommended.map(test => test.name).join(', ')}
                </span>
              </div>
            )}
            
            {aiAnalysis.medications && aiAnalysis.medications.length > 0 && (
              <div>
                <span className="font-medium text-blue-700">{t.medications}</span>
                <span className="text-blue-600 ml-1">
                  {aiAnalysis.medications.map(med => med.name).join(', ')}
                </span>
              </div>
            )}
            
            {aiAnalysis.doctorAdvice && (
              <div>
                <span className="font-medium text-blue-700">{t.advice}</span>
                <span className="text-blue-600 ml-1">{aiAnalysis.doctorAdvice}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-900">{t.voiceCommands}</h4>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              <li>{t.voiceCommandExtract}</li>
              <li>{t.voiceCommandSave}</li>
              <li>{t.voiceCommandPrint}</li>
              <li>{t.voiceCommandClear}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
