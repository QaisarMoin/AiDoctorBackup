import axios from 'axios';
import axiosRetry from 'axios-retry';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { setupAuthInterceptor } from '../utils/auth.util';

// Production mein absolute backend URL use karo
// Development mein Vite proxy /api handle karta hai (localhost:5050)
const BASE_URL = import.meta.env.PROD
  ? 'https://aidoctorassist.dentalguru.software/api'  // cPanel backend URL
  : '/api';                                             // Vite proxy (localhost)

// Create axios instance with base configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Configure automatic retries for failed requests
// Added by Qaisar Moin: No API Retry (not retrying after API fails)
axiosRetry(api, { 
  retries: 3, // Number of retries
  retryDelay: axiosRetry.exponentialDelay, // Exponential back-off
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  },
  onRetry: (retryCount, error, requestConfig) => {
    // Added by Qaisar Moin: Toast notification for API retry attempts
    const maxRetries = 3;
    toast.loading(`[API-RETRY] Connection issue... Retrying attempt ${retryCount}/${maxRetries}`, {
      id: 'api-retry-toast', // Use fixed ID to update the same toast instead of creating new ones
      duration: 4000
    });
    console.warn(`API Auto-Retry attempt ${retryCount} for ${requestConfig.url}`);
  }
});

// Setup authentication interceptor
setupAuthInterceptor(api);

// Request interceptor to add auth token (future use)
api.interceptors.request.use(
  (config) => {
    // Added by Qaisar Moin: No Request Tracking (error aaya → pata nahi kaunsi request) - FIX
    // Make ID readable: req-[endpoint]-[short-uuid]
    const endpoint = config.url ? config.url.split('/').pop().split('?')[0] : 'unknown';
    const shortId = uuidv4().split('-')[0];
    config.headers['X-Request-ID'] = `req-${endpoint}-${shortId}`;
    
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Clear any active retry toast on success
    toast.dismiss('api-retry-toast');
    return response.data;
  },
  (error) => {
    toast.dismiss('api-retry-toast'); // Clear loading toast before showing error
    
    // Extract request ID for tracking
    const reqId = error.config?.headers?.['X-Request-ID'] || 'UNKNOWN_REQ_ID';
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error(`API Error [ReqID: ${reqId}]:`, message);
    
    return Promise.reject(error);
  }
);

// API endpoints
export const consultationAPI = {
  // Save consultation
  saveConsultation: async (consultationData) => {
    return await api.post('/consultation/save', consultationData);
  },

  // Get consultations by patient ID
  getConsultationsByPatientId: async (patientId, options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.startDate) params.append('startDate', options.startDate);
    if (options.endDate) params.append('endDate', options.endDate);

    return await api.get(`/consultation/${patientId}?${params}`);
  },

  // Get latest consultation for patient
  getLatestConsultation: async (patientId) => {
    return await api.get(`/consultation/${patientId}/latest`);
  },

  // Get specific consultation by ID
  getConsultationById: async (consultationId) => {
    return await api.get(`/consultation/detail/${consultationId}`);
  }
};

// Patient API endpoints
export const patientAPI = {
  // Create new patient
  createPatient: async (patientData) => {
    return await api.post('/patient/create', patientData);
  },

  // Get all patients
  getAllPatients: async (options = {}) => {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.search) params.append('search', options.search);
    if (options.todayOnly) params.append('todayOnly', 'true');

    return await api.get(`/patient/all?${params}`);
  },

  // Get patient by ID
  getPatientById: async (patientId) => {
    return await api.get(`/patient/get/${patientId}`);
  },

  // Update patient
  updatePatient: async (patientId, patientData) => {
    return await api.put(`/patient/update/${patientId}`, patientData);
  },

  updateVitals: async (patientId, vitalsData) => {
    return await api.put(`/patient/vitals/${patientId}`, vitalsData);
  },

  // Delete patient
  deletePatient: async (patientId) => {
    return await api.delete(`/patient/delete/${patientId}`);
  },

  // Update patient status (lifecycle: in → in progress → completed / hold)
  updateStatus: async (patientId, status) => {
    return await api.patch(`/patient/status/${patientId}`, { status });
  },

  // Batch-migrate stale 'in' patients (from previous days) to 'hold'
  // migrateStalePatientsToHold: async () => {
  //   return await api.get('/patient/migrate-stale');
  // },

  // --Qaisar: Fetch dummy patients (no DB required) — swap to getAllPatients when DB is ready
  getDummyPatients: async (search = '') => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return await api.get(`/patient/dummy${params}`);
  }
};

