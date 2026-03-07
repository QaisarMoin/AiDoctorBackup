import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { authAPI } from '../services/api';
import Loader from '../components/loader/Loader';
import { Link } from 'react-router-dom';

/**
 * Login Page Component
 * 
 * Handles user authentication with local email/password and Google OAuth.
 * Uses AuthContext for authentication state management.
 * Redirects to dashboard on successful login.
 */
export default function DoctorLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    password: ''
  });

  const { login, handleOAuthCallback } = useAuth();

  // Check for auth callback on component mount
  useEffect(() => {
    const authResult = handleOAuthCallback();
    
    if (authResult) {
      if (authResult.success) {
        toast.success(authResult.message);
      } else {
        toast.error(`[AUTH-OAUTH-FAIL] ${authResult.error}`);
      }
    }
  }, [handleOAuthCallback]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.userId,
        password: formData.password
      });
      
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        toast.success('Login successful! Redirecting to dashboard...');
      } else {
         toast.error(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
       console.error("Authentication Error:", error);
       
       if (error.response && error.response.status === 401) {
         toast.error('Wrong credentials. Please check your email and password.');
       } else {
         const errorMessage = error.response?.data?.message || 'An error occurred during authentication';
         toast.error(errorMessage);
       }
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = () => {
    setLoading(true);
    window.location.href = 'https://aidoctorassist.dentalguru.software/auth/google';
  };

  return (
    <>
      {loading && <Loader message={'Authenticating...'} />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-sm">Staff Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-xl bg-opacity-95">
          {/* Form */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User ID / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-blue-600" />
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-purple-600 font-semibold">
                Forgot?
              </a>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-70 mt-6"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Gmail Login */}
          <button
            onClick={handleGmailLogin}
            disabled={loading}
            className="w-full border-2 border-gray-200 hover:border-blue-600 bg-white hover:bg-blue-50 text-gray-700 font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Connecting...' : 'Login with Gmail'}
          </button>

          {/* Added context Link to new Clinic Signup */}
          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Want to register a new clinic?{' '}
              <Link to="/clinic-signup" className="text-blue-600 hover:text-purple-600 font-semibold transition-colors">
                Register Here
              </Link>
            </p>
          </div>
          
          {/* Footer Text */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
