import { useState, useEffect } from 'react';
import { User, Mail, Lock, CheckCircle, UserPlus, Pencil, Trash2, X, Users, Stethoscope, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '../services/api';
import Loader from '../components/loader/Loader';
import { useAuth } from '../context/AuthContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
function validate(form, isEdit = false) {
  if (!form.name || !form.email) return 'Name and email are required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format.';
  if (!form.mobile_number || String(form.mobile_number).trim().length < 7) return 'A valid mobile number is required.';
  if (!isEdit) {
    if (!form.password || !form.confirmPassword) return 'Password fields are required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
  }
  return null;
}

const EMPTY_FORM = { name: '', email: '', mobile_number: '', password: '', confirmPassword: '', gender: 'Male' };

const getRoleConfig = (roleType) => {
  const isDoc = roleType === 'doctor';
  return {
    label: isDoc ? 'Doctor' : 'Receptionist',
    icon: isDoc ? Stethoscope : Users,
    colorFrom: isDoc ? 'from-blue-500' : 'from-orange-500',
    colorTo: isDoc ? 'to-indigo-600' : 'to-red-600',
    colorText: isDoc ? 'text-blue-600' : 'text-orange-600',
    colorBgLight: isDoc ? 'bg-blue-50' : 'bg-orange-50',
    focusRing: isDoc ? 'focus:ring-blue-500/20 focus:border-blue-500' : 'focus:ring-orange-500/20 focus:border-orange-500',
    shadowHover: isDoc ? 'hover:shadow-blue-500/30' : 'hover:shadow-orange-500/30',
  };
};

// ─── Register Modal ────────────────────────────────
function RegisterModal({ roleType, onClose, onSuccess }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, role: roleType });
  const [loading, setLoading] = useState(false);
  const cfg = getRoleConfig(roleType);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(form);
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      if (roleType === 'doctor') {
         await staffAPI.registerDoctor(form);
      } else {
         await staffAPI.register(form);
      }
      toast.success(`${cfg.label} "${form.name}" registered!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col lg:flex-row h-full">

          {/* Left panel */}
          <div className={`lg:w-2/5 bg-gradient-to-br ${cfg.colorFrom} ${cfg.colorTo} p-8 text-white flex flex-col justify-center items-center text-center relative`}>
            <button onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors lg:hidden">
              <X className="w-4 h-4" />
            </button>
            <div className="bg-white/20 p-5 rounded-3xl mb-5 border border-white/30 backdrop-blur-sm shadow-xl">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-3">Add New {cfg.label}</h2>
            <p className="text-white text-sm leading-relaxed mb-6 opacity-90">
              Create a secure account for your {cfg.label.toLowerCase()} to help manage clinic proceedings.
            </p>
          </div>

          {/* Right: Form */}
          <div className="lg:w-3/5 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Register {cfg.label}</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    placeholder={`Enter ${cfg.label.toLowerCase()}'s full name`}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all text-sm`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    placeholder="email@example.com"
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all text-sm`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" name="mobile_number" value={form.mobile_number} onChange={handleChange}
                    placeholder="e.g. 9876543210" required
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all text-sm`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Gender <span className="text-red-500">*</span></label>
                  <select name="gender" value={form.gender} onChange={handleChange} required
                    className={`w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all appearance-none cursor-pointer text-sm`}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Assigned Role</label>
                  <div className={`w-full px-4 py-3 ${cfg.colorBgLight} ${cfg.colorText} font-bold rounded-xl flex items-center text-sm`}>
                    <CheckCircle className="w-4 h-4 mr-2" /> {cfg.label}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required
                      className={`w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all text-sm`} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required
                      className={`w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} focus:bg-white outline-none transition-all text-sm`} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full bg-gradient-to-r ${cfg.colorFrom} ${cfg.colorTo} text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:transform-none shadow-md mt-4 text-sm`}>
                {loading ? 'Registering...' : `Register ${cfg.label}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────
function EditModal({ targetUser, roleType, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: targetUser.name, email: targetUser.email, gender: targetUser.gender || 'Male', mobile_number: targetUser.mobile_number || '' });
  const [loading, setLoading] = useState(false);
  const cfg = getRoleConfig(roleType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(form, true);
    if (err) { toast.error(err); return; }
    setLoading(true);
    try {
      if (roleType === 'doctor') {
        await staffAPI.updateDoctor(targetUser.id, form);
      } else {
        await staffAPI.updateReceptionist(targetUser.id, form);
      }
      toast.success(`${cfg.label} updated!`);
      onSuccess(); onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${cfg.colorFrom} ${cfg.colorTo} p-5 text-white flex items-center justify-between`}>
          <div>
            <h2 className="text-base font-bold">Edit {cfg.label}</h2>
            <p className="text-white text-xs mt-0.5 opacity-80">{targetUser.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', icon: User },
            { label: 'Email', key: 'email', type: 'email', icon: Mail },
          ].map(({ label, key, type, icon: Icon }) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">{label}</label>
              <div className="relative">
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className={`w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} outline-none transition-all text-sm`} />
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={form.mobile_number || ''} onChange={e => setForm(p => ({ ...p, mobile_number: e.target.value }))}
                placeholder="e.g. 9876543210"
                className={`w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} outline-none transition-all text-sm`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Gender</label>
            <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              className={`w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 ${cfg.focusRing} outline-none transition-all text-sm`}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div className="flex space-x-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-3 bg-gradient-to-r ${cfg.colorFrom} ${cfg.colorTo} text-white rounded-xl font-bold ${cfg.shadowHover} transition-all disabled:opacity-70 text-sm`}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────
