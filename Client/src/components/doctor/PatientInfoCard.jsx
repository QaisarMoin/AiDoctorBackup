import React from 'react';
import { User, Activity, Phone, Mail, MapPin, Calendar } from 'lucide-react';

// Added by Qaisar Moin: Hindi Translations for Patient Info
const TRANSLATIONS = {
  en: {
    contact: 'Contact',
    vitals: 'Vitals',
    weight: 'Weight',
    bp: 'Blood Pressure',
    temp: 'Temperature',
    hr: 'Heart Rate',
    spo2: 'SpO2',
    chiefComplaint: 'Chief Complaint',
    history: 'History',
    years: 'years',
    kg: 'kg',
    bpm: 'bpm'
  },
  hindi: {
    contact: 'संपर्क (Contact)',
    vitals: 'मुख्य संकेत (Vitals)',
    weight: 'वजन (Weight)',
    bp: 'रक्तचाप (Blood Pressure)',
    temp: 'तापमान (Temperature)',
    hr: 'हृदय गति (Heart Rate)',
    spo2: 'ऑक्सीजन (SpO2)',
    chiefComplaint: 'मुख्य समस्या (Chief Complaint)',
    history: 'इतिहास (History)',
    years: 'साल',
    kg: 'किलो',
    bpm: 'bpm'
  }
};

export default function PatientInfoCard({ patient, language = 'en' }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
        <p className="text-sm text-gray-600">{patient.age} {t.years} • {patient.gender}</p>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t.contact}</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{patient.phone || '—'}</span>
          </div>
          {patient.email && (
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{patient.email}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{patient.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Vitals */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t.vitals}</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.weight}</span>
            <span className="text-sm font-medium text-gray-900">{patient.weight ? `${patient.weight} ${t.kg}` : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.bp}</span>
            <span className="text-sm font-medium text-gray-900">{patient.bp || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.temp}</span>
            <span className="text-sm font-medium text-gray-900">{patient.temperature || '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.hr}</span>
            <span className="text-sm font-medium text-gray-900">{patient.pulse_rate ? `${patient.pulse_rate} ${t.bpm}` : '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t.spo2}</span>
            <span className="text-sm font-medium text-gray-900">{patient.spo2 || '—'}</span>
          </div>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t.chiefComplaint}</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">{patient.chief_complaint || patient.chiefComplaint || 'No complaint recorded.'}</p>
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{t.history}</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{patient.history || 'No history recorded.'}</p>
        </div>
      </div>
    </div>
  );
}
