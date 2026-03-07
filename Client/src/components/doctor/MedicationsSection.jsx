import React, { useState, useEffect } from 'react';
import { Pill, Plus, X, Clock, Utensils } from 'lucide-react';
import { clinicSettingsAPI } from '../../services/api';

// Added by Qaisar Moin: Hindi Translations for Medications
const TRANSLATIONS = {
  en: {
    title: 'Medications',
    addMedicine: 'Add Medicine',
    addNewMedicine: 'Add New Medicine',
    quickSelect: 'Quick Select',
    medicineName: 'Medicine Name *',
    namePlaceholder: 'e.g., Paracetamol 500mg',
    dosage: 'Dosage *',
    dosagePlaceholder: 'e.g., 1 tablet',
    timing: 'Timing',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
    foodRelation: 'Food Relation',
    beforeFood: 'Before Food',
    afterFood: 'After Food',
    withFood: 'With Food',
    noRelation: 'No Food Relation',
    duration: 'Duration *',
    durationPlaceholder: 'e.g., 5 days, 2 weeks',
    instructions: 'Instructions',
    instructionsPlaceholder: 'e.g., Take with plenty of water',
    cancel: 'Cancel',
    noMeds: 'No medications prescribed',
    clickToAdd: 'Click "Add Medicine" to start prescribing',
    moreInstructions: 'Additional instructions'
  },
  hindi: {
    title: 'दवाइयां (Medications)',
    addMedicine: 'दवा जोड़ें (Add Medicine)',
    addNewMedicine: 'नई दवा जोड़ें (Add New Medicine)',
    quickSelect: 'तुरंत चुनें (Quick Select)',
    medicineName: 'दवा का नाम (Medicine Name) *',
    namePlaceholder: 'जैसे: Paracetamol 500mg',
    dosage: 'खुराक (Dosage) *',
    dosagePlaceholder: 'जैसे: 1 गोली',
    timing: 'समय (Timing)',
    morning: 'सुबह (Morning)',
    afternoon: 'दोपहर (Afternoon)',
    evening: 'शाम (Evening)',
    night: 'रात (Night)',
    foodRelation: 'भोजन के साथ (Food Relation)',
    beforeFood: 'खाने से पहले (Before Food)',
    afterFood: 'खाने के बाद (After Food)',
    withFood: 'खाने के साथ (With Food)',
    noRelation: 'कभी भी (Any time)',
    duration: 'कितने दिन (Duration) *',
    durationPlaceholder: 'जैसे: 5 दिन, 2 हफ्ते',
    instructions: 'निर्देश (Instructions)',
    instructionsPlaceholder: 'जैसे: खूब सारा पानी पिएं',
    cancel: 'रद्द करें (Cancel)',
    noMeds: 'कोई दवा नहीं दी गई',
    clickToAdd: 'दवाएं लिखने के लिए "दवा जोड़ें" पर क्लिक करें',
    moreInstructions: 'अतिरिक्त निर्देश'
  }
};

