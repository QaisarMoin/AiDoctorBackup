import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';


/**
 * Main App Component
 * 
 * Minimal setup - only wraps the application with
 * BrowserRouter and AuthProvider. All routing logic
 * is handled by AppRoutes component.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Added by Qaisar Moin: Global toast messages and UI fix for login/register */}
        <Toaster 
          position="top-center" 
          reverseOrder={false} 
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            error: {
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: '500',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              iconTheme: {
                primary: '#DC2626',
                secondary: '#FEF2F2',
              },
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
