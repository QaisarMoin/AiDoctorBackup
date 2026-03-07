import React from 'react';
import { FileText, Calendar } from 'lucide-react';

// Added by Qaisar Moin: Hindi Translations for Doctor Advice
const TRANSLATIONS = {
  en: {
    title: 'Doctor Advice & Follow-up',
    advice: 'Doctor Advice',
    advicePlaceholder: 'Enter comprehensive advice for the patient including lifestyle modifications, precautions, and self-care measures...',
    followUpTitle: 'Follow-up Instructions',
    followUpDays: 'Follow-up After (days)',
    followUpInstructions: 'Follow-up Instructions',
    followUpPlaceholder: 'e.g., Review test reports, Assess improvement',
    quickTemplates: 'Quick Advice Templates',
    templates: [
      {
        title: 'General Care',
        template: 'Take adequate rest. Maintain proper hydration. Eat balanced meals. Avoid strenuous activities until recovery.'
      },
      {
        title: 'Fever Management',
        template: 'Monitor temperature every 4 hours. Take sponge bath for high temperature. Increase fluid intake. Watch for danger signs.'
      },
      {
        title: 'Post-Procedure Care',
        template: 'Keep the area clean and dry. Watch for signs of infection. Take prescribed medications regularly. Follow up as scheduled.'
      },
      {
        title: 'Lifestyle Changes',
        template: 'Exercise regularly for 30 minutes daily. Follow a healthy diet rich in fruits and vegetables. Get adequate sleep of 7-8 hours.'
      }
    ]
  },
  hindi: {
    title: 'डॉक्टर की सलाह और फॉलो-अप (Doctor Advice & Follow-up)',
    advice: 'डॉक्टर की सलाह (Doctor Advice)',
    advicePlaceholder: 'मरीज के लिए विस्तृत सलाह दर्ज करें जिसमें जीवनशैली में बदलाव, सावधानियां और स्वयं की देखभाल शामिल हो...',
    followUpTitle: 'फॉलो-अप के निर्देश (Follow-up Instructions)',
    followUpDays: 'फॉलो-अप कितने दिन बाद? (days)',
    followUpInstructions: 'फॉलो-अप में क्या करना है?',
    followUpPlaceholder: 'जैसे: टेस्ट रिपोर्ट दिखाएं, सुधार का आकलन करें',
    quickTemplates: 'तुरंत सलाह टेम्पलेट (Quick Advice Templates)',
    templates: [
      {
        title: 'सामान्य देखभाल (General Care)',
        template: 'पर्याप्त आराम करें। शरीर में पानी की कमी न होने दें। संतुलित आहार लें। ठीक होने तक भारी काम करने से बचें।'
      },
      {
        title: 'बुखार प्रबंधन (Fever Management)',
        template: 'हर 4 घंटे में तापमान जांचें। तेज बुखार में स्पंज बाथ लें। तरल पदार्थ ज्यादा लें। खतरे के संकेतों पर नजर रखें।'
      },
      {
        title: 'प्रक्रिया के बाद की देखभाल (Post Procedure)',
        template: 'जगह को साफ और सूखा रखें। संक्रमण (इन्फेक्शन) के संकेतों पर नजर रखें। नियमित रूप से बताई गई दवा लें।'
      },
      {
        title: 'जीवनशैली में बदलाव (Lifestyle Changes)',
        template: 'रोज 30 मिनट व्यायाम करें। फल और सब्जियों से भरपूर स्वस्थ आहार लें। 7-8 घंटे की पर्याप्त नींद लें।'
      }
    ]
  }
};

export default function DoctorAdviceSection({ advice, followUpDays, followUpInstructions, onUpdate, language = 'en' }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
      </div>

      <div className="space-y-4">
        {/* Doctor Advice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.advice}
          </label>
          <textarea
            value={advice}
            onChange={(e) => onUpdate('doctorAdvice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            rows={4}
            placeholder={t.advicePlaceholder}
          />
        </div>

        {/* Follow-up Section */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium text-orange-900">{t.followUpTitle}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-1">
                {t.followUpDays}
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={followUpDays}
                onChange={(e) => onUpdate('followUpDays', parseInt(e.target.value) || 7)}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-700 mb-1">
                {t.followUpInstructions}
              </label>
              <input
                type="text"
                value={followUpInstructions}
                onChange={(e) => onUpdate('followUpInstructions', e.target.value)}
                placeholder={t.followUpPlaceholder}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Common Advice Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.quickTemplates}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {t.templates.map((template) => (
              <button
                key={template.title}
                onClick={() => onUpdate('doctorAdvice', advice ? advice + '\n\n' + template.template : template.template)}
                className="text-left px-3 py-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-lg text-sm transition-colors"
              >
                <div className="font-medium text-gray-900">{template.title}</div>
                <div className="text-xs text-gray-600 mt-1 line-clamp-2">{template.template}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
