import React, { useState, useEffect } from 'react';
import { clinicSettingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Settings, Pill, TestTubes, Plus, Trash2, Calendar,
  Utensils, Activity, FileText, CheckCircle, X, AlertCircle, Pencil, Lock
} from 'lucide-react';

const FOOD_OPTIONS = ['Before Food', 'After Food', 'With Food', 'No Relation'];
const TEST_CATEGORIES = ['Blood', 'Imaging', 'Laboratory', 'Cardiac', 'Other'];

const categoryColors = {
  blood:      'bg-red-100 text-red-700',
  imaging:    'bg-blue-100 text-blue-700',
  laboratory: 'bg-emerald-100 text-emerald-700',
  cardiac:    'bg-rose-100 text-rose-700',
  other:      'bg-indigo-100 text-indigo-700',
};

// ─── Shared Input / Select ────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-black text-gray-500 uppercase tracking-wide">{label}</label>
    {Icon ? (
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {children}
      </div>
    ) : children}
  </div>
);

const inputCls = (color) =>
  `w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:border-${color}-400 focus:ring-2 focus:ring-${color}-100`;

const selectCls =
  `w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl outline-none transition-all text-sm font-medium focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer`;

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
const Modal = ({ title, subtitle, gradientCls, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
    onClick={onClose}>
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      onClick={e => e.stopPropagation()}>
      <div className={`p-7 text-white flex items-start justify-between ${gradientCls}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/25 p-2 rounded-xl"><Icon className="w-5 h-5" /></div>
            <h2 className="text-xl font-extrabold">{title}</h2>
          </div>
          <p className="text-white/70 text-sm pl-1">{subtitle}</p>
        </div>
        <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors mt-1">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="p-7">{children}</div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ClinicSettings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab]   = useState('medicines');
  const [medicines, setMedicines]   = useState([]);
  const [tests, setTests]           = useState([]);
  const [testCategoryFilter, setTestCategoryFilter] = useState('All');
  const [isLoading, setIsLoading]   = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // modal state: null | 'addMed' | 'editMed' | 'addTest' | 'editTest'
  const [modal, setModal]         = useState(null);
  const [editTarget, setEditTarget] = useState(null); // the item being edited

  const emptyMed  = { name: '', default_dosage: '', default_duration: '', default_food_relation: 'After Food' };
  const emptyTest = { name: '', category: 'Blood' };

  const [medForm,  setMedForm]  = useState(emptyMed);
  const [testForm, setTestForm] = useState(emptyTest);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setModal(null); setTestCategoryFilter('All'); }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [medRes, testRes] = await Promise.all([
        clinicSettingsAPI.getMedicines(),
        clinicSettingsAPI.getTests()
      ]);
      setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
      setTests(Array.isArray(testRes.data) ? testRes.data : []);
    } catch { toast.error('Failed to load clinic settings'); }
    finally { setIsLoading(false); }
  };

  // ─── Edit helpers ────────────────────────────────────────────────────────────
  const openEditMed = (med) => {
    setEditTarget(med);
    setMedForm({
      name: med.name,
      default_dosage: med.default_dosage || '',
      default_duration: med.default_duration || '',
      default_food_relation: med.default_food_relation || 'After Food',
    });
    setModal('editMed');
  };

  const openEditTest = (test) => {
    setEditTarget(test);
    setTestForm({ name: test.name, category: test.category || 'Blood' });
    setModal('editTest');
  };

  // ─── Add Medicine ────────────────────────────────────────────────────────────
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return toast.error('Name required');
    setIsSubmitting(true);
    try {
      const res = await clinicSettingsAPI.addMedicine(medForm);
      setMedicines(prev => [...prev, res.data]);
      setMedForm(emptyMed);
      toast.success('Medicine added!');
      setModal(null);
    } catch { toast.error('Failed to add medicine'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Edit Medicine (delete original + add private copy) ──────────────────────
  const handleEditMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return toast.error('Name required');
    setIsSubmitting(true);
    try {
      // Delete the original (removes it from this doctor's view)
      await clinicSettingsAPI.deleteMedicine(editTarget.id);
      // Add updated version as a new private medicine
      const res = await clinicSettingsAPI.addMedicine(medForm);
      setMedicines(prev => prev.map(m => m.id === editTarget.id ? res.data : m));
      toast.success('Medicine updated!');
      setModal(null);
    } catch { toast.error('Failed to update medicine'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Delete Medicine ─────────────────────────────────────────────────────────
  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await clinicSettingsAPI.deleteMedicine(id);
      setMedicines(prev => prev.filter(m => m.id !== id));
      toast.success('Medicine deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // ─── Add Test ────────────────────────────────────────────────────────────────
  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!testForm.name.trim()) return toast.error('Name required');
    setIsSubmitting(true);
    try {
      const res = await clinicSettingsAPI.addTest(testForm);
      setTests(prev => [...prev, res.data]);
      setTestForm(emptyTest);
      toast.success('Test added!');
      setModal(null);
    } catch { toast.error('Failed to add test'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Edit Test (delete original + add private copy) ──────────────────────────
  const handleEditTest = async (e) => {
    e.preventDefault();
    if (!testForm.name.trim()) return toast.error('Name required');
    setIsSubmitting(true);
    try {
      await clinicSettingsAPI.deleteTest(editTarget.id);
      const res = await clinicSettingsAPI.addTest(testForm);
      setTests(prev => prev.map(t => t.id === editTarget.id ? res.data : t));
      toast.success('Test updated!');
      setModal(null);
    } catch { toast.error('Failed to update test'); }
    finally { setIsSubmitting(false); }
  };

  // ─── Delete Test ─────────────────────────────────────────────────────────────
  const handleDeleteTest = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await clinicSettingsAPI.deleteTest(id);
      setTests(prev => prev.filter(t => t.id !== id));
      toast.success('Test deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const isMed = activeTab === 'medicines';

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative">

      {/* ── Add Medicine Modal ── */}
      {modal === 'addMed' && (
        <Modal title="Add Medicine" subtitle="Add a custom medicine to your clinic's catalog."
          gradientCls="bg-gradient-to-br from-blue-500 to-blue-700" icon={Pill}
          onClose={() => setModal(null)}>
          <MedicineForm form={medForm} setForm={setMedForm} onSubmit={handleAddMedicine}
            onCancel={() => setModal(null)} isSubmitting={isSubmitting} label="Add Medicine" />
        </Modal>
      )}

      {/* ── Edit Medicine Modal ── */}
      {modal === 'editMed' && (
        <Modal title="Edit Medicine" subtitle="Changes apply only to your personal list."
          gradientCls="bg-gradient-to-br from-blue-600 to-indigo-700" icon={Pencil}
          onClose={() => setModal(null)}>
          <MedicineForm form={medForm} setForm={setMedForm} onSubmit={handleEditMedicine}
            onCancel={() => setModal(null)} isSubmitting={isSubmitting} label="Save Changes" />
        </Modal>
      )}

      {/* ── Add Test Modal ── */}
      {modal === 'addTest' && (
        <Modal title="Add Test" subtitle="Add a custom test to your clinic's catalog."
          gradientCls="bg-gradient-to-br from-indigo-500 to-purple-600" icon={TestTubes}
          onClose={() => setModal(null)}>
          <TestForm form={testForm} setForm={setTestForm} onSubmit={handleAddTest}
            onCancel={() => setModal(null)} isSubmitting={isSubmitting} label="Add Test" />
        </Modal>
      )}

      {/* ── Edit Test Modal ── */}
      {modal === 'editTest' && (
        <Modal title="Edit Test" subtitle="Changes apply only to your personal list."
          gradientCls="bg-gradient-to-br from-indigo-600 to-purple-700" icon={Pencil}
          onClose={() => setModal(null)}>
          <TestForm form={testForm} setForm={setTestForm} onSubmit={handleEditTest}
            onCancel={() => setModal(null)} isSubmitting={isSubmitting} label="Save Changes" />
        </Modal>
      )}

      {/* ── Page Header ── */}
      <div className="bg-white border border-gray-100 px-8 py-6 flex items-center gap-4 mb-6 rounded-2xl shadow-sm">
        <div className="p-3 bg-gray-50 rounded-2xl"><Settings className="w-7 h-7 text-gray-600" /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Clinic Customizations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your personal catalog of medicines and diagnostic tests.</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 gap-1.5 mb-6">
        {[
          { key: 'medicines', label: `Medicines (${medicines.length})`, icon: Pill,      active: 'bg-blue-600 text-white shadow-lg shadow-blue-200' },
          { key: 'tests',     label: `Tests (${tests.length})`,          icon: TestTubes, active: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' },
        ].map(({ key, label, icon: Icon, active }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 font-bold text-sm rounded-xl transition-all duration-200 ${
              activeTab === key ? active : 'text-gray-500 hover:bg-gray-50'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Table Card ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-3xl border border-gray-100">
          <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${isMed ? 'border-blue-500' : 'border-indigo-500'}`} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Table header bar */}
          <div className="px-8 py-5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isMed ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Registered {isMed ? 'Medicines' : 'Tests'}
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  {isMed ? medicines.length : tests.length} item(s) · Quick-select available in consultations
                </p>
              </div>


              {/* grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 border-b border-gray-100 text-[10px] font-medium */}
            </div>
            {isAdmin ? (
              <button onClick={() => { isMed ? setMedForm(emptyMed) : setTestForm(emptyTest); setModal(isMed ? 'addMed' : 'addTest'); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-md ${
                  isMed ? 'bg-gradient-to-r from-blue-500 to-blue-700 hover:shadow-blue-200'
                         : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-indigo-200'
                }`}>
                <Plus className="w-4 h-4" /> Add {isMed ? 'Medicine' : 'Test'}
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50/50 text-gray-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" /> Admin only
              </div>
            )}
          </div>
          {/* ── Category filter tabs for Tests ── */}
          {!isMed && (
            <div className="px-6 pt-3 pb-0 flex gap-1.5 flex-wrap border-b border-indigo-50">
              {['All', 'Blood', 'Imaging', 'Laboratory', 'Cardiac', 'Other'].map(cat => {
                const count = cat === 'All' ? tests.length : tests.filter(t => t.category?.toLowerCase() === cat.toLowerCase()).length;
                return (
                  <button key={cat}
                    onClick={() => setTestCategoryFilter(cat)}
                    className={`mb-3 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      testCategoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-indigo-50 text-indigo-500 hover:bg-indigo-100'
                    }`}>
                    {cat} <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Table */}
          {(isMed ? medicines : tests).length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-72 gap-3 ${isMed ? 'text-blue-300' : 'text-indigo-300'}`}>
              <AlertCircle className="w-14 h-14 opacity-30" />
              <p className="font-semibold text-sm">No {isMed ? 'medicines' : 'tests'} found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-8 text-[11px] font-black uppercase tracking-widest text-gray-400">Name</th>
                    {isMed ? (
                      <>
                        <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Dosage</th>
                        <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Duration</th>
                        <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Food Relation</th>
                      </>
                    ) : (
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-gray-400">Category</th>
                    )}
                    <th className="py-4 px-8 text-[11px] font-black uppercase tracking-widest text-right text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isMed ? medicines.map((med, i) => (
                    <tr key={med.id} className={`group border-b transition-all ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/50 border-gray-100`}>
                      <td className="py-4 px-8"><p className="font-bold text-gray-900 text-sm">{med.name}</p></td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-600">{med.default_dosage || <span className="text-gray-300 italic text-xs">—</span>}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-gray-600">{med.default_duration || <span className="text-gray-300 italic text-xs">—</span>}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-700">
                          {med.default_food_relation || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-8 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditMed(med)}
                              className="p-2 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMedicine(med.id, med.name)}
                              className="p-2 text-blue-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : tests.filter(t =>
                      testCategoryFilter === 'All' || t.category?.toLowerCase() === testCategoryFilter.toLowerCase()
                    ).map((test, i) => (
                    <tr key={test.id} className={`group border-b transition-all ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-indigo-50/50 border-gray-100`}>
                      <td className="py-4 px-8"><p className="font-bold text-gray-900 text-sm">{test.name}</p></td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-bold ${categoryColors[test.category?.toLowerCase()] ?? 'bg-indigo-100 text-indigo-700'}`}>
                          {test.category}
                        </span>
                      </td>
                      <td className="py-4 px-8 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEditTest(test)}
                              className="p-2 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteTest(test.id, test.name)}
                              className="p-2 text-indigo-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Medicine Form (reused for Add & Edit) ────────────────────────────────────
const MedicineForm = ({ form, setForm, onSubmit, onCancel, isSubmitting, label }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Field label="Medicine Name *" icon={Pill}>
      <input type="text" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className={inputCls('blue')} placeholder="e.g. Paracetamol 500mg" required autoFocus />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Dosage" icon={Activity}>
        <input type="text" value={form.default_dosage}
          onChange={e => setForm({ ...form, default_dosage: e.target.value })}
          className={inputCls('blue')} placeholder="1 Tablet" />
      </Field>
      <Field label="Duration" icon={Calendar}>
        <input type="text" value={form.default_duration}
          onChange={e => setForm({ ...form, default_duration: e.target.value })}
          className={inputCls('blue')} placeholder="5 Days" />
      </Field>
    </div>
    <Field label="Food Relation">
      <select value={form.default_food_relation}
        onChange={e => setForm({ ...form, default_food_relation: e.target.value })}
        className={selectCls}>
        {FOOD_OPTIONS.map(o => <option key={o}>{o}</option>)}
      </select>
    </Field>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting}
        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 text-sm">
        <Plus className="w-4 h-4" />{isSubmitting ? 'Saving…' : label}
      </button>
    </div>
  </form>
);

// ─── Test Form (reused for Add & Edit) ───────────────────────────────────────
const TestForm = ({ form, setForm, onSubmit, onCancel, isSubmitting, label }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Field label="Test Name *" icon={TestTubes}>
      <input type="text" value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        className={inputCls('indigo')} placeholder="e.g. CBC, LFT, HbA1c" required autoFocus />
    </Field>
    <Field label="Category">
      <select value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })}
        className={selectCls.replace('blue', 'indigo')}>
        {TEST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </Field>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel}
        className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
        Cancel
      </button>
      <button type="submit" disabled={isSubmitting}
        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 text-sm">
        <Plus className="w-4 h-4" />{isSubmitting ? 'Saving…' : label}
      </button>
    </div>
  </form>
);

export default ClinicSettings;
