import React, { useState, useEffect } from 'react';
import { Activity, Plus, X } from 'lucide-react';
import { clinicSettingsAPI } from '../../services/api';

const categoryMeta = {
  blood: { name: 'Blood Tests', icon: '🩸' },
  imaging: { name: 'Imaging', icon: '📷' },
  laboratory: { name: 'Laboratory', icon: '🔬' },
  cardiac: { name: 'Cardiac', icon: '❤️' },
  other: { name: 'Other', icon: '📋' }
};

// Added by Qaisar Moin: Hindi Translations for Tests Section
const TRANSLATIONS = {
  en: {
    title: 'Recommended Tests',
    availableTests: 'Available Tests',
    selectedTests: 'Selected Tests',
    noTests: 'No tests selected',
    clickToAdd: 'Click on tests above to add them',
    urgency: 'Urgency',
    routine: 'Routine',
    urgent: 'Urgent',
    stat: 'STAT',
    instructions: 'Instructions',
    instructionsPlaceholder: 'e.g., Fasting required'
  },
  hindi: {
    title: 'सुझाए गए टेस्ट (Recommended Tests)',
    availableTests: 'उपलब्ध टेस्ट (Available Tests)',
    selectedTests: 'चुने गए टेस्ट (Selected Tests)',
    noTests: 'कोई टेस्ट नहीं चुना गया',
    clickToAdd: 'टेस्ट जोड़ने के लिए ऊपर क्लिक करें',
    urgency: 'तत्काल आवश्यकता (Urgency)',
    routine: 'सामान्य (Routine)',
    urgent: 'ज़रूरी (Urgent)',
    stat: 'तुरंत (STAT)',
    instructions: 'निर्देश (Instructions)',
    instructionsPlaceholder: 'जैसे: खाली पेट आना है'
  }
};

export default function TestsSection({ tests, onUpdate, language = 'en' }) {
  const [selectedCategory, setSelectedCategory] = useState('blood');
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const [groupedTests, setGroupedTests] = useState({ 
    blood: [], imaging: [], laboratory: [], cardiac: [], other: [] 
  });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await clinicSettingsAPI.getTests();
        if (res?.data) {
          const grouped = { blood: [], imaging: [], laboratory: [], cardiac: [], other: [] };
          res.data.forEach(test => {
            const cat = test.category?.toLowerCase() || 'other';
            if (grouped[cat]) {
              grouped[cat].push(test);
            } else {
              grouped.other.push(test);
            }
          });
          setGroupedTests(grouped);
        }
      } catch (err) {
        console.error("Failed to fetch clinic tests:", err);
      }
    };
    fetchTests();
  }, []);

  const addTest = (testName, category) => {
    const newTest = {
      id: Date.now(),
      name: testName,
      category: category,
      urgency: 'routine',
      instructions: ''
    };
    onUpdate([...tests, newTest]);
  };

  const removeTest = (testId) => {
    onUpdate(tests.filter(test => test.id !== testId));
  };

  const updateTest = (testId, field, value) => {
    onUpdate(tests.map(test => 
      test.id === testId ? { ...test, [field]: value } : test
    ));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {Object.entries(categoryMeta).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{meta.icon}</span>
            <span>{meta.name}</span>
          </button>
        ))}
      </div>

      {/* Available Tests */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t.availableTests}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {groupedTests[selectedCategory]?.length > 0 ? (
            groupedTests[selectedCategory].map(test => (
              <button
                key={test.id}
                onClick={() => addTest(test.name, selectedCategory)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm transition-colors text-left"
              >
                <Plus className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{test.name}</span>
              </button>
            ))
          ) : (
             <p className="text-xs text-gray-400 col-span-full">No custom tests added in this category for this clinic yet.</p>
          )}
        </div>
      </div>

      {/* Selected Tests */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          {t.selectedTests} ({tests.length})
        </h4>
        {tests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t.noTests}</p>
            <p className="text-xs text-gray-400 mt-1">{t.clickToAdd}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{test.name}</h5>
                    <p className="text-sm text-gray-600">
                      {categoryMeta[test.category]?.name || test.category}
                    </p>
                  </div>
                  <button
                    onClick={() => removeTest(test.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.urgency}
                    </label>
                    <select
                      value={test.urgency}
                      onChange={(e) => updateTest(test.id, 'urgency', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="routine">{t.routine}</option>
                      <option value="urgent">{t.urgent}</option>
                      <option value="stat">{t.stat}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.instructions}
                    </label>
                    <input
                      type="text"
                      value={test.instructions || ''}
                      onChange={(e) => updateTest(test.id, 'instructions', e.target.value)}
                      placeholder={t.instructionsPlaceholder}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
