import React from 'react';
import { Save, Volume2, Stethoscope } from 'lucide-react';

export default function PatientForm({ 
  patientData, 
  onChange, 
  onSave, 
  loading, 
  language,
  voiceFilledFields = {},
  translations,
  clinicDoctors = [],
  userRole
}) {
  const t = translations[language];

  const getFieldClass = (fieldName) => {
    const baseClass = "w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const isVoiceFilled = voiceFilledFields[fieldName];
    
    if (isVoiceFilled) {
      return `${baseClass} border-blue-400 bg-blue-50`;
    }
    return `${baseClass} border-gray-300 bg-white`;
  };

  const renderFieldWithIndicator = (fieldName, label, required = false) => {
    const isVoiceFilled = voiceFilledFields[fieldName];
    
    return (
      <div className="relative">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {isVoiceFilled && (
            <span className="ml-2 inline-flex items-center text-[10px] text-blue-600">
              <Volume2 className="w-3 h-3 mr-1" />
              {language === 'hi' ? 'वॉइस से' : 'Voice'}
            </span>
          )}
        </label>
      </div>
    );
  };

  const isDoctorRole = userRole === 'doctor';
  const isReceptionistRole = userRole === 'receptionist' || userRole === 'admin';

  // Find the currently selected doctor name (for doctor pre-fill display)
  const selectedDoctor = clinicDoctors.find(d => d.id === patientData.assigned_doctor_id || d.id === Number(patientData.assigned_doctor_id));

  return (
    <div className="h-full flex flex-col">
      {/* Form Header */}
      <div className="mb-3 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{t.patientInfo || 'Patient Information'}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {language === 'hi' 
              ? 'वॉइस से भरे गए फ़ील्ड ब्लू रंग में हाइलाइट होते हैं' 
              : 'Voice-filled fields highlight in blue'}
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {/* Row 1: Name & Age */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            {renderFieldWithIndicator('name', t.name, true)}
            <input
              type="text"
              value={patientData.name}
              onChange={(e) => onChange('name', e.target.value)}
              className={getFieldClass('name')}
              placeholder={language === 'hi' ? 'मरीज का नाम' : 'Patient name'}
            />
          </div>
          <div>
            {renderFieldWithIndicator('age', t.age, true)}
            <input
              type="number"
              value={patientData.age}
              onChange={(e) => onChange('age', e.target.value)}
              className={getFieldClass('age')}
              placeholder={language === 'hi' ? 'उम्र' : 'Age'}
            />
          </div>
        </div>

        {/* Row 2: Gender & Doctor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            {renderFieldWithIndicator('gender', t.gender, true)}
            <select
              value={patientData.gender}
              onChange={(e) => onChange('gender', e.target.value)}
              className={getFieldClass('gender')}
            >
              <option value="">{language === 'hi' ? 'चुनें' : 'Select'}</option>
              <option value="male">{t.male}</option>
              <option value="female">{t.female}</option>
              <option value="other">{t.other}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                {language === 'hi' ? 'डॉक्टर असाइन करें' : 'Assign Doctor'}
                <span className="text-red-500 ml-0.5">*</span>
                {voiceFilledFields['assigned_doctor_id'] && (
                  <span className="ml-1 inline-flex items-center text-[10px] text-blue-600">
                    <Volume2 className="w-3 h-3 mr-1" />
                    {language === 'hi' ? 'वॉइस से' : 'Voice'}
                  </span>
                )}
              </span>
            </label>
            {isDoctorRole ? (
              <div className={`${getFieldClass('assigned_doctor_id')} bg-blue-50 border-blue-300 text-blue-800 font-medium flex items-center gap-1.5 cursor-not-allowed`}>
                <Stethoscope className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                {selectedDoctor ? selectedDoctor.name : (language === 'hi' ? 'आप (डॉक्टर)' : 'You')}
              </div>
            ) : (
              <select
                value={patientData.assigned_doctor_id || ''}
                onChange={(e) => onChange('assigned_doctor_id', e.target.value || null)}
                className={getFieldClass('assigned_doctor_id')}
              >
                <option value="">{language === 'hi' ? 'डॉक्टर चुनें' : 'Select Doctor'}</option>
                {clinicDoctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            )}
            {isReceptionistRole && clinicDoctors.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {language === 'hi' ? 'कोई डॉक्टर रजिस्टर नहीं है' : 'No doctors registered'}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Phone & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            {renderFieldWithIndicator('phone', t.phone)}
            <input
              type="tel"
              value={patientData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className={getFieldClass('phone')}
              placeholder={language === 'hi' ? 'फोन नंबर' : 'Phone'}
            />
          </div>
          <div>
            {renderFieldWithIndicator('email', t.email)}
            <input
              type="email"
              value={patientData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={getFieldClass('email')}
              placeholder={language === 'hi' ? 'ईमेल' : 'Email'}
            />
          </div>
        </div>

        {/* Row 4: Address & Chief Complaint */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            {renderFieldWithIndicator('address', t.address)}
            <textarea
              value={patientData.address}
              onChange={(e) => onChange('address', e.target.value)}
              className={`${getFieldClass('address')} resize-none`}
              rows={1}
              placeholder={language === 'hi' ? 'पता' : 'Address'}
            />
          </div>
          <div>
            {renderFieldWithIndicator('chiefComplaint', t.chiefComplaint || 'Chief Complaint')}
            <textarea
              value={patientData.chiefComplaint}
              onChange={(e) => onChange('chiefComplaint', e.target.value)}
              className={`${getFieldClass('chiefComplaint')} resize-none`}
              rows={1}
              placeholder={language === 'hi' ? 'मुख्य समस्या' : 'Chief Complaint'}
            />
          </div>
        </div>

        {/* --- Vitals Section --- */}
        <div className="pt-3 border-t border-gray-100">
          <h3 className="text-base font-bold text-gray-900 mb-3">{language === 'hi' ? 'वाइटल्स' : 'Vitals'}</h3>
          
          {/* BP & Temp Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              {renderFieldWithIndicator('bp', language === 'hi' ? 'रक्तचाप (BP)' : 'Blood Pressure')}
              <input
                type="text"
                value={patientData.bp || ''}
                onChange={(e) => onChange('bp', e.target.value)}
                className={getFieldClass('bp')}
                placeholder="e.g. 120/80 mmHg"
              />
            </div>
            <div>
              {renderFieldWithIndicator('temperature', language === 'hi' ? 'तापमान (Temp)' : 'Temperature')}
              <input
                type="text"
                value={patientData.temperature || ''}
                onChange={(e) => onChange('temperature', e.target.value)}
                className={getFieldClass('temperature')}
                placeholder="e.g. 98.6 °F"
              />
            </div>
          </div>

          {/* Sugar, Weight, SpO2 Row */}
          <div className="grid grid-cols-3 gap-3 pb-2">
            <div>
              {renderFieldWithIndicator('sugar', language === 'hi' ? 'ब्लड शुगर' : 'Blood Sugar')}
              <input
                type="text"
                value={patientData.sugar || ''}
                onChange={(e) => onChange('sugar', e.target.value)}
                className={`${getFieldClass('sugar')} text-sm`}
                placeholder="e.g. 100 mg/dL"
              />
            </div>
            <div>
              {renderFieldWithIndicator('weight', language === 'hi' ? 'वज़न' : 'Weight')}
              <input
                type="text"
                value={patientData.weight || ''}
                onChange={(e) => onChange('weight', e.target.value)}
                className={`${getFieldClass('weight')} text-sm`}
                placeholder="e.g. 70 kg"
              />
            </div>
            <div>
              {renderFieldWithIndicator('spo2', 'SpO2')}
              <input
                type="text"
                value={patientData.spo2 || ''}
                onChange={(e) => onChange('spo2', e.target.value)}
                className={`${getFieldClass('spo2')} text-sm`}
                placeholder="e.g. 98%"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button - Sticky Bottom */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onSave}
          disabled={loading}
          className="w-full px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? (language === 'hi' ? 'बचा रहे हैं...' : 'Saving...') : t.savePatient}</span>
        </button>
      </div>
    </div>
  );
}
