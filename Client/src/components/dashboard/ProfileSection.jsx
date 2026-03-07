import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Calendar, ShieldCheck, Pencil, Check, X, Plus, Upload, Stethoscope, Award, FileSignature, Loader2 } from 'lucide-react';
import { doctorProfileAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SERVER_BASE = import.meta.env.PROD
  ? 'https://aidoctorassist.dentalguru.software'
  : ''; // in dev, Vite proxies /uploads → localhost:5050

const ProfileSection = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [degrees, setDegrees] = useState([]);
  const [degreeInput, setDegreeInput] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Inline edit for name
  const [editingName, setEditingName] = useState(false);

  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await doctorProfileAPI.getProfile();
        const data = res?.data || res;
        setProfile(data);
        setName(data.name || '');
        setDesignation(data.designation || '');
        setDegrees(data.degrees || []);
        if (data.signature) setSignaturePreview(`${SERVER_BASE}${data.signature}`);
      } catch {
        toast.error('Could not load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      toast.error('Signature image must be under 200 KB');
      return;
    }
    setSignatureFile(file);
    setSignaturePreview(URL.createObjectURL(file));
  };

  const addDegree = () => {
    const val = degreeInput.trim();
    if (!val) return;
    if (degrees.includes(val)) { toast.error('Degree already added'); return; }
    setDegrees(prev => [...prev, val]);
    setDegreeInput('');
  };

  const removeDegree = (idx) => setDegrees(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('designation', designation);
      formData.append('degrees', JSON.stringify(degrees));
      if (signatureFile) formData.append('signature', signatureFile);

      const res = await doctorProfileAPI.updateProfile(formData);
      const updated = res?.data || res;
      setProfile(updated);
      setName(updated.name);
      setDesignation(updated.designation || '');
      setDegrees(updated.degrees || []);
      if (updated.signature) setSignaturePreview(`${SERVER_BASE}${updated.signature}`);
      setSignatureFile(null);
      setEditingName(false);
      toast.success('Profile saved successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-md">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 text-3xl font-bold border border-gray-100">
                {name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-all shadow-sm hover:shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {/* Editable Name */}
          <div className="flex items-center gap-2 mb-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none bg-transparent px-1"
                />
                <button onClick={() => setEditingName(false)} className="text-green-600 hover:text-green-700">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => { setName(profile?.name || ''); setEditingName(false); }} className="text-red-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingName(true)}>
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <p className="text-gray-500 font-medium capitalize">{profile?.role} Account</p>

          {/* Designation (doctor only) */}
          {isDoctor && (
            <div className="mt-3">
              <input
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                placeholder="e.g. Senior Cardiologist, MBBS MD"
                className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
              />
              <p className="text-xs text-gray-400 mt-1">Designation shown on prescriptions</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-lg"><Mail className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</p>
            <p className="text-gray-900 font-medium">{profile?.email}</p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="p-3 bg-green-50 rounded-lg"><ShieldCheck className="w-5 h-5 text-green-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Account Role</p>
            <p className="text-green-600 font-semibold capitalize">{profile?.role}</p>
          </div>
        </div>

        {/* Member since */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="p-3 bg-purple-50 rounded-lg"><Calendar className="w-5 h-5 text-purple-500" /></div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Member Since</p>
            <p className="text-gray-900 font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-lg"><Stethoscope className="w-5 h-5 text-amber-500" /></div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Associated Clinic</p>
            <p className="text-gray-900 font-medium">{profile?.organization_name || <span className="text-gray-400 italic">Not assigned to a clinic</span>}</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full font-medium">Read-only</span>
        </div>
      </div>

      {/* Doctor-only Section */}
      {isDoctor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Degrees */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg"><Award className="w-5 h-5 text-indigo-600" /></div>
              <h3 className="font-bold text-gray-900">Degrees & Qualifications</h3>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-8">
              {degrees.length === 0 && (
                <p className="text-sm text-gray-400 italic">No degrees added yet</p>
              )}
              {degrees.map((deg, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full">
                  {deg}
                  <button onClick={() => removeDegree(i)} className="text-indigo-400 hover:text-indigo-700 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add degree input */}
            <div className="flex gap-2">
              <input
                value={degreeInput}
                onChange={e => setDegreeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addDegree()}
                placeholder="e.g. MBBS, MD, MS..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
              />
              <button
                onClick={addDegree}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Press Enter or click Add. These appear on prescriptions.</p>
          </div>

          {/* Signature Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-pink-50 rounded-lg"><FileSignature className="w-5 h-5 text-pink-600" /></div>
              <h3 className="font-bold text-gray-900">Doctor Signature</h3>
            </div>

            {/* Preview */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-all group mb-3 overflow-hidden"
            >
              {signaturePreview ? (
                <img src={signaturePreview} alt="Signature preview" className="max-h-32 max-w-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-1 group-hover:text-pink-400 transition-colors" />
                  <p className="text-sm text-gray-400 group-hover:text-pink-500">Click to upload signature</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSignatureChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 text-sm font-semibold text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {signaturePreview ? 'Change Signature' : 'Upload Signature'}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">JPEG / PNG / WEBP · Max 200 KB</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
