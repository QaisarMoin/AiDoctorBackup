import React from 'react';
import { Stethoscope, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Common Dashboard Header Component
 * 
 * Provides consistent header with user info and logout functionality
 * for all dashboard and audio pages.
 */
const DashboardHeader = ({ title, showUser = true }) => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gray-900">
              {title || 'AI Audio Doctor Dashboard'}
            </h1>
          </div>
          
          {showUser && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