// Patient waiting queue — public endpoints, no auth token needed
export const queueAPI = {
  // Verify a patient by phone number (public)
  verify: async (phone) =>
    await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/queue/verify`, { phone }),

  // Get today's full queue for a clinic (public)
  getQueue: async (clinicId) =>
    await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/queue/${clinicId}`),

  // Update a patient's queue status (protected — receptionist/doctor)
  updateStatus: async (patientId, status) =>
    await api.patch(`/queue/${patientId}/status`, { status }),
};

// Added by Qaisar: Auth API endpoints
export const authAPI = {
  // Register new user
  register: async (userData) => {
    return await api.post('/auth/register', userData);
  },

  // Login user
  login: async (credentials) => {
    return await api.post('/auth/login', credentials);
  },
  
  // Get current user profile
  getProfile: async () => {
    return await api.get('/auth/profile');
  }
};

// Staff Management API (CRUD for doctors and receptionists)
export const staffAPI = {
  // --- RECEPTIONISTS ---
  getReceptionists: async () => {
    return await api.get('/staff/receptionists');
  },

  register: async (userData) => {
    return await api.post('/staff/register', userData);
  },

  updateReceptionist: async (id, data) => {
    return await api.put(`/staff/${id}`, data);
  },

  toggleStatus: async (id, status) => {
    return await api.patch(`/staff/${id}/status`, { status });
  },

  deleteReceptionist: async (id) => {
    return await api.delete(`/staff/${id}`);
  },

  // --- DOCTORS ---
  getDoctors: async () => {
    return await api.get('/staff/doctors');
  },

  registerDoctor: async (userData) => {
    return await api.post('/staff/register/doctor', userData);
  },

  updateDoctor: async (id, data) => {
    return await api.put(`/staff/doctor/${id}`, data);
  },

  toggleDoctorStatus: async (id, status) => {
    return await api.patch(`/staff/doctor/${id}/status`, { status });
  },

  deleteDoctor: async (id) => {
    return await api.delete(`/staff/doctor/${id}`);
  }
};

// Dashboard stats (real counts for patients, staff, consultations, chart)
export const statsAPI = {
  getDashboardStats: async () => {
    return await api.get('/stat/dashboard');
  }
};

// Doctor Profile API — name, designation, degrees, signature
export const doctorProfileAPI = {
  getProfile: async () => {
    return await api.get('/doctor-profile');
  },
  updateProfile: async (formData) => {
    return await api.put('/doctor-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Health check API
export const healthAPI = {
  checkHealth: async () => {
    return await api.get('/health');
  },

  checkDatabase: async () => {
    return await api.get('/health/db');
  }
};

// Clinic Settings API (Medicines & Tests)
export const clinicSettingsAPI = {
  // Medicines
  getMedicines: async () => {
    return await api.get('/settings/medicines');
  },
  addMedicine: async (data) => {
    return await api.post('/settings/medicines', data);
  },
  updateMedicine: async (id, data) => {
    return await api.put(`/settings/medicines/${id}`, data);
  },
  deleteMedicine: async (id) => {
    return await api.delete(`/settings/medicines/${id}`);
  },

  // Tests
  getTests: async () => {
    return await api.get('/settings/tests');
  },
  addTest: async (data) => {
    return await api.post('/settings/tests', data);
  },
  updateTest: async (id, data) => {
    return await api.put(`/settings/tests/${id}`, data);
  },
  deleteTest: async (id) => {
    return await api.delete(`/settings/tests/${id}`);
  }
};

export default api;
