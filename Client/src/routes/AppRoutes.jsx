import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';

// Import page components
import DoctorLogin from '../pages/Login';
import ClinicLogin from '../pages/ClinicLogin';
import ClinicSignup from '../pages/ClinicSignup'; // Added by Qaisar: Clinic Admin registration
import Dashboard from '../pages/Dashboard';
import ClinicDashboard from '../pages/ClinicDashboard'; // Added by Qaisar: Clinic Admin landing page
import ReceptionistAudio from '../components/ReceptionistAudio';
import DoctorAudio from '../components/DoctorAudio';
import PatientRecords from '../pages/PatientRecords'; // --Qaisar
import StaffManagement from '../pages/StaffManagement'; // Updated by Qaisar - was RegisterReceptionist
import PatientWaiting from '../pages/PatientWaiting'; // Public patient waiting queue
import ClinicSettings from '../pages/ClinicSettings'; // Added custom clinic settings

// Layouts and Sections
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import ProfileSection from '../components/dashboard/ProfileSection';

// OAuth Callback Component
const OAuthCallback = () => {
  const { isAuthenticated } = useAuth();
  
  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // The Login component will handle the OAuth callback
  return <DoctorLogin />;
};

/**
 * AppRoutes Component
 * 
 * Defines all application routes with proper authentication handling.
 * Uses PrivateRoute wrapper for protected routes.
 * Easily extensible for future routes.
 */
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <DoctorLogin />
        } 
      />

      {/* Added by Qaisar: Clinic Admin Registration */}
      <Route 
        path="/clinic-signup" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <ClinicSignup />
        } 
      />

      {/* Added by Qaisar: Clinic Admin Login */}
      <Route 
        path="/clinic-login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <ClinicLogin />
        } 
      />

      {/* Public patient waiting room — no login required */}
      <Route path="/waiting" element={<PatientWaiting />} />
      
      {/* OAuth Callback Route */}
      <Route 
        path="/auth/callback" 
        element={<OAuthCallback />} 
      />
      
      {/* Protected Routes wrapped in DashboardLayout */}
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="receptionist-audio" element={<ReceptionistAudio />} />
        <Route path="doctor-audio" element={<DoctorAudio />} />
        <Route path="doctor-audio/:patientId" element={<DoctorAudio />} />
        <Route path="patient-records" element={<PatientRecords />} />
        <Route path="register-doctor" element={<StaffManagement fixedRole="doctor" />} />
        <Route path="register-receptionist" element={<StaffManagement fixedRole="receptionist" />} />
        <Route path="clinic-dashboard" element={<ClinicDashboard />} />
        <Route path="clinic-settings" element={<ClinicSettings />} />
        <Route path="profile" element={<ProfileSection />} />
      </Route>

      {/* Catch all route - redirect to appropriate page */}
      <Route 
        path="*" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