function DeleteConfirm({ targetUser, roleType, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const cfg = getRoleConfig(roleType);

  const handleDelete = async () => {
    setLoading(true);
    try {
      if (roleType === 'doctor') {
        await staffAPI.deleteDoctor(targetUser.id);
      } else {
         await staffAPI.deleteReceptionist(targetUser.id);
      }
      toast.success(`${targetUser.name} deleted.`);
      onSuccess(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Delete {cfg.label}?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Permanently delete <strong>{targetUser.name}</strong>'s account. This cannot be undone.
        </p>
        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-70 text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row component ─────────────────────────────────────────────────────────
function StaffRow({ account, roleType, onEdit, onDelete, onStatusChange }) {
  const [toggling, setToggling] = useState(false);
  const isActive = account.status === 'active';
  const cfg = getRoleConfig(roleType);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setToggling(true);
    try {
      if (roleType === 'doctor') {
         await staffAPI.toggleDoctorStatus(account.id, newStatus);
      } else {
         await staffAPI.toggleStatus(account.id, newStatus);
      }
      toast.success(`${account.name} is now ${newStatus}.`);
      onStatusChange();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Status update failed.');
    } finally { setToggling(false); }
  };

  return (
    <div className={`flex items-center justify-between px-8 py-4 hover:${cfg.colorBgLight}/50 transition-colors group`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cfg.colorFrom} ${cfg.colorTo} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {account.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{account.name}</p>
          <p className="text-xs text-gray-500">{account.email} · {account.gender || '—'} {account.mobile_number ? `· 📱 ${account.mobile_number}` : ''}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          {isActive ? 'Active' : 'Inactive'}
        </span>
        <select value={account.status} onChange={handleStatusChange} disabled={toggling}
          className={`text-xs px-2.5 py-1.5 border rounded-lg bg-white cursor-pointer outline-none ${cfg.focusRing} ${toggling ? 'opacity-50' : ''} ${isActive ? 'border-green-200 text-green-700' : 'border-red-200 text-red-600'}`}>
          <option value="active">Set Active</option>
          <option value="inactive">Set Inactive</option>
        </select>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit}
            className={`p-2 text-gray-400 hover:${cfg.colorText} hover:${cfg.colorBgLight} rounded-lg transition-colors`} title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
import { useLocation } from 'react-router-dom';

export default function StaffManagement({ fixedRole }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(fixedRole || location.state?.defaultTab || 'receptionist'); // 'receptionist' | 'doctor'
  
  useEffect(() => {
    if (fixedRole) setActiveTab(fixedRole);
  }, [fixedRole]);

  const [staffList, setStaffList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  const [showRegister, setShowRegister] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchStaff = async () => {
    setListLoading(true);
    try {
      if (activeTab === 'doctor') {
         const res = await staffAPI.getDoctors();
         setStaffList(res?.data?.doctors || []);
      } else {
         const res = await staffAPI.getReceptionists();
         setStaffList(res?.data?.receptionists || []);
      }
    } catch { toast.error(`Failed to load ${activeTab}s.`); }
    finally { setListLoading(false); }
  };

  useEffect(() => { 
     setStaffList([]); 
     fetchStaff(); 
  }, [activeTab]);

  const activeCount = staffList.filter(r => r.status === 'active').length;
  const cfg = getRoleConfig(activeTab);

  return (
    <div className="space-y-6">
      {/* Modals */}
      {showRegister && <RegisterModal roleType={activeTab} onClose={() => setShowRegister(false)} onSuccess={fetchStaff} />}
      {editTarget && <EditModal targetUser={editTarget} roleType={activeTab} onClose={() => setEditTarget(null)} onSuccess={fetchStaff} />}
      {deleteTarget && <DeleteConfirm targetUser={deleteTarget} roleType={activeTab} onClose={() => setDeleteTarget(null)} onSuccess={fetchStaff} />}

      {/* Page Header */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Administration</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage doctors and receptionists for your clinic</p>
        </div>
        <button onClick={() => setShowRegister(true)}
          className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${cfg.colorFrom} ${cfg.colorTo} text-white font-bold rounded-xl ${cfg.shadowHover} transition-all duration-200 active:scale-95`}>
          <UserPlus className="w-4 h-4" />
          <span>Register {cfg.label}</span>
        </button>
      </div>

      {/* Tabs */}
      {!fixedRole && (
        <div className="flex border-b border-gray-200 px-4">
           <button onClick={() => setActiveTab('receptionist')}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
                 activeTab === 'receptionist' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              Receptionists
           </button>
           <button onClick={() => setActiveTab('doctor')}
              className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
                 activeTab === 'doctor' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              Doctors
           </button>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${activeTab === 'doctor' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
               {activeTab === 'doctor' ? <Stethoscope className="w-5 h-5"/> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Registered {cfg.label}s</h2>
              <p className="text-xs text-gray-500">{activeCount} active · {staffList.length - activeCount} inactive</p>
            </div>
          </div>
        </div>

        {listLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${activeTab === 'doctor' ? 'border-blue-500' : 'border-orange-500'}`} />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16">
            {activeTab === 'doctor' ? <Stethoscope className="w-12 h-12 text-gray-200 mx-auto mb-3" /> : <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />}
            <p className="text-gray-500 font-medium">No {cfg.label.toLowerCase()}s registered yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click "Register {cfg.label}" to add your first staff member.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {staffList.map(account => (
              <StaffRow key={account.id} account={account} roleType={activeTab}
                onEdit={() => setEditTarget(account)}
                onDelete={() => setDeleteTarget(account)}
                onStatusChange={fetchStaff}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
