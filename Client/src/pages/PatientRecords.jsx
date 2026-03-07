// --Qaisar: Patient Records Page - Full patient list with vitals detail panel + edit vitals
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, ArrowLeft, Search, User, Phone, Mail, MapPin,
  Activity, Heart, Thermometer, Droplets, Wind, Scale,
  ChevronRight, X, Calendar, Clock, AlertCircle, CheckCircle,
  Minus, Pencil, Save, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { patientAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';
import Loader from '../components/loader/Loader';

// --Qaisar: Status badge config
const STATUS_CONFIG = {
  active:   { label: 'Active',   bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle },
  stable:   { label: 'Stable',   bg: 'bg-blue-100',   text: 'text-blue-700',   icon: Minus },
  critical: { label: 'Critical', bg: 'bg-red-100',    text: 'text-red-700',    icon: AlertCircle },
};

// --Qaisar: Vital display card (read-only mode)
function VitalCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
      </div>
    </div>
  );
}

// --Qaisar: Vital edit field (edit mode) - allows receptionist to fill/update a vital
function VitalEditField({ icon: Icon, label, fieldKey, value, color, onChange }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          placeholder={`Enter ${label}`}
          className="w-full text-sm font-semibold text-gray-800 bg-white border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// --Qaisar: Slide-in detail panel with edit vitals support
function PatientDetailPanel({ patient, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedVitals, setEditedVitals] = useState({});

  // --Qaisar: Separate state for contact edit mode
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editedContact, setEditedContact] = useState({});

  // --Qaisar: Global panel loading state
  const [isSaving, setIsSaving] = useState(false);

  // --Qaisar: Reset both edit states whenever a different patient is opened
  useEffect(() => {
    setIsEditing(false);
    setEditedVitals({});
    setIsEditingContact(false);
    setEditedContact({});
  }, [patient?.id]);

  if (!patient) return null;

  const status = STATUS_CONFIG[patient.status] || STATUS_CONFIG.active;
  const StatusIcon = status.icon;

  // --Qaisar: Vitals field config — drives both view and edit modes
  const VITALS = [
    { icon: Activity,    label: 'Blood Pressure', key: 'bp',          color: 'bg-red-500' },
    { icon: Heart,       label: 'Pulse Rate',     key: 'pulse_rate',  color: 'bg-pink-500' },
    { icon: Thermometer, label: 'Temperature',    key: 'temperature', color: 'bg-orange-500' },
    { icon: Wind,        label: 'SpO2',           key: 'spo2',        color: 'bg-blue-500' },
    { icon: Droplets,    label: 'Blood Sugar',    key: 'sugar',       color: 'bg-purple-500' },
    { icon: Scale,       label: 'Weight',         key: 'weight',      color: 'bg-green-500' },
  ];

  const handleEditStart = () => {
    // --Qaisar: Pre-fill edit fields with current patient values
    const current = {};
    VITALS.forEach(v => { current[v.key] = patient[v.key] || ''; });
    setEditedVitals(current);
    setIsEditing(true);
  };

  const handleFieldChange = (key, val) => {
    setEditedVitals(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    // --Qaisar: Save Vitals remotely then notify parent list
    try {
      setIsSaving(true);
      const res = await patientAPI.updateVitals(patient.id, editedVitals);
      setIsEditing(false);
      toast.success('Vitals updated successfully!');
      
      // Update local state by merging the edited vitals directly, since the basic patient return doesn't map them
      const updatedLocalPatient = { ...patient, ...editedVitals };
      onUpdate(updatedLocalPatient);
    } catch (err) {
      console.error('Failed to update vitals:', err);
      toast.error('Failed to update vitals. Please check server connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedVitals({});
  };

  // --Qaisar: Contact edit handlers
  const handleContactEditStart = () => {
    setEditedContact({ phone: patient.phone || '', email: patient.email || '', address: patient.address || '' });
    setIsEditingContact(true);
  };

  const handleContactFieldChange = (key, val) => {
    setEditedContact(prev => ({ ...prev, [key]: val }));
  };

  const handleContactSave = async () => {
    try {
      setIsSaving(true);
      // Wait for the main update call to resolve via API
      const res = await patientAPI.updatePatient(patient.id, { ...patient, ...editedContact });
      
      // Update local state to reflect the latest values
      // Force latest_vitals merge back in since updatePatient might just return basic patient struct
      const newPatientObj = { ...res.data, ...patient, ...res.data };
      onUpdate(newPatientObj);
      
      setIsEditingContact(false);
      toast.success('Contact updated successfully!');
    } catch (err) {
      console.error('Failed to update contact info:', err);
      toast.error('Failed to update contact. Please check server connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactCancel = () => {
    setIsEditingContact(false);
    setEditedContact({});
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <h2 className="text-2xl font-bold">{patient.name}</h2>
          <p className="text-blue-100 text-sm mt-1">
            {patient.age} yrs &bull; {patient.gender === 'male' ? 'Male' : 'Female'}
          </p>
          <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </div>
        </div>

        {/* --Qaisar: Contact Info with Edit support */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact</h3>
            {!isEditingContact ? (
              <button
                onClick={handleContactEditStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Contact
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleContactSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleContactCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {/* Phone */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {isEditingContact ? (
                <input
                  type="tel"
                  value={editedContact.phone}
                  onChange={e => handleContactFieldChange('phone', e.target.value)}
                  placeholder="Phone number"
                  className="flex-1 text-sm text-gray-800 bg-white border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span>{patient.phone || '—'}</span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {isEditingContact ? (
                <input
                  type="email"
                  value={editedContact.email}
                  onChange={e => handleContactFieldChange('email', e.target.value)}
                  placeholder="Email address"
                  className="flex-1 text-sm text-gray-800 bg-white border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <span className="break-all">{patient.email || '—'}</span>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              {isEditingContact ? (
                <textarea
                  value={editedContact.address}
                  onChange={e => handleContactFieldChange('address', e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  className="flex-1 text-sm text-gray-800 bg-white border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <span>{patient.address || '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* --Qaisar: Vitals section with Edit / Save / Cancel controls */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Vitals</h3>

            {/* --Qaisar: Toggle between Edit button and Save/Cancel buttons */}
            {!isEditing ? (
              <button
                onClick={handleEditStart}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Vitals
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                     <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* --Qaisar: Hint banner shown while editing */}
          {isEditing && (
            <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              Fill in the vitals below and click <strong>Save</strong> to update.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {VITALS.map(v =>
              isEditing ? (
                <VitalEditField
                  key={v.key}
                  icon={v.icon}
                  label={v.label}
                  fieldKey={v.key}
                  value={editedVitals[v.key]}
                  color={v.color}
                  onChange={handleFieldChange}
                />
              ) : (
                <VitalCard
                  key={v.key}
                  icon={v.icon}
                  label={v.label}
                  value={patient[v.key]}
                  color={v.color}
                />
              )
            )}
          </div>
        </div>

        {/* Visit Info */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Visit History</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                <span className="text-gray-500">Registered: </span>
                {patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                <span className="text-gray-500">Last Visit: </span>
                {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --Qaisar: Main Patient Records Page
export default function PatientRecords() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  
  // --Qaisar: Get auth context to check role for status dropdown restrictions
  const { user } = useAuth();

  const PAGE_SIZE = 10;

  // Server-side debounced search — 350ms delay
  const debouncedSearch = useDebounce(search, 350);

  // Fetch one page of patients
  const fetchPage = useCallback(async (pageNum, searchTerm) => {
    try {
      setLoading(true);
      setError('');
      const res = await patientAPI.getAllPatients({
        page: pageNum,
        limit: PAGE_SIZE,
        search: searchTerm || undefined
      });
      const list = res?.data?.patients || [];
      const total = res?.data?.pagination?.total || 0;
      
      // --Qaisar: Extract actual counts from backend response
      const serverStats = res?.data?.stats || {};
      setActiveCount(serverStats.active || 0);
      setCriticalCount(serverStats.critical || 0);

      setTotalCount(total);
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      setPatients(list);
    } catch (err) {
      console.error('PatientRecords fetch error:', err);
      const errorMsg = '[API-PAT-NETWORK-ERR] Could not load patient data. Please check the server.';
      toast.error(errorMsg, { id: 'patient-fetch-error' });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever page or debounced search changes
  useEffect(() => {
    fetchPage(page, debouncedSearch);
  }, [page, debouncedSearch, fetchPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Update a patient's vitals in local state after edit
  const handlePatientUpdate = (updatedPatient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    if (selected?.id === updatedPatient.id) {
      setSelected(updatedPatient);
    }
    // Refresh counts if status might have changed
    fetchPage(page, debouncedSearch);
  };

  // Handle inline queue status change
  const handleStatusChange = async (e, patientId) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      // Optimistically update the UI to prevent lag
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: newStatus } : p));
      
      await patientAPI.updateStatus(patientId, newStatus);
      toast.success(`Patient status updated to ${newStatus}`);
      
      // Refresh the page data in background to ensure correct active/critical metrics
      fetchPage(page, debouncedSearch);
    } catch (err) {
      console.error('Failed to change status:', err);
      toast.error('Failed to update status.');
      // Revert optimistic update gracefully by refetching
      fetchPage(page, debouncedSearch);
    }
  };

  // Stats derived from total count from backend
  const stats = {
    total: totalCount,
    active: activeCount,
    critical: criticalCount,
  };

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {loading && <Loader message="Fetching patient records..." />}

      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage and view all patient consultation history</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">{stats.total} Total</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:border-blue-200 transition-all">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Patients</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:border-green-200 transition-all">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Patients</p>
          <p className="text-3xl font-black text-green-600 mt-1">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 group hover:border-red-200 transition-all">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Critical Cases</p>
          <p className="text-3xl font-black text-red-600 mt-1">{stats.critical}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 text-gray-900 placeholder-gray-400 bg-transparent border-none rounded-xl focus:ring-0 text-lg font-medium"
          />
        </div>
      </div>

      {/* Patient list container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] items-center">
          <div className="col-span-4">Patient Information</div>
          <div className="col-span-2">Vitals Status</div>
          <div className="col-span-2">Queue Status</div>
          <div className="col-span-3">Contact Details</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="font-medium">Retrieving health records...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <XCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-bold">Network Connectivity Issue</p>
            <p className="text-sm opacity-60 mb-6">{error}</p>
            <button onClick={() => fetchPage(page, debouncedSearch)} className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <User className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-xl font-bold">No Records Found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Patient rows */}
        {!loading && !error && patients.map((patient, idx) => {
          const status = STATUS_CONFIG[patient.status] || STATUS_CONFIG.active;
          const StatusIcon = status.icon;
          return (
            <div
              key={patient.id}
              onClick={() => setSelected(patient)}
              className={`grid grid-cols-12 gap-4 px-8 py-6 items-center cursor-pointer hover:bg-gray-50/80 transition-all group ${idx !== patients.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              {/* Name + avatar */}
              <div className="col-span-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  {patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{patient.name}</p>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                    {patient.age}Y • {patient.gender}
                  </p>
                </div>
              </div>

              {/* Status badge (Vitals) */}
              <div className="col-span-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.text} border border-transparent group-hover:border-current/10 transition-colors`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>

              {/* Queue Status Dropdown */}
              <div className="col-span-2">
                <select
                  value={patient.status || 'in'}
                  onChange={(e) => handleStatusChange(e, patient.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors appearance-none shadow-sm"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem top 50%",
                    backgroundSize: "0.65rem auto",
                    paddingRight: "1.75rem"
                  }}
                >
                  {/* Always show the current status even if role doesn't let them select it */}
                  {user?.role === 'receptionist' && !['in', 'hold', 'cancelled'].includes(patient.status) && (
                    <option value={patient.status} disabled>{patient.status}</option>
                  )}
                  <option value="in">In</option>
                  {user?.role !== 'receptionist' && <option value="in progress">In Progress</option>}
                  <option value="hold">Hold</option>
                  {user?.role !== 'receptionist' && <option value="completed">Completed</option>}
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Contact */}
              <div className="col-span-3">
                <p className="text-sm font-bold text-gray-700">{patient.phone || '—'}</p>
                <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{patient.email || '—'}</p>
              </div>

              {/* Arrow */}
              <div className="col-span-1 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination bar */}
      {!loading && !error && totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Page {page} of {totalPages} &nbsp;·&nbsp; {totalCount} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
      {/* --Qaisar: Detail panel with edit vitals support */}
      {selected && (
        <PatientDetailPanel
          patient={selected}
          onClose={() => setSelected(null)}
          onUpdate={handlePatientUpdate}
        />
      )}
    </div>
  );
}