export default function MedicationsSection({ medications, onUpdate, language = 'en' }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    timing: ['morning'],
    foodRelation: 'afterFood',
    duration: '',
    instructions: ''
  });

  const [customMedicines, setCustomMedicines] = useState([]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await clinicSettingsAPI.getMedicines();
        if (res?.data) {
          setCustomMedicines(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch clinic medicines:", err);
      }
    };
    fetchMedicines();
  }, []);

  const addMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.duration) {
      return;
    }

    const medication = {
      id: Date.now(),
      ...newMedicine
    };

    onUpdate([...medications, medication]);
    setNewMedicine({
      name: '',
      dosage: '',
      timing: ['morning'],
      foodRelation: 'afterFood',
      duration: '',
      instructions: ''
    });
    setShowAddForm(false);
  };

  const removeMedicine = (medId) => {
    onUpdate(medications.filter(med => med.id !== medId));
  };

  const updateMedicine = (medId, field, value) => {
    onUpdate(medications.map(med => 
      med.id === medId ? { ...med, [field]: value } : med
    ));
  };

  // Toggle a timing slot in/out of the array (for existing med)
  const updateMedicineTiming = (medId, timingKey, checked) => {
    onUpdate(medications.map(med => {
      if (med.id !== medId) return med;
      const current = Array.isArray(med.timing) ? med.timing : [];
      const updated = checked
        ? [...new Set([...current, timingKey])]
        : current.filter(t => t !== timingKey);
      return { ...med, timing: updated.length > 0 ? updated : [timingKey] };
    }));
  };

  // Toggle a timing slot in/out for the new medicine form
  const toggleNewMedicineTiming = (key, checked) => {
    setNewMedicine(prev => {
      const current = Array.isArray(prev.timing) ? prev.timing : [];
      const updated = checked
        ? [...new Set([...current, key])]
        : current.filter(t => t !== key);
      return { ...prev, timing: updated.length > 0 ? updated : prev.timing };
    });
  };

  const selectCommonMedicine = (medicine) => {
    setNewMedicine(prev => ({ 
      ...prev, 
      name: medicine.name,
      dosage: medicine.default_dosage || '',
      duration: medicine.default_duration || '',
      foodRelation: medicine.default_food_relation === 'Before Food' ? 'beforeFood' : 
                   medicine.default_food_relation === 'With Food' ? 'withFood' : 
                   medicine.default_food_relation === 'No Relation' ? 'noRelation' : 'afterFood'
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Pill className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t.title}</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addMedicine}</span>
        </button>
      </div>

      {/* Add Medicine Form */}
      {showAddForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-purple-900 mb-4">{t.addNewMedicine}</h4>
          
          {/* Common Medicines */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              {t.quickSelect}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {customMedicines.length > 0 ? customMedicines.map(medicine => (
                <button
                  key={medicine.id}
                  onClick={() => selectCommonMedicine(medicine)}
                  className="px-2 py-1 text-xs bg-white hover:bg-purple-100 border border-purple-200 rounded transition-colors text-left truncate"
                  title={medicine.name}
                >
                  {medicine.name}
                </button>
              )) : (
                <p className="text-xs text-gray-400 col-span-full">No custom medicines added for this clinic yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                {t.medicineName}
              </label>
              <input
                type="text"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t.namePlaceholder}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                {t.dosage}
              </label>
              <input
                type="text"
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder={t.dosagePlaceholder}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              {t.timing}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'morning', label: t.morning },
                { key: 'afternoon', label: t.afternoon },
                { key: 'evening', label: t.evening },
                { key: 'night', label: t.night }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(newMedicine.timing) && newMedicine.timing.includes(key)}
                    onChange={(e) => toggleNewMedicineTiming(key, e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                <Utensils className="w-4 h-4 inline mr-1" />
                {t.foodRelation}
              </label>
              <select
                value={newMedicine.foodRelation}
                onChange={(e) => setNewMedicine(prev => ({ ...prev, foodRelation: e.target.value }))}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="beforeFood">{t.beforeFood}</option>
                <option value="afterFood">{t.afterFood}</option>
                <option value="withFood">{t.withFood}</option>
                <option value="noRelation">{t.noRelation}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                {t.duration}
              </label>
              <input
                type="text"
                value={newMedicine.duration}
                onChange={(e) => setNewMedicine(prev => ({ ...prev, duration: e.target.value }))}
                placeholder={t.durationPlaceholder}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-purple-700 mb-1">
              {t.instructions}
            </label>
            <textarea
              value={newMedicine.instructions}
              onChange={(e) => setNewMedicine(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder={t.instructionsPlaceholder}
              rows={2}
              className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={addMedicine}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t.addMedicine}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Medications List */}
      {medications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Pill className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t.noMeds}</p>
          <p className="text-xs text-gray-400 mt-1">{t.clickToAdd}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medications.map(medication => (
            <div key={medication.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 mr-2">
                  {/* Inline-editable medicine name */}
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedicine(medication.id, 'name', e.target.value)}
                    className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none w-full transition-colors cursor-text"
                    title="Click to edit medicine name"
                  />
                  {/* Inline-editable dosage */}
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => updateMedicine(medication.id, 'dosage', e.target.value)}
                    className="text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-purple-300 focus:border-purple-500 focus:outline-none w-full transition-colors cursor-text mt-0.5"
                    title="Click to edit dosage"
                  />
                </div>
                <button
                  onClick={() => removeMedicine(medication.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {t.timing}
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { key: 'morning', label: t.morning },
                      { key: 'afternoon', label: t.afternoon },
                      { key: 'evening', label: t.evening },
                      { key: 'night', label: t.night }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={Array.isArray(medication.timing) && medication.timing.includes(key)}
                          onChange={(e) => updateMedicineTiming(medication.id, key, e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <Utensils className="w-3 h-3 inline mr-1" />
                    {t.foodRelation}
                  </label>
                  <select
                    value={medication.foodRelation}
                    onChange={(e) => updateMedicine(medication.id, 'foodRelation', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="beforeFood">{t.beforeFood}</option>
                    <option value="afterFood">{t.afterFood}</option>
                    <option value="withFood">{t.withFood}</option>
                    <option value="noRelation">{t.noRelation}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.duration}
                  </label>
                  <input
                    type="text"
                    value={medication.duration}
                    onChange={(e) => updateMedicine(medication.id, 'duration', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t.instructions}
                  </label>
                  <input
                    type="text"
                    value={medication.instructions || ''}
                    onChange={(e) => updateMedicine(medication.id, 'instructions', e.target.value)}
                    placeholder={t.moreInstructions}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
