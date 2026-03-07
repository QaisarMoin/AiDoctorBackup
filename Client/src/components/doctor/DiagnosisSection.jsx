import React from 'react';
import { FileText, Edit3 } from 'lucide-react';

// Added by Qaisar Moin: Hindi Translations for Diagnosis
const TRANSLATIONS = {
  en: {
    title: 'Diagnosis',
    provisional: 'Provisional Diagnosis *',
    provisionalPlaceholder: 'Enter provisional diagnosis...',
    notes: 'Clinical Notes',
    notesPlaceholder: 'Enter detailed clinical findings, observations, and differential diagnosis...'
  },
  hindi: {
    title: 'बीमारी का निदान (Diagnosis)',
    provisional: 'प्राथमिक निदान (Provisional Diagnosis) *',
    provisionalPlaceholder: 'प्राथमिक निदान दर्ज करें...',
    notes: 'क्लिनिकल नोट्स (Clinical Notes)',
    notesPlaceholder: 'विस्तृत क्लिनिकल निष्कर्ष, अवलोकन और संभावित निदान दर्ज करें...'
  }
};

export default function DiagnosisSection({ diagnosisProvisional, diagnosisNotes, onUpdate, language = 'en' }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
      </div>

      <div className="space-y-4">
        {/* Provisional Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.provisional}
          </label>
          <textarea
            value={diagnosisProvisional}
            onChange={(e) => onUpdate('diagnosisProvisional', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder={t.provisionalPlaceholder}
          />
        </div>

        {/* Diagnosis Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.notes}
          </label>
          <textarea
            value={diagnosisNotes}
            onChange={(e) => onUpdate('diagnosisNotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            placeholder={t.notesPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
