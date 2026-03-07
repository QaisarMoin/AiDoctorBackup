import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Save, Printer, User, Activity, FileText, Pill, Calendar, Clock, ArrowLeft, Search, HelpCircle, X } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PatientInfoCard from './PatientInfoCard';
import DiagnosisSection from './DiagnosisSection';
import TestsSection from './TestsSection';
import MedicationsSection from './MedicationsSection';
import DoctorAdviceSection from './DoctorAdviceSection';
import VoiceCapturePanel from './VoiceCapturePanel';
import { consultationAPI, patientAPI } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { printPrescription } from './PrintPrescription';
import aiExtractionService from '../../services/aiExtraction';
import toast, { Toaster } from 'react-hot-toast';
import Loader from '../loader/Loader';

// Added by Qaisar Moin: Hindi Translations Dictionary for Doctor Consultation
const TRANSLATIONS = {
  en: {
    pageTitle: 'Doctor Consultation',
    saveBtn: 'Save',
    savingBtn: 'Saving...',
    printBtn: 'Print',
    selectPatientTitle: 'Select Patient for Consultation',
    chiefComplaint: 'Chief Complaint:'
  },
  hindi: {
    pageTitle: 'डॉक्टर परामर्श (Consultation)',
    saveBtn: 'सेव करें (Save)',
    savingBtn: 'सेव हो रहा है...',
    printBtn: 'प्रिंट करें (Print)',
    selectPatientTitle: 'परामर्श के लिए मरीज चुनें',
    chiefComplaint: 'मुख्य समस्या:'
  }
};

