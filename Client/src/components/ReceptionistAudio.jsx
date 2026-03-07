import React, { useState, useEffect, useRef } from 'react';
import { patientAPI, staffAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce';
import Header from './receptionist/Header';
import PatientForm from './receptionist/PatientForm';
import VoiceController from './receptionist/VoiceController';
import TranscriptPanel from './receptionist/TranscriptPanel';
import RecentPatients from './receptionist/RecentPatients';
import HowToUseGuide from './receptionist/HowToUseGuide';
import { HelpCircle } from 'lucide-react';
import Loader from './loader/Loader';

// Translation object
const translations = {
  en: {
    title: "Receptionist Voice Assistant",
    listening: "Listening... Speak now!",
    patientInfo: "Patient Information",
    name: "Name",
    age: "Age",
    gender: "Gender",
    phone: "Phone",
    email: "Email",
    address: "Address",
    chiefComplaint: "Chief Complaint",
    male: "Male",
    female: "Female",
    other: "Other",
    voiceTranscript: "Voice Transcript",
    recentPatients: "Recent Patients",
    noPatients: "No patients found",
    savePatient: "Save Patient",
    searchPatients: "Search Patients",
    howToUse: "How to Use",
    instructions: [
      "Click 'Start' to begin voice recording",
      "Speak clearly in Hindi or English",
      "Click 'Stop' when finished",
      "Review patient information",
      "Click 'Save Patient' to save to database"
    ]
  },
  hi: {
    title: "रिसेप्शनिस्ट वॉइस असिस्टेंट",
    listening: "सुन रहे हैं... अब बोलिए!",
    patientInfo: "मरीज की जानकारी",
    name: "नाम",
    age: "उम्र",
    gender: "लिंग",
    phone: "फोन",
    email: "ईमेल",
    address: "पता",
    chiefComplaint: "मुख्य समस्या",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    voiceTranscript: "वॉइस ट्रांसक्रिप्ट",
    recentPatients: "हाल के मरीज",
    noPatients: "कोई मरीज नहीं मिला",
    savePatient: "मरीज बचाएं",
    searchPatients: "मरीज खोजें",
    howToUse: "उपयोग कैसे करें",
    instructions: [
      "वॉइस रिकॉर्डिंग शुरू करने के लिए 'स्टार्ट' पर क्लिक करें",
      "हिंदी या अंग्रेजी में स्पष्ट रूप से बोलें",
      "होने पर 'स्टॉप' पर क्लिक करें",
      "मरीज की जानकारी देखें",
      "डेटाबेस में सेव करने के लिए 'मरीज बचाएं' पर क्लिक करें"
    ]
  }
};

export default function ReceptionistVoiceApp() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [clinicDoctors, setClinicDoctors] = useState([]);
  const clinicDoctorsRef = useRef([]);
  const [patientData, setPatientData] = useState({
    id: null,
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    chiefComplaint: '',
    assigned_doctor_id: user?.role === 'doctor' ? user.id : '',
    bp: '',
    temperature: '',
    sugar: '',
    weight: '',
    spo2: ''
  });
  const [voiceFilledFields, setVoiceFilledFields] = useState({});
  const [recognition, setRecognition] = useState(null);
  const [allPatients, setAllPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 350);

  // Refs to access latest state in speech recognition callbacks
  const patientDataRef = useRef(patientData);
  const isListeningRef = useRef(isListening);
  const recognitionRef = useRef(recognition);

  useEffect(() => {
    patientDataRef.current = patientData;
  }, [patientData]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    recognitionRef.current = recognition;
  }, [recognition]);

  // Keep clinicDoctorsRef in sync so processVoiceCommand never reads stale data
  useEffect(() => {
    clinicDoctorsRef.current = clinicDoctors;
  }, [clinicDoctors]);
  
  const t = translations[language];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          return; // Ignore pause errors
        }
        setIsListening(false);
        // Added by Qaisar Moin: Custom error code for better tracking
        toast.error('[SYS-SPEECH-ERR] Voice recognition error. Please try again.');
      };

      recognitionInstance.onend = () => {
        if (isListeningRef.current) {
          try {
            recognitionInstance.start();
          } catch(e) {}
        }
      };

      setRecognition(recognitionInstance);

      // CLEANUP: stop recognition on unmount so mic is released for other pages
      return () => {
        isListeningRef.current = false;
        try { recognitionInstance.stop(); } catch (_) {}
      };
    }
  }, [language]); // Add language dependency back for dynamic language change

  // Helper: convert spoken digit words to numerals
  const wordsToNumbers = (text) => {
    const wordMap = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
      'पाँच': '5', 'पांच': '5', 'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',
      'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14',
      'fifteen': '15', 'sixteen': '16', 'seventeen': '17', 'eighteen': '18', 'nineteen': '19',
      'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50', 'sixty': '60',
      'seventy': '70', 'eighty': '80', 'ninety': '90'
    };
    
    // First pass: single digit words
    let result = text.replace(
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|शून्य|एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ)\b/gi,
      (match) => wordMap[match.toLowerCase()] ?? match
    );

    // Second pass: handle "hundred" modifiers (e.g. "6 hundred" -> "600", "six hundred" -> "600")
    result = result.replace(/(\d+)\s+(?:hundred|सौ)/gi, (match, p1) => String(parseInt(p1, 10) * 100));
    
    // Third pass: handle standalone "hundred" or "hundreds" meaning 100
    result = result.replace(/\b(?:hundred|hundreds|सौ)\b/gi, "100");

    // Fourth pass: handle "thousand" modifiers
    result = result.replace(/(\d+)\s+(?:thousand|हज़ार|हजार)/gi, (match, p1) => String(parseInt(p1, 10) * 1000));
    
    // Fifth pass: standalone thousand
    result = result.replace(/\b(?:thousand|thousands|हज़ार|हजार)\b/gi, "1000");

    return result;
  };

  const processVoiceCommand = (text) => {
    setIsProcessing(true);
    // Convert spoken digit words to numerals for better matching
    const normalizedText = wordsToNumbers(text);
    const lowerText = normalizedText.toLowerCase();
    let fieldUpdated = false;
    
    // Extract patient name - more flexible patterns
    if (lowerText.includes('नाम') || lowerText.includes('naam') || lowerText.includes('name')) {
      const nameMatch = normalizedText.match(/(?:नाम|naam|name)\s+(.+?)(?:\s+उम्र|\s+age|\s+फोन|\s+phone|\s+mobile|\s+email|\s+address|\s+लिंग|\s+gender|\s+chief|\s+blood|\s+vitals|$)/i);
      if (nameMatch) {
        const cleanName = nameMatch[1].trim().replace(/\s+/g, ' ');
        setPatientData(prev => ({ ...prev, name: cleanName }));
        setVoiceFilledFields(prev => ({ ...prev, name: true }));
        fieldUpdated = true;
      }
    }

    // Extract age - handles both "age 25" and "25 age/साल/वर्ष/year"
    if (lowerText.includes('उम्र') || lowerText.includes('age') || /\d+\s*(साल|वर्ष|year)/.test(lowerText)) {
      // Try keyword-first: "age 24", then number-first: "24 साल"
      const ageMatchA = normalizedText.match(/(?:उम्र|age)\s+(\d+)/i);
      const ageMatchB = normalizedText.match(/(\d+)\s*(?:साल|वर्ष|year)/i);
      const ageMatch = ageMatchA || ageMatchB;
      if (ageMatch) {
        const cleanAge = ageMatch[1].trim();
        setPatientData(prev => ({ ...prev, age: cleanAge }));
        setVoiceFilledFields(prev => ({ ...prev, age: true }));
        fieldUpdated = true;
      }
    }

    // Extract gender - Use word boundaries (\b) to prevent "female" triggering "male"
    if (/\b(महिला|female|femail|औरत)\b/.test(lowerText)) {
      setPatientData(prev => ({ ...prev, gender: 'female' }));
      setVoiceFilledFields(prev => ({ ...prev, gender: true }));
      fieldUpdated = true;
    } else if (/\b(पुरुष|male|mail|mael|आदमी)\b/.test(lowerText)) {
      setPatientData(prev => ({ ...prev, gender: 'male' }));
      setVoiceFilledFields(prev => ({ ...prev, gender: true }));
      fieldUpdated = true;
    }

    // Extract phone/mobile - handles "mobile", "phone", "फोन", "मोबाइल"
    if (
      lowerText.includes('फोन') ||
      lowerText.includes('phone') ||
      lowerText.includes('mobile') ||
      lowerText.includes('मोबाइल')
    ) {
      // Handles: "phone 1234567890", "mobile number 123 333 555", "phone number is 9876543210"
      const phoneMatch =
        normalizedText.match(/(?:फोन|phone|mobile|मोबाइल)\s+number\s+(?:is\s+)?([\d][\d\s\-\+\(\)]*)/i) ||
        normalizedText.match(/(?:फोन|phone|mobile|मोबाइल)\s+(?:is\s+)?([\d][\d\s\-\+\(\)]*)/i);
      if (phoneMatch) {
        const cleanPhone = phoneMatch[1].replace(/[\s\-\(\)]/g, '').trim();
        if (cleanPhone.length >= 3) {
          setPatientData(prev => ({ ...prev, phone: cleanPhone }));
          setVoiceFilledFields(prev => ({ ...prev, phone: true }));
          fieldUpdated = true;
        }
      }
    }

    // Extract email — speech API outputs "at" and "dot" as words, not symbols
    // Also handles speech recognition inserting spaces mid-word e.g. "yadav singh" instead of "yadavsingh"
    if (lowerText.includes('email') || lowerText.includes('ईमेल') || lowerText.includes('@') || lowerText.includes(' at ')) {
      // Step 1: isolate the portion after the "email" keyword
      const emailKeywordMatch = normalizedText.match(/(?:email|ईमेल)\s+(.+?)(?:\s+address|\s+phone|\s+mobile|\s+chief|\s+complaint|\s+blood|\s+bp|$)/i);
      let emailRaw = emailKeywordMatch ? emailKeywordMatch[1].trim() : normalizedText;

      // Step 2: convert spoken words → email symbols first (before stripping spaces)
      let emailConverted = emailRaw
        .replace(/\s+at\s+/gi, '@')        // "mohit at gmail" → "mohit@gmail"
        .replace(/\s+dot\s+/gi, '.')        // "gmail dot com" → "gmail.com"
        .replace(/\s+underscore\s+/gi, '_')
        .replace(/\s+dash\s+/gi, '-')
        .replace(/\s+hyphen\s+/gi, '-');

      // Step 3: strip spaces from the local part (before @) since speech recognition
      // often inserts spaces mid-word e.g. "yadav singh@gmail.com" → "yadavsingh@gmail.com"
      if (emailConverted.includes('@')) {
        const atIdx = emailConverted.indexOf('@');
        const localPart = emailConverted.slice(0, atIdx).replace(/\s+/g, '');  // remove all spaces
        const domainPart = emailConverted.slice(atIdx + 1).replace(/\s+/g, ''); // remove all spaces from domain too
        emailConverted = localPart + '@' + domainPart;
      } else {
        emailConverted = emailConverted.replace(/\s+/g, ''); // no @ found, strip all spaces
      }

      // Step 4: match a valid email in the converted string
      const emailMatch = emailConverted.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        setPatientData(prev => ({ ...prev, email: emailMatch[1].toLowerCase().trim() }));
        setVoiceFilledFields(prev => ({ ...prev, email: true }));
        fieldUpdated = true;
      }
    }

    // Extract Address
    if (lowerText.includes('address') || lowerText.includes('पता')) {
      const addressMatch = normalizedText.match(/(?:address|पता)\s+(.+?)(?:\s+फोन|\s+phone|\s+mobile|\s+email|\s+ईमेल|\s+chief|\s+मुख्य|\s+blood|\s+bp|\s+temp|\s+sugar|\s+weight|\s+wait|\s+spo|\s+oxygen|$)/i);
      if (addressMatch) {
        setPatientData(prev => ({ ...prev, address: addressMatch[1].trim() }));
        setVoiceFilledFields(prev => ({ ...prev, address: true }));
        fieldUpdated = true;
      }
    }

    // Extract Chief Complaint
    if (lowerText.includes('chief complaint') || lowerText.includes('मुख्य समस्या') || lowerText.includes('complaint') || lowerText.includes('समस्या')) {
      const complaintMatch = normalizedText.match(/(?:chief complaint|मुख्य समस्या|complaint|समस्या)\s+(.+?)(?:\s+address|\s+पता|\s+फोन|\s+phone|\s+mobile|\s+email|\s+ईमेल|\s+blood|\s+bp|\s+temp|\s+sugar|\s+weight|\s+wait|\s+spo|\s+oxygen|$)/i);
      if (complaintMatch) {
        setPatientData(prev => ({ ...prev, chiefComplaint: complaintMatch[1].trim() }));
        setVoiceFilledFields(prev => ({ ...prev, chiefComplaint: true }));
        fieldUpdated = true;
      }
    }

    // Extract Doctor Assignment
    // Supports all variants:
    //   "assign doctor Satyam", "assigned doctor Satyam", "doctor assign Satyam", "doctor assigned Satyam"
    //   "assign Dr. Satyam Thakur", "assigned Dr. Satyam Thakur" (Dr. prefix inline)
    //   "assigned Satyam", "assign Satyam" (minimal form)
    //   "डॉक्टर सत्यम"
    const DOCTOR_ASSIGN_TRIGGERS = [
      'doctor assign', 'assign doctor', 'assigned doctor', 'doctor assigned',
      'assign dr', 'assigned dr',   // handles "assigned Dr. Satyam" where speech drops the dot
      'assign',                      // minimal: "assign Satyam Thakur"
      'assigned',                    // minimal: "assigned Satyam Thakur"
      'डॉक्टर'
    ];
    // Use longest-match-first so "assigned doctor" beats "assigned"
    const sortedTriggers = [...DOCTOR_ASSIGN_TRIGGERS].sort((a, b) => b.length - a.length);
    const matchedTrigger = sortedTriggers.find(t => lowerText.includes(t));

    if (matchedTrigger) {
      // Build a regex that finds the trigger then optionally skips a "Dr." prefix
      // and then captures the doctor name up to a field boundary
      const escapedTrigger = matchedTrigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const doctorRegex = new RegExp(
        `(?:${escapedTrigger})\\s+(?:dr\\.?\\s*)?(.+?)(?:\\s+name|\\s+age|\\s+gender|\\s+phone|\\s+email|\\s+address|$)`,
        'i'
      );
      const doctorMatch = normalizedText.match(doctorRegex);

      if (doctorMatch) {
        // Strip any residual "Dr." prefix from captured name
        const rawSpoken = doctorMatch[1].trim();
        const cleanSpoken = rawSpoken.replace(/^Dr\.?\s*/i, '').toLowerCase();

        // Always use the ref so we never read stale clinicDoctors state
        const doctors = clinicDoctorsRef.current;

        // Fuzzy match: check if doctor's name overlaps the spoken words
        const matched = doctors.find(d => {
          const cleanDocName = d.name.replace(/^Dr\.?\s*/i, '').toLowerCase();
          return (
            cleanDocName.includes(cleanSpoken) ||
            cleanSpoken.includes(cleanDocName) ||
            cleanSpoken.includes(cleanDocName.split(' ')[0]) || // first-name match
            cleanDocName.split(' ').some(word => word.length > 2 && cleanSpoken.includes(word)) // any word match (skip tiny words)
          );
        });

        if (matched) {
          setPatientData(prev => ({ ...prev, assigned_doctor_id: matched.id }));
          setVoiceFilledFields(prev => ({ ...prev, assigned_doctor_id: true }));
          toast.success(`Doctor assigned: ${matched.name}`);
          fieldUpdated = true;
        } else {
          toast.error(`Doctor "${rawSpoken}" not found in clinic. Available: ${doctors.map(d => d.name).join(', ')}`);
        }
      }
    }

    // --- VITALS EXTRACTION ---
    
    // Blood Pressure
    if (lowerText.includes('blood pressure') || lowerText.includes('bp') || lowerText.includes('रक्तचाप')) {
      // Find all matches and take the last one in case user repeats
      const matches = [...normalizedText.matchAll(/(?:blood pressure|bp|रक्तचाप)\s*(?:is)?\s*(\d{2,3}(?:[\/\s(over)]+\d{2,3})?)/gi)];
      if (matches.length > 0) {
        const bpMatch = matches[matches.length - 1];
        let cleanBp = bpMatch[1].replace(/\s*over\s*/i, '/').replace(/\s+/g, '');
        if (!cleanBp.includes('mmHg')) cleanBp += ' mmHg';
        setPatientData(prev => ({ ...prev, bp: cleanBp }));
        setVoiceFilledFields(prev => ({ ...prev, bp: true }));
        fieldUpdated = true;
      }
    }

    // Temperature
    if (lowerText.includes('temperature') || lowerText.includes('temp') || lowerText.includes('तापमान') || lowerText.includes('बुखार')) {
      const matches = [...normalizedText.matchAll(/(?:temperature|temp|तापमान|बुखार)\s*(?:is)?\s*(\d{2,3}(?:\.\d{1,2})?)/gi)];
      if (matches.length > 0) {
        const tempMatch = matches[matches.length - 1];
        let cleanTemp = tempMatch[1].trim();
        if (!cleanTemp.includes('°')) cleanTemp += ' °F';
        setPatientData(prev => ({ ...prev, temperature: cleanTemp }));
        setVoiceFilledFields(prev => ({ ...prev, temperature: true }));
        fieldUpdated = true;
      }
    }

    // Blood Sugar
    if (lowerText.includes('blood sugar') || lowerText.includes('sugar') || lowerText.includes('शुगर')) {
      const matches = [...normalizedText.matchAll(/(?:blood sugar|sugar|शुगर)\s*(?:is)?\s*(\d{2,3}(?:\.\d{1,2})?)/gi)];
      if (matches.length > 0) {
        const sugarMatch = matches[matches.length - 1];
        let cleanSugar = sugarMatch[1].trim();
        if (!cleanSugar.includes('mg')) cleanSugar += ' mg/dL';
        setPatientData(prev => ({ ...prev, sugar: cleanSugar }));
        setVoiceFilledFields(prev => ({ ...prev, sugar: true }));
        fieldUpdated = true;
      }
    }

    // Weight - handles "wait" since voice sometimes transcribes poorly
    if (lowerText.includes('weight') || lowerText.includes('wait') || lowerText.includes('वज़न') || lowerText.includes('वजन')) {
      const matches = [...normalizedText.matchAll(/(?:weight|wait|wet|वज़न|वजन)\s*(?:is)?\s*(\d{2,3}(?:\.\d{1,2})?)/gi)];
      if (matches.length > 0) {
        const weightMatch = matches[matches.length - 1];
        let cleanWeight = weightMatch[1].trim();
        if (!cleanWeight.includes('kg') && !cleanWeight.includes('kilo')) cleanWeight += ' kg';
        setPatientData(prev => ({ ...prev, weight: cleanWeight }));
        setVoiceFilledFields(prev => ({ ...prev, weight: true }));
        fieldUpdated = true;
      }
    }

    // SpO2 / Oxygen
    if (lowerText.includes('spo2') || lowerText.includes('spo') || lowerText.includes('oxygen') || lowerText.includes('ऑक्सीजन')) {
      const matches = [...normalizedText.matchAll(/(?:spo\s*2|spo2|spo|oxygen|ऑक्सीजन)\s*(?:is)?\s*(\d{2,3})/gi)];
      if (matches.length > 0) {
        const spo2Match = matches[matches.length - 1];
        let cleanSpo2 = spo2Match[1].trim();
        // Edge case: if transript merged "SPO 2" with "98" giving "SPO 298"
        if (cleanSpo2.length === 3 && cleanSpo2.startsWith('2')) {
          cleanSpo2 = cleanSpo2.substring(1);
        }
        if (!cleanSpo2.includes('%')) cleanSpo2 += '%';
        setPatientData(prev => ({ ...prev, spo2: cleanSpo2 }));
        setVoiceFilledFields(prev => ({ ...prev, spo2: true }));
        fieldUpdated = true;
      }
    }
    // Clear All Command
    if (lowerText.includes('clear all') || lowerText.includes('clear') || lowerText.includes('साफ़ करें') || lowerText.includes('सफाई') || lowerText.includes('reset')) {
      setPatientData({
        id: null,
        name: '',
        age: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        chiefComplaint: '',
        assigned_doctor_id: user?.role === 'doctor' ? user.id : '',
        bp: '',
        temperature: '',
        sugar: '',
        weight: '',
        spo2: ''
      });
      setVoiceFilledFields({});
      setTranscript('');
      toast.success(language === 'hi' ? 'सभी फ़ील्ड साफ़ हो गए हैं' : 'All fields cleared');
      fieldUpdated = true;
    }

    // Save/Submit Command
    if (lowerText.includes('save') || lowerText.includes('submit') || lowerText.includes('सेव') || lowerText.includes('बचाएं') || lowerText.includes('सबमिट')) {
      // Stop mic first
      if (isListeningRef.current && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      
      // Trigger save
      setTimeout(() => {
        savePatient();
      }, 500);
      fieldUpdated = true;
    }

    setTimeout(() => setIsProcessing(false), 500);
  };

  const selectLanguage = (lang) => {
    setLanguage(lang);
    if (recognition) {
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Your browser does not support Voice Recognition. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const savePatient = async () => {
    // Get latest data from ref to solve closure scope issue from speech recognition
    const currentPatientData = patientDataRef.current;
    
    const trimmedData = {
      name: String(currentPatientData.name || '').trim(),
      age: String(currentPatientData.age || '').trim(),
      gender: String(currentPatientData.gender || '').trim(),
      phone: String(currentPatientData.phone || '').trim(),
      email: String(currentPatientData.email || '').trim(),
      address: String(currentPatientData.address || '').trim(),
      chief_complaint: currentPatientData.chiefComplaint ? String(currentPatientData.chiefComplaint).trim() : 'Patient consultation',
      doctor_id: currentPatientData.assigned_doctor_id || null,
      bp: String(currentPatientData.bp || '').trim(),
      temperature: String(currentPatientData.temperature || '').trim(),
      sugar: String(currentPatientData.sugar || '').trim(),
      weight: String(currentPatientData.weight || '').trim(),
      spo2: String(currentPatientData.spo2 || '').trim()
    };

    // Check required fields with better validation FIRST (before updating state)
    // Added by Qaisar Moin: Custom error codes mapping for name, age, gender validation
    if (!trimmedData.name || trimmedData.name.length < 2) {
      toast.error(language === 'hi' ? '[REC-MISSING-NAME] कृपया नाम भरें (कम से कम 2 अक्षर)' : '[REC-MISSING-NAME] Please enter name (minimum 2 characters)');
      return;
    }

    if (!trimmedData.age || trimmedData.age.length < 1) {
      toast.error(language === 'hi' ? '[REC-MISSING-AGE] कृपया उम्र भरें' : '[REC-MISSING-AGE] Please enter age');
      return;
    }

    if (!trimmedData.gender) {
      toast.error(language === 'hi' ? '[REC-MISSING-GENDER] कृपया लिंग चुनें' : '[REC-MISSING-GENDER] Please select gender');
      return;
    }

    if (!trimmedData.doctor_id) {
      toast.error(language === 'hi' ? '[REC-MISSING-DOCTOR] कृपया एक डॉक्टर चुनें' : '[REC-MISSING-DOCTOR] Please assign a doctor before saving');
      return;
    }

    // Only update state after validation passes
    setPatientData({
      ...trimmedData,
      chiefComplaint: trimmedData.chief_complaint
    });

    setLoading(true);

    try {
      const apiPayload = {
        ...trimmedData,
        chief_complaint: trimmedData.chief_complaint
      };
      
      const response = currentPatientData.id 
        ? await patientAPI.updatePatient(currentPatientData.id, apiPayload)
        : await patientAPI.createPatient(apiPayload);
      
      if (response.success) {
        const generatedPatientId = currentPatientData.id || response.data?.id;
        
        // --- Save Vitals if any exist ---
        const hasVitals = trimmedData.bp || trimmedData.temperature || trimmedData.sugar || trimmedData.weight || trimmedData.spo2;
        if (hasVitals && generatedPatientId) {
          try {
            await patientAPI.updateVitals(generatedPatientId, {
              bp: trimmedData.bp || '',
              temperature: trimmedData.temperature || '',
              sugar: trimmedData.sugar || '',
              weight: trimmedData.weight || '',
              spo2: trimmedData.spo2 || ''
            });
          } catch (vitalsErr) {
            console.error('Failed to attach vitals:', vitalsErr);
            toast.error('[API-VITALS-WARN] Patient saved, but vitals could not be attached.');
          }
        }

        toast.success(language === 'hi' ? 'मरीज सफलतापूर्वक सेव हो गया!' : 'Patient saved successfully!');
        setPatientData({
          id: null,
          name: '',
          age: '',
          gender: '',
          phone: '',
          email: '',
          address: '',
          chiefComplaint: '',
          assigned_doctor_id: user?.role === 'doctor' ? user.id : '',
          bp: '',
          temperature: '',
          sugar: '',
          weight: '',
          spo2: ''
        });
        setVoiceFilledFields({});
        setTranscript('');
        fetchPatients();
      } else {
        toast.error((language === 'hi' ? '[API-REC-SAVE-FAIL] मरीज सेव करने में असफल: ' : '[API-REC-SAVE-FAIL] Failed to save patient: ') + response.message);
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(language === 'hi' ? '[API-REC-NETWORK-ERR] मरीज सेव करने में त्रुटि। कृपया फिर से कोशिश करें।' : '[API-REC-NETWORK-ERR] Error saving patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async (searchTerm = '') => {
    try {
      const response = await patientAPI.getAllPatients({ limit: 5, search: searchTerm });
      if (response.success) {
        setAllPatients(response.data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Fetch doctors in the clinic to populate the doctor dropdown
  const fetchClinicDoctors = async () => {
    try {
      const response = await staffAPI.getDoctors();
      if (response.success) {
        setClinicDoctors(response.data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching clinic doctors:', error);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchClinicDoctors();
  }, []);

  // Keyboard shortcuts for mic control
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl + M → Mic toggle
      if (event.ctrlKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        toggleListening();
      }

      // Spacebar → Mic toggle (only when not focused on input/textarea)
      if (event.code === 'Space' && event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleListening]);

  const handleInputChange = (field, value) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
    // Clear voice-filled indicator when manually edited
    if (voiceFilledFields[field]) {
      setVoiceFilledFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const handlePatientSelect = (patient) => {
    setPatientData({
      id: patient.id,
      name: patient.name || '',
      age: patient.age || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      chiefComplaint: patient.chief_complaint || '',
      assigned_doctor_id: patient.doctor_id || '',
      bp: patient.bp || '',
      temperature: patient.temperature || '',
      sugar: patient.sugar || '',
      weight: patient.weight || '',
      spo2: patient.spo2 || ''
    });
    setVoiceFilledFields({});
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  // Check for first-time visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('receptionist-voice-visited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      setShowHowToGuide(true);
      localStorage.setItem('receptionist-voice-visited', 'true');
    }
  }, []);

  return (
    <div className="flex flex-col xl:h-full space-y-4 xl:overflow-hidden">
      {/* Page Header */}
      <div className="bg-white p-4 px-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Voice-powered patient registration system
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-200 transition-all font-medium text-sm"
          >
            <span>{language === 'en' ? 'Switch to Hindi (हिंदी)' : 'English (अंग्रेजी) में बदलें'}</span>
          </button>
          
          <button
            onClick={() => setShowHowToGuide(true)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="How to Use"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 xl:min-h-0">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:h-full">
          {/* LEFT PANEL - Patient Form */}
          <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col xl:h-full xl:overflow-hidden min-h-[500px]">
            <PatientForm
              patientData={patientData}
              onChange={handleInputChange}
              onSave={savePatient}
              loading={loading}
              language={language}
              voiceFilledFields={voiceFilledFields}
              translations={translations}
              clinicDoctors={clinicDoctors}
              userRole={user?.role}
            />
          </div>

          {/* CENTER PANEL - Voice Controller */}
          <div className="xl:col-span-4 flex flex-col gap-6 xl:h-full xl:overflow-hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex-1 xl:overflow-hidden flex flex-col min-h-[400px]">
              <VoiceController
                isListening={isListening}
                isProcessing={isProcessing}
                onToggle={toggleListening}
                language={language}
                translations={translations}
              />
            </div>
            
            <div className="h-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-shrink-0">
              <TranscriptPanel
                transcript={transcript}
                onClear={clearTranscript}
                language={language}
                translations={translations}
              />
            </div>
          </div>

          {/* RIGHT PANEL - Recent Patients */}
          <div className="xl:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col xl:h-full xl:overflow-hidden min-h-[400px]">
            <RecentPatients
              patients={allPatients}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPatientSelect={handlePatientSelect}
              language={language}
              translations={translations}
            />
          </div>
        </div>
      </div>

      {/* How to Use Guide */}
      <HowToUseGuide
        isOpen={showHowToGuide}
        onClose={(open) => setShowHowToGuide(open)}
        language={language}
      />
    </div>
  );
}
