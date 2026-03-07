import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Stethoscope, Building, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import Loader from '../components/loader/Loader';
import { Link } from 'react-router-dom';

/**
 * Clinic Signup Page Component
 * 
 * Handles Clinic Admin registration where a doctor registers themselves
 * AND creates a new clinic simultaneously.
 */
export default function ClinicSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clinic_name: '',
    clinic_phone: '',
    clinic_address: ''
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
    if (!formData.email || !formData.password || !formData.name || !formData.confirmPassword || !formData.clinic_name) {
      toast.error('Please fill in all required fields (Name, Email, Password, Clinic Name)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

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
      // Send complete payload to authAPI.register which handles clinic creation in the backend
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'admin', // Clinic owners are admins
        clinic_name: formData.clinic_name,
        clinic_phone: formData.clinic_phone || '',
        clinic_address: formData.clinic_address || ''
      });
      
      if (response.success) {
         toast.success('Clinic created successfully! Please login with your new credentials.', { duration: 4000 });
         // Automatically redirect to login handled natively or through hook if needed, but a manual Link is also okay.
         setTimeout(() => {
            window.location.href = '/login';
         }, 2000);
      } else {
         toast.error(response.message || 'Registration failed.');
      }
    } catch (error) {
       console.error("Clinic Registration Error:", error);
       const errorMessage = error.response?.data?.message || 'An error occurred during registration';
       toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader message={'Creating your clinic...'} />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Register Your Clinic
          </h1>
          <p className="text-gray-600 text-sm">Join as a Clinic Admin & onboard your staff</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl bg-opacity-95">
          {/* Form */}
          <div className="space-y-4">
            
            {/* Admin Profile Section */}
            <div className="border-b border-gray-100 pb-4 mb-4">
               <h3 className="text-md font-bold text-gray-800 mb-4">Doctor / Admin Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                     <div className="relative">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                        <input
                           type="text"
                           name="name"
                           value={formData.name}
                           onChange={handleChange}
                           placeholder="Dr. John Doe"
                           className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="relative">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email *</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                        <input
                           type="email"
                           name="email"
                           value={formData.email}
                           onChange={handleChange}
                           placeholder="admin@clinic.com"
                           className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="relative">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                        <input
                           type={showPassword ? 'text' : 'password'}
                           name="password"
                           value={formData.password}
                           onChange={handleChange}
                           placeholder="••••••••"
                           className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                        />
                        <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-3.5 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                           {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                     </div>
                  </div>

                  <div className="relative">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                        <input
                           type="password"
                           name="confirmPassword"
                           value={formData.confirmPassword}
                           onChange={handleChange}
                           placeholder="••••••••"
                           className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Clinic Details Section */}
            <div>
               <h3 className="text-md font-bold text-gray-800 mb-4">Clinic Setup</h3>
               <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                     <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name *</label>
                     <div className="relative">
                        <Building className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                        <input
                           type="text"
                           name="clinic_name"
                           value={formData.clinic_name}
                           onChange={handleChange}
                           placeholder="City Healthcare Center"
                           className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Phone</label>
                        <div className="relative">
                           <Phone className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                           <input
                              type="tel"
                              name="clinic_phone"
                              value={formData.clinic_phone}
                              onChange={handleChange}
                              placeholder="+1 234 567 8900"
                              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                           />
                        </div>
                     </div>
                     
                     <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Address</label>
                        <div className="relative">
                           <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                           <input
                              type="text"
                              name="clinic_address"
                              value={formData.clinic_address}
                              onChange={handleChange}
                              placeholder="123 Medical Way, City"
                              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-70 mt-6"
            >
              {loading ? 'Processing...' : 'Create Clinic Account'}
            </button>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-purple-600 font-semibold transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
