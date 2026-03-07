import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Users, Building2, UserPlus, ArrowRight, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ClinicDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect non-admins to the standard dashboard
  if (user?.role !== 'doctor') {
     navigate('/dashboard');
     return null;
  }

  const handleActionClick = (tab) => {
    // Navigate to Staff Management (Clinic Admin) and we can pass state if we want to auto-open a tab
    navigate(`/register-${tab}`);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-20 w-24 h-24 bg-indigo-300 opacity-20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Clinic Administration</h1>
            </div>
            <p className="text-indigo-100 max-w-xl text-lg mt-2 font-medium">
              Welcome back, <span className="text-white font-bold">{user?.name}</span>. Manage your clinic's personnel and monitor organizational growth.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 self-start md:self-auto">
            <div className="text-right">
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-1">Active Clinic</p>
              <p className="font-bold text-lg">{user?.organization_name || 'Your Clinic'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Register Doctor Action Card */}
        <div 
          onClick={() => handleActionClick('doctor')}
          className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-start justify-between relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide uppercase">Add Personnel</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">Register Doctor</h3>
            <p className="text-gray-500 leading-relaxed">
              Onboard a new physician to your clinic. They will have access to patient records and the AI Doctor Assistant.
            </p>
          </div>
        </div>

        {/* Register Receptionist Action Card */}
        <div 
          onClick={() => handleActionClick('receptionist')}
          className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:border-orange-200 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50 to-red-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-start justify-between relative z-10">
             <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <div className="flex items-center space-x-2 text-orange-600 mb-2">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide uppercase">Add Support Staff</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-orange-700 transition-colors">Register Receptionist</h3>
            <p className="text-gray-500 leading-relaxed">
              Create an account for front-desk staff. They handle patient check-ins and new consultations.
            </p>
          </div>
        </div>

      </div>

      {/* Quick Status Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">System Status</p>
            <p className="font-bold text-gray-900">All Modules Online</p>
          </div>
        </div>
        
        <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
        
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Today's Date</p>
            <p className="font-bold text-gray-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        
        <div className="h-10 w-px bg-gray-200 hidden md:block"></div>
        
        <div className="flex items-center">
          <button 
             onClick={() => navigate('/dashboard')}
             className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors flex items-center"
          >
             Go to Clinical Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
      
    </div>
  );
}
