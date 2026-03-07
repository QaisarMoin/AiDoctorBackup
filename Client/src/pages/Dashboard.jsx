import React from 'react';
import { FileText, Stethoscope, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard Page Component
 * 
 * Protected dashboard page that displays user information
 * and provides logout functionality. Uses AuthContext for
 * authentication state and user data.
 */
export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Show loading spinner while auth context is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                AI Audio Doctor Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* Added by Qaisar: Dynamic role display */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋 {user?.role ? `(${user.role.charAt(0).toUpperCase() + user.role.slice(1)})` : ''}
          </h2>
          <p className="text-gray-600">
            Ready to manage your consultations and patient records?
          </p>
        </div>

        {/* Quick Actions */}
        {/* Added by Qaisar: Rendering cards based on backend module permissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {user?.accessible_modules?.includes('new_consultation') && (
            <div 
              onClick={() => navigate('/receptionist-audio')}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  New Consultation
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create a new patient consultation record
              </p>
            </div>
          )}

          {user?.accessible_modules?.includes('doctor_assistant') && (
            <div 
              onClick={() => navigate('/doctor-audio')}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Doctor Assistant
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Use AI-powered voice recording for consultations
              </p>
            </div>
          )}

          {/* Added by Qaisar: Register Receptionist Card */}
          {user?.accessible_modules?.includes('register_receptionist') && (
            <div 
              onClick={() => navigate('/register-receptionist')}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-100"
            >
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Register Receptionist
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Create an account for your clinic receptionist
              </p>
            </div>
          )}

          {/* --Qaisar: Patient Records card - now navigates to /patient-records */}
          {user?.accessible_modules?.includes('patient_records') && (
            <div
              onClick={() => navigate('/patient-records')}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  Patient Records
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                View and manage patient consultation history
              </p>
            </div>
          )}
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-medium text-green-600">Active</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium text-gray-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