export default function DoctorConsultation() {
  const { patientId } = useParams(); // present when URL is /doctor-audio/:patientId
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultationData, setConsultationData] = useState({
    diagnosisProvisional: '',
    diagnosisNotes: '',
    testsRecommended: [],
    medications: [],
    doctorAdvice: '',
    followUpDays: 7,
    followUpInstructions: '',
    voiceTranscript: '',
    aiAnalysis: null
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Added by Qaisar: Real patient fetching state
  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  // Search for patient list (applies to both today & previous mode)
  const [patientSearch, setPatientSearch] = useState('');
  const debouncedPatientSearch = useDebounce(patientSearch, 350);
  const [todayPage, setTodayPage] = useState(1);
  const [todayTotalPages, setTodayTotalPages] = useState(1);
  const [todayTotal, setTodayTotal] = useState(0);
  const TODAY_PAGE_SIZE = 10;

  // Previous patients — paginated
  const [viewMode, setViewMode] = useState('today'); // 'today' | 'previous'
  const [prevPatients, setPrevPatients] = useState([]);
  const [prevPage, setPrevPage] = useState(1);
  const [prevTotalPages, setPrevTotalPages] = useState(1);
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevLoading, setPrevLoading] = useState(false);
  const PREV_PAGE_SIZE = 10;
  // Floating help button
  const [showHelp, setShowHelp] = useState(false);
  const [isExtractingData, setIsExtractingData] = useState(false);

  // Ref to always access latest transcript inside stale closures (e.g. speech recognition callbacks)
  const transcriptRef = React.useRef('');
  // Ref to always call the latest handleSave (avoids stale closure from speech recognition setup)
  const saveRef = React.useRef(null);
  // Ref to always access the latest selectedPatient (avoids stale closure in voice save command)
  const selectedPatientRef = React.useRef(null);
  // Ref to track isListening inside onend / onerror (avoids stale closure)
  const isListeningRef = React.useRef(false);
  // Ref to access recognition instance inside keydown handler (avoids stale closure)
  const recognitionRef = React.useRef(null);
  // Ref to prevent infinite error loops in Safari
  const errorShownRef = React.useRef(false);
  // Ref to track whether the consultation was saved — used to decide whether to revert status on back
  const consultationSavedRef = React.useRef(false);
  // Ref to store patient's status BEFORE it was set to 'in progress' so we can revert to the exact original
  const prevPatientStatusRef = React.useRef(null);

  // Keep transcriptRef in sync whenever voiceTranscript state changes (including pre-filled data)
  useEffect(() => {
    transcriptRef.current = consultationData.voiceTranscript;
  }, [consultationData.voiceTranscript]);

  // Keep selectedPatientRef in sync whenever selectedPatient changes
  useEffect(() => {
    selectedPatientRef.current = selectedPatient;
  }, [selectedPatient]);

  // STATUS LIFECYCLE: revert patient status when leaving a patient without saving.
  // This fires for ALL navigation: explicit back button, browser back, switching patients, etc.
  useEffect(() => {
    return () => {
      // If there is no patientID in the URL during this cleanup, it means we are just unmounting the LIST view
      // We only want to revert if we are unmounting an active consultation view.
      if (!patientId) return;

      const patient = selectedPatientRef.current;
      if (!patient) return; 
      
      // Determine the correct revert status so we don't accidentally push them to 'hold'
      let revertStatus = prevPatientStatusRef.current || location.state?.prevStatus;
      
      if (!revertStatus) {
        // If we truly lost the state (e.g. user refreshed the page while viewing /doctor-audio/id)
        // we shouldn't guess 'hold' for previous patients, because they might be 'in' the current queue.
        // It's safer to just let the backend keep their last known explicit status if we don't know it.
        const isToday = patient.created_at
          ? new Date(patient.created_at).toDateString() === new Date().toDateString()
          : true;
        revertStatus = isToday ? 'in' : null; // do NOT fallback to hold. It breaks old patients in the queue.
      }
      
      // Only revert if we know what to revert to
      if (revertStatus && revertStatus !== 'completed' && revertStatus !== 'cancelled' && patient.status !== 'completed' && !consultationSavedRef.current) {
         // fire-and-forget — can't await inside useEffect cleanup
         patientAPI.updateStatus(patient.id, revertStatus).catch(() => {});
      }
    };
  // Re-registers cleanup every time patientId changes so the correct patient is reverted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, location.state]);

  // Keep isListeningRef in sync so callbacks always see the latest value
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Keep recognitionRef in sync with recognition state
  useEffect(() => {
    recognitionRef.current = recognition;
  }, [recognition]);

  // Auto-migration intentionally removed to allow manual 'in' overrides from previous days

  // URL-driven patient load: when /doctor-audio/:patientId is visited directly or back-navigated to
  useEffect(() => {
    if (!patientId) {
      // No patientId in URL — show patient list, stop mic
      setSelectedPatient(null);
      if (isListeningRef.current) {
        recognitionRef.current?.stop();
        isListeningRef.current = false;
        setIsListening(false);
      }
      // Re-fetch patient lists so status badges are up-to-date immediately (no manual refresh needed)
      fetchTodayPage(todayPage);
      if (viewMode === 'previous') fetchPrevPage(prevPage);
      return;
    }
    // patientId present: fetch patient from backend and show consultation form
    const loadPatient = async () => {
      try {
        const res = await patientAPI.getPatientById(patientId);
        const patient = res?.data || res;
        if (patient?.id || patient?.name) {
          setSelectedPatient(patient);
          errorShownRef.current = false;
        } else {
          toast.error('Patient not found.');
          navigate('/doctor-audio', { replace: true });
        }
      } catch {
        toast.error('Could not load patient.');
        navigate('/doctor-audio', { replace: true });
      }
    };
    loadPatient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Space bar toggles mic on/off (only when a patient is selected and not typing in a field)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code !== 'Space') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      // Use refs — they always hold the latest values, no stale closure issue
      if (!selectedPatientRef.current) return;
      e.preventDefault();
      if (isListeningRef.current) {
        // Stop mic
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        // Start mic
        try { recognitionRef.current?.start(); } catch (_) {}
        setIsListening(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch today's patients — 10 per page from backend
  const fetchTodayPage = useCallback(async (page) => {
    try {
      setIsLoadingPatients(true);
      const res = await patientAPI.getAllPatients({
        todayOnly: true,
        page,
        limit: TODAY_PAGE_SIZE,
        search: debouncedPatientSearch || undefined
      });
      const fetched = res?.data?.patients || [];
      const total = res?.data?.pagination?.total || 0;
      setPatients(fetched);
      setTodayTotal(total);
      setTodayTotalPages(Math.max(1, Math.ceil(total / TODAY_PAGE_SIZE)));
    } catch {
      toast.error('[API-PAT-NETWORK-ERR] Could not load today\'s patients.');
    } finally {
      setIsLoadingPatients(false);
    }
  }, [debouncedPatientSearch]);

  useEffect(() => { fetchTodayPage(todayPage); }, [todayPage, fetchTodayPage]);
  // Reset to page 1 when search changes (today mode)
  useEffect(() => { setTodayPage(1); }, [debouncedPatientSearch]);

  // Fetch previous patients — 10 per page from backend
  const fetchPrevPage = useCallback(async (page) => {
    setPrevLoading(true);
    try {
      const res = await patientAPI.getAllPatients({
        page,
        limit: PREV_PAGE_SIZE,
        search: debouncedPatientSearch || undefined
      });
      const fetched = res?.data?.patients || [];
      const total = res?.data?.pagination?.total || 0;
      setPrevPatients(fetched);
      setPrevTotal(total);
      setPrevTotalPages(Math.max(1, Math.ceil(total / PREV_PAGE_SIZE)));
    } catch {
      // silently ignore
    } finally {
      setPrevLoading(false);
    }
  }, [debouncedPatientSearch]);

  // Load previous patients when switching to that mode or page changes
  useEffect(() => {
    if (viewMode === 'previous') {
      fetchPrevPage(prevPage);
    }
  }, [viewMode, prevPage, fetchPrevPage]);
  // Reset to page 1 when search changes (previous mode)
  useEffect(() => { if (viewMode === 'previous') setPrevPage(1); }, [debouncedPatientSearch]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      // Set language — critical for accurate speech-to-text
      recognitionInstance.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setConsultationData(prev => {
            const newTranscript = prev.voiceTranscript + ' ' + finalTranscript;
            transcriptRef.current = newTranscript; // keep ref in sync
            return { ...prev, voiceTranscript: newTranscript };
          });
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Silently ignore non-critical errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }
        // SAFARI FIX: Safari fires onerror → onend → restart → onerror in an infinite loop.
        // errorShownRef ensures we only show ONE toast per error session.
        // Chrome fires onerror exactly once, so this ref never blocks anything in Chrome.
        if (errorShownRef.current) return;
        errorShownRef.current = true;

        // Stop listening so onend does NOT restart the recognition (kills the loop)
        isListeningRef.current = false;
        setIsListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          toast.error('🎤 Microphone access denied. Please allow microphone permission in your browser and refresh the page.', { duration: 6000, id: 'mic-error' });
        } else if (event.error === 'audio-capture') {
          toast.error('🎤 No microphone found. Please connect a microphone and try again.', { duration: 5000, id: 'mic-error' });
        } else {
          toast.error('Voice recognition stopped. Please try again.', { id: 'mic-error' });
        }
      };

      recognitionInstance.onend = () => {
        // Use ref to avoid stale closure — isListening may have changed
        if (isListeningRef.current) {
          try { recognitionInstance.start(); } catch (_) {}
        }
      };

      setRecognition(recognitionInstance);

      // CLEANUP: stop recognition when component unmounts or language changes.
      // Without this, the browser keeps the mic locked and the next page can't start recognition.
      return () => {
        isListeningRef.current = false;
        try { recognitionInstance.stop(); } catch (_) {}
      };
    }
  // Only re-create recognition when language changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Removed mockPatients list — now dynamically fetching from API

  const selectLanguage = (lang) => {
    setLanguage(lang);
    // Use recognitionRef to avoid stale closure — recognition state may lag behind
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hindi' ? 'hi-IN' : 'en-US';
    }
  };

  const toggleListening = () => {
    if (!selectedPatient) {
      toast.error('[DOC-MISSING-PATIENT] Please select a patient first!');
      return;
    }
    if (!recognition) {
      toast.error('[SYS-SPEECH-UNSUPPORTED] Your browser does not support Voice Recognition. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      // Reset error flag so a fresh session can show errors if needed
      errorShownRef.current = false;
      recognition.start();
      setIsListening(true);
    }
    
  };

  const processVoiceCommand = async (text) => {
    const lowerText = text.toLowerCase();
    
    // Extract Medical Data command
    if (
      lowerText.includes('extract medical data') ||
      lowerText.includes('extract data') ||
      lowerText.includes('analyse') ||
      lowerText.includes('analyze') ||
      lowerText.includes('डेटा निकालो')
    ) {
      // Use transcriptRef to get the latest accumulated transcript (avoids stale closure)
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        setIsExtractingData(true);
        toast.loading('Extracting medical data from voice...', { id: 'ai-extract' });
        try {
          const extractedData = await aiExtractionService.extractMedicalData(transcript, language);
          updateConsultationData('aiAnalysis', extractedData);
          toast.success('AI data extracted!', { id: 'ai-extract' });
        } catch (err) {
          toast.error(err.message || 'Failed to extract medical data.', { id: 'ai-extract' });
        } finally {
          setIsExtractingData(false);
        }
      } else {
        toast.error('Please speak some content first before extracting.', { id: 'ai-extract' });
      }
      return; // don't fall through to save
    }

    // Save / Submit command — use saveRef to avoid stale closure
    if (
      lowerText.includes('save') ||
      lowerText.includes('submit') ||
      lowerText.includes('सेव') ||
      lowerText.includes('जमा करो')
    ) {
      saveRef.current?.();
    }
    
    // Print command
    if (lowerText.includes('print') || lowerText.includes('प्रिंट')) {
      handlePrint();
    }
    
    // Clear command
    if (lowerText.includes('clear all') || lowerText.includes('सब मिटाओ')) {
      setConsultationData({
        diagnosisProvisional: '',
        diagnosisNotes: '',
        testsRecommended: [],
        medications: [],
        doctorAdvice: '',
        followUpDays: 7,
        followUpInstructions: '',
        voiceTranscript: '',
        aiAnalysis: null
      });
    }
  };

  const emptyConsultation = {
    diagnosisProvisional: '',
    diagnosisNotes: '',
    testsRecommended: [],
    medications: [],
    doctorAdvice: '',
    followUpDays: 7,
    followUpInstructions: '',
    voiceTranscript: '',
    aiAnalysis: null
  };

  // Normalize any timing format to the new array format ['morning', 'night', ...]
  // Handles: old {morning:true} objects, plain strings "morning", and already-correct arrays
  const normalizeTiming = (raw) => {
    const VALID = ['morning', 'afternoon', 'evening', 'night'];
    if (!raw) return ['morning'];
    if (Array.isArray(raw)) {
      const clean = raw.map(v => String(v).toLowerCase().trim()).filter(v => VALID.includes(v));
      return clean.length > 0 ? clean : ['morning'];
    }
    if (typeof raw === 'object') {
      const clean = VALID.filter(k => raw[k]);
      return clean.length > 0 ? clean : ['morning'];
    }
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase();
      const clean = VALID.filter(t => lower.includes(t));
      return clean.length > 0 ? clean : ['morning'];
    }
    return ['morning'];
  };

  const handlePatientSelect = async (patient) => {
    // Remember original status BEFORE marking 'in progress'.
    // NEVER store 'in progress' as the revert target — it is not a stable state.
    // If patient is already stuck in 'in progress', resolve their true status from registration date.
    const stableStatus = (() => {
      if (patient.status && patient.status !== 'in progress') return patient.status;
      // Patient was 'in progress' already (likely due to rapid UI clicks).
      // Since they are visible in the active queue, their idle state is 'in'.
      // DO NOT fallback to 'hold' based on registration date, it drops old patients from the queue!
      return 'in';
    })();
    prevPatientStatusRef.current = stableStatus;

    // Use router state to effectively persist this data securely across component remounts
    navigate(`/doctor-audio/${patient.id}`, { state: { prevStatus: stableStatus } });
    errorShownRef.current = false;
    consultationSavedRef.current = false; // reset: fresh session, not yet saved
    
    setConsultationData(emptyConsultation);

    // Mark patient as 'in progress' ONLY IF they are not already 'completed' or 'cancelled'
    if (patient.status !== 'completed' && patient.status !== 'cancelled') {
        try {
          await patientAPI.updateStatus(patient.id, 'in progress');
        } catch (err) {
          console.warn('Could not set patient to in progress:', err.message);
        }
    }

    // Fetch this patient's latest saved consultation
    try {
      const res = await consultationAPI.getLatestConsultation(patient.id);
      if (res?.success && res?.data) {
        const c = res.data;
        setConsultationData({
          diagnosisProvisional: c.diagnosis_provisional || '',
          diagnosisNotes: c.diagnosis_notes || '',
          testsRecommended: Array.isArray(c.tests_recommended) ? c.tests_recommended : [],
          medications: Array.isArray(c.medications)
            ? c.medications.map(med => ({ ...med, timing: normalizeTiming(med.timing) }))
            : [],
          doctorAdvice: c.doctor_advice || '',
          followUpDays: c.follow_up_days || 7,
          followUpInstructions: c.follow_up_instructions || '',
          voiceTranscript: c.voice_transcript || '',
          aiAnalysis: null
        });
        toast.success('Previous consultation loaded!');
      }
    } catch {
      // 404 = no consultation yet, start fresh
      console.log('No previous consultation for this patient, starting fresh.');
    }
  };

  // Back button handler: revert patient status before navigating away
  const handleBack = async () => {
    const patient = selectedPatientRef.current || selectedPatient;

    // Stop mic if running
    if (isListeningRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (patient) {
      // Determine correct revert status based on the original status before 'in progress'
      let revertStatus = prevPatientStatusRef.current || location.state?.prevStatus;
      if (!revertStatus) {
        const registeredToday = patient.created_at
          ? new Date(patient.created_at).toDateString() === new Date().toDateString()
          : true;
        revertStatus = registeredToday ? 'in' : null;
      }
      
      // Do not revert completed or cancelled patients; DO NOT revert if it was saved during this session
      if (revertStatus && revertStatus !== 'completed' && revertStatus !== 'cancelled' && patient.status !== 'completed' && !consultationSavedRef.current) {
         try {
           await patientAPI.updateStatus(patient.id, revertStatus);
         } catch (err) {
           console.warn('Could not revert patient status:', err.message);
         }
      }
    }

    navigate('/doctor-audio');
  };

  const handleSave = async () => {
    // Use ref to avoid stale closure — guaranteed to be the currently selected patient
    const patient = selectedPatientRef.current || selectedPatient;

    if (!patient) {
      toast.error('[DOC-MISSING-PATIENT] Please select a patient first!');
      return;
    }

    if (!consultationData.diagnosisProvisional) {
      toast.error('[DOC-MISSING-DIAGNOSIS] Please provide a provisional diagnosis!');
      return;
    }

    setIsSaving(true);

    try {
      const consultationPayload = {
        patientId: patient.id,
        ...consultationData
      };

      const response = await consultationAPI.saveConsultation(consultationPayload);

      if (response.success) {
        consultationSavedRef.current = true; // mark saved so cleanup doesn't revert status
        prevPatientStatusRef.current = 'completed'; // ensure back navigation keeps it as completed
        
        // Update local state and backend to reflect 'completed' status immediately
        patientAPI.updateStatus(patient.id, 'completed').catch(() => {});
        setSelectedPatient(prev => ({ ...prev, status: 'completed' }));

        if (response.data?.no_changes) {
          toast('ℹ️ No changes to save — already up to date', { icon: '✅', duration: 3000 });
        } else if (response.data?.updated) {
          toast.success('✏️ Consultation updated!');
        } else {
          toast.success('✅ Consultation saved successfully!');
        }
      } else {
        toast.error(`[API-DOC-SAVE-FAIL] Failed to save consultation: ${response.message}`);
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      // Show the actual server error if available (e.g. Joi validation message)
      const serverMsg = error?.response?.data?.message || error?.message || null;
      if (serverMsg) {
        toast.error(`Save failed: ${serverMsg}`);
      } else {
        toast.error('[API-DOC-NETWORK-ERR] Error saving consultation. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };
  // Always point saveRef to the latest handleSave (prevents stale closure in voice command)
  saveRef.current = handleSave;

  const handlePrint = () => {
    const patient = selectedPatientRef.current || selectedPatient;
    printPrescription(patient, consultationData);
  };

  const updateConsultationData = (field, value) => {
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply AI analysis to form when it changes
  useEffect(() => {
    if (consultationData.aiAnalysis) {
      applyAIAnalysisToForm(consultationData.aiAnalysis);
    }
  }, [consultationData.aiAnalysis]);

  const applyAIAnalysisToForm = (analysis) => {
    if (!analysis) return;

    console.log('[AI] Applying to form. Medications timing:', analysis.medications?.map(m => `${m.name}: ${JSON.stringify(m.timing)}`));

    setConsultationData(prev => ({
      ...prev,
      diagnosisProvisional: analysis.diagnosis?.provisional || prev.diagnosisProvisional,
      diagnosisNotes: analysis.diagnosis?.notes || prev.diagnosisNotes,

      // Replace AI-extracted tests/medications entirely (prevents duplicates on re-extract)
      testsRecommended: analysis.testsRecommended?.length > 0
        ? analysis.testsRecommended
        : prev.testsRecommended,

      medications: analysis.medications?.length > 0
        ? analysis.medications
        : prev.medications,

      doctorAdvice: analysis.doctorAdvice || prev.doctorAdvice,
      followUpDays: analysis.followUp?.afterDays || prev.followUpDays,
      followUpInstructions: analysis.followUp?.instructions || prev.followUpInstructions
    }));

    toast.success('AI data applied to form successfully!');
  };

  // Colour-coded badge for patient status
  const StatusBadge = ({ status }) => {
    const cfg = {
      'in':          { label: 'Waiting',     cls: 'bg-blue-100 text-blue-700' },
      'in progress': { label: 'Waiting',     cls: 'bg-blue-100 text-blue-700' },
      'hold':        { label: 'Hold',        cls: 'bg-purple-100 text-purple-700' },
      'completed':   { label: 'Completed',   cls: 'bg-green-100 text-green-700' },
      'cancelled':   { label: 'Cancelled',   cls: 'bg-red-100 text-red-700' },
    };
    const { label, cls } = cfg[status] || { label: status || 'Unknown', cls: 'bg-gray-100 text-gray-500' };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isExtractingData && (
        <Loader message={language === 'hi' ? 'एआई को डेटा मिल रहा है...' : 'AI is extracting data...'} />
      )}

      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">{TRANSLATIONS[language].pageTitle}</h1>
          {selectedPatient && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{selectedPatient.name}</span>
              <span>•</span>
              <span>{selectedPatient.age} years, {selectedPatient.gender}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Custom Toggle for English/Hindi */}
          <div className="flex items-center space-x-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <span 
              className={`text-xs font-semibold transition-colors cursor-pointer ${language === 'en' ? 'text-gray-800' : 'text-gray-400'}`}
              onClick={() => selectLanguage('en')}
            >
              EN
            </span>
            
            <button
              type="button"
              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                language === 'hindi' ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              role="switch"
              onClick={() => selectLanguage(language === 'en' ? 'hindi' : 'en')}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  language === 'hindi' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span 
              className={`text-xs font-semibold transition-colors cursor-pointer ${language === 'hindi' ? 'text-gray-800' : 'text-gray-400'}`}
              onClick={() => selectLanguage('hindi')}
            >
              हिंदी
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">{isSaving ? TRANSLATIONS[language].savingBtn : TRANSLATIONS[language].saveBtn}</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm font-medium">{TRANSLATIONS[language].printBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="min-h-[calc(100vh-200px)]">
        {!selectedPatient ? (
          // Patient Selection Screen
          <div className="max-w-5xl mx-auto py-4">

            {/* Today / Previous toggle row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{TRANSLATIONS[language].selectPatientTitle}</h2>
              <button
                onClick={() => {
                  const next = viewMode === 'today' ? 'previous' : 'today';
                  setViewMode(next);
                  if (next === 'today') {
                    setPrevPatients([]);
                    setPrevPage(1);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  viewMode === 'previous'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {viewMode === 'today' ? 'See Previous Patients' : '← Back to Today'}
              </button>
            </div>

            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                placeholder={`Search ${viewMode === 'today' ? "today's" : 'previous'} patients by name or email...`}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all shadow-sm"
              />
              {patientSearch && (
                <button
                  onClick={() => setPatientSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Today's patients */}
            {viewMode === 'today' && (
              isLoadingPatients ? (
                <div className="flex justify-center items-center py-20">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">No patients were registered today.</p>
                  <p className="text-gray-400">Patients will appear here once they are checked in by the receptionist.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{patient.name}</h3>
                          <p className="text-sm text-gray-500 font-medium capitalize mt-1">
                            {patient.age}Y • {patient.gender}
                          </p>
                          <div className="mt-1.5">
                            <StatusBadge status={patient.status} />
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <User className="w-5 h-5 text-blue-500 group-hover:text-white" />
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{TRANSLATIONS[language].chiefComplaint}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 italic font-medium">"{patient.chief_complaint || 'No complaint recorded.'}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Today-mode pagination bar */}
            {viewMode === 'today' && !isLoadingPatients && todayTotal > 0 && (
              <div className="flex items-center justify-between px-2 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Page {todayPage} of {todayTotalPages} &nbsp;·&nbsp; {todayTotal} patients today
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTodayPage(p => Math.max(1, p - 1))}
                    disabled={todayPage === 1}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >← Previous</button>
                  <button
                    onClick={() => setTodayPage(p => Math.min(todayTotalPages, p + 1))}
                    disabled={todayPage === todayTotalPages}
                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >Next →</button>
                </div>
              </div>
            )}

            {/* Previous patients — lazy scroll */}
            {viewMode === 'previous' && (
              <div>
                {prevPatients.length === 0 && !prevLoading && (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                    <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No previous patients found.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prevPatients.map(patient => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{patient.name}</h3>
                          <p className="text-sm text-gray-500 font-medium capitalize mt-1">
                            {patient.age}Y • {patient.gender}
                          </p>
                          <div className="mt-1.5">
                            <StatusBadge status={patient.status} />
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-all">
                           <User className="w-5 h-5 text-indigo-500 group-hover:text-white" />
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Last Visit</p>
                        <p className="text-sm text-gray-500">
                          {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'No visit on record'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Previous patients pagination bar */}
                {!prevLoading && prevTotal > 0 && (
                  <div className="flex items-center justify-between px-2 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Page {prevPage} of {prevTotalPages} &nbsp;·&nbsp; {prevTotal} patients
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPrevPage(p => Math.max(1, p - 1))}
                        disabled={prevPage === 1}
                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >← Previous</button>
                      <button
                        onClick={() => setPrevPage(p => Math.min(prevTotalPages, p + 1))}
                        disabled={prevPage === prevTotalPages}
                        className="px-4 py-2 text-sm font-semibold rounded-xl border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >Next →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Consultation Screen- Side-by-side or Stacked
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Panel - Patient Info */}
            <div className="xl:col-span-3 space-y-6">
              <div className="xl:sticky xl:top-8">
                <PatientInfoCard patient={selectedPatient} language={language} />
                <button 
                  onClick={handleBack}
                  className="w-full mt-4 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Patients</span>
                </button>
              </div>
            </div>

            {/* Center Panel - Main Form */}
            <div className="xl:col-span-6 space-y-6">
              <DiagnosisSection
                diagnosisProvisional={consultationData.diagnosisProvisional}
                diagnosisNotes={consultationData.diagnosisNotes}
                onUpdate={(field, value) => updateConsultationData(field, value)}
                language={language}
              />

              <TestsSection
                tests={consultationData.testsRecommended}
                onUpdate={(tests) => updateConsultationData('testsRecommended', tests)}
                language={language}
              />

              <MedicationsSection
                medications={consultationData.medications}
                onUpdate={(medications) => updateConsultationData('medications', medications)}
              />

              <DoctorAdviceSection
                advice={consultationData.doctorAdvice}
                followUpDays={consultationData.followUpDays}
                followUpInstructions={consultationData.followUpInstructions}
                onUpdate={(field, value) => updateConsultationData(field, value)}
              />
            </div>

            {/* Right Panel - Voice Panel */}
            <div className="xl:col-span-3">
              <div className="sticky top-8">
                <VoiceCapturePanel
                  isListening={isListening}
                  isProcessing={isProcessing}
                  transcript={consultationData.voiceTranscript}
                  aiAnalysis={consultationData.aiAnalysis}
                  onToggleListening={toggleListening}
                  onTranscriptChange={(transcript) => updateConsultationData('voiceTranscript', transcript)}
                  onAIAnalysis={(analysis) => updateConsultationData('aiAnalysis', analysis)}
                  language={language}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Floating Help Button (only on diagnosis form) ─── */}
      {selectedPatient && (
        <>
          {/* Trigger button */}
          <button
            onClick={() => setShowHelp(true)}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
            title="Voice Commands & Shortcuts"
          >
            <HelpCircle className="w-6 h-6" />
          </button>

          {/* Modal overlay */}
          {showHelp && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              onClick={() => setShowHelp(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">🎙️ Voice Commands Guide</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Doctor Consultation — How to speak</p>
                  </div>
                  <button onClick={() => setShowHelp(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-4 space-y-5 text-sm">
                  {/* Diagnosis */}
                  <section>
                    <h4 className="font-bold text-blue-700 uppercase tracking-wide text-xs mb-2">📋 Diagnosis Fields</h4>
                    <ul className="space-y-1.5 text-gray-700">
                      <li>• Say <span className="font-semibold text-gray-900">"Provisional diagnosis is fever"</span> — fills Diagnosis</li>
                      <li>• Say <span className="font-semibold text-gray-900">"Clinical notes are…"</span> — fills Clinical Notes</li>
                      <li>• Speak naturally — AI will extract and fill all fields on "Extract Medical Data"</li>
                    </ul>
                  </section>

                  {/* Medications & Tests */}
                  <section>
                    <h4 className="font-bold text-purple-700 uppercase tracking-wide text-xs mb-2">💊 Medications & Tests</h4>
                    <ul className="space-y-1.5 text-gray-700">
                      <li>• Say <span className="font-semibold text-gray-900">"Give paracetamol 500mg twice daily"</span></li>
                      <li>• Say <span className="font-semibold text-gray-900">"Recommend CBC and liver function test"</span></li>
                      <li>• Say <span className="font-semibold text-gray-900">"Follow up after 7 days"</span></li>
                    </ul>
                  </section>

                  {/* Control Commands */}
                  <section>
                    <h4 className="font-bold text-green-700 uppercase tracking-wide text-xs mb-2">🔧 Control Commands</h4>
                    <ul className="space-y-1.5 text-gray-700">
                      <li>• <span className="font-semibold">"Extract Medical Data"</span> or <span className="font-semibold">"डेटा निकालो"</span> — AI extracts &amp; fills form</li>
                      <li>• <span className="font-semibold">"Save"</span> or <span className="font-semibold">"सेव"</span> — saves the consultation</li>
                      <li>• <span className="font-semibold">"Print"</span> or <span className="font-semibold">"प्रिंट"</span> — prints prescription</li>
                      <li>• <span className="font-semibold">"Clear all"</span> or <span className="font-semibold">"सब मिटाओ"</span> — resets form</li>
                    </ul>
                  </section>

                  {/* Keyboard Shortcuts */}
                  <section>
                    <h4 className="font-bold text-orange-700 uppercase tracking-wide text-xs mb-2">⌨️ Keyboard Shortcuts</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Spacebar', 'Toggle mic on/off'],
                        ['Ctrl + S', 'Save (browser default)'],
                        ['Tab', 'Move between fields'],
                        ['Enter', 'Confirm focused button'],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-center gap-2">
                          <kbd className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-mono font-bold text-gray-700 border border-gray-200 whitespace-nowrap">{key}</kbd>
                          <span className="text-gray-600 text-xs">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Tips */}
                  <section className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-bold text-blue-800 text-xs uppercase tracking-wide mb-2">💡 Tips</h4>
                    <ul className="space-y-1 text-blue-700 text-xs">
                      <li>• Speak at a normal pace — not too fast, not too slow</li>
                      <li>• Quiet environment = better accuracy</li>
                      <li>• You can manually edit any field after voice input</li>
                      <li>• Use simple, clear sentences for best recognition</li>
                      <li>• Re-saving on the same day <strong>updates</strong> the existing record</li>
                    </ul>
                  </section>
                </div>

                <div className="px-6 pb-5">
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

