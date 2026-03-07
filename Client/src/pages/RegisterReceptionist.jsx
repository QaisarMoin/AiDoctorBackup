import { useState } from 'react';
import { User, Mail, Lock, CheckCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

/**
 * Register Receptionist Page Component
 * Added by Qaisar
 * 
 * Allows a doctor to register a new receptionist for their clinic.
 * This form includes client-side validation and enforces the 'receptionist' role.
 */
export default function RegisterReceptionist() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'Male', // Default selection
    role: 'receptionist' // Added by Qaisar: Hardcoded role sent to backend
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Secure password and matching validation
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Connect to the actual backend API with appended role
      await authAPI.register(formData);
      
      toast.success('Receptionist registered successfully!');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
       console.error("Registration Error:", error);
       toast.error('Failed to register receptionist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Register new receptionist accounts for your clinic</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
          <User className="w-6 h-6 text-orange-600" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            {/* Left Side: Info */}
            <div className="lg:w-1/3 bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white flex flex-col justify-center items-center text-center">
              <div className="bg-white/20 p-5 rounded-3xl mb-6 border border-white/30 backdrop-blur-sm shadow-xl">
                 <UserPlus className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-4">Add New Member</h2>
              <p className="text-orange-50 text-sm leading-relaxed mb-8 opacity-90">
                Create a secure account for your receptionist to help manage patient check-ins and registrations.
              </p>
              
              <div className="space-y-4 text-left w-full max-w-[180px] mx-auto hidden lg:block">
                <div className="flex items-center text-orange-100 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 mr-2" /> Secure Access
                </div>
                <div className="flex items-center text-orange-100 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 mr-2" /> Staff Dashboard
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="lg:w-2/3 p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter receptionist's full name"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                
                {/* Gender & Role Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Gender</label>
                    <select 
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-sm font-bold text-gray-700">Assigned Role</label>
                     <div className="w-full px-4 py-3.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 flex items-center">
                       <CheckCircle className="w-4 h-4 mr-2" /> Receptionist
                     </div>
                  </div>
                </div>

                {/* Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform active:scale-95 disabled:opacity-70 disabled:transform-none mt-6 shadow-md"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Registering...
                    </div>
                  ) : 'Register Receptionist'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
