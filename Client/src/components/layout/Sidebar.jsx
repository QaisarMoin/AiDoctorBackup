import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Stethoscope, 
  UserSquare, 
  UserPlus, 
  User, 
  LogOut, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

// Routes where sidebar should auto-collapse to icon-only mode
const AUTO_COLLAPSE_ROUTES = ['/doctor-audio', '/receptionist-audio'];

const Sidebar = ({ onCollapseChange }) => {
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Collapsed = icon-only mode (desktop)
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse when on doctor-audio routes
  useEffect(() => {
    const shouldCollapse = AUTO_COLLAPSE_ROUTES.some(r => location.pathname.startsWith(r));
    setCollapsed(shouldCollapse);
  }, [location.pathname]);

  // Notify parent of width changes so main content adjusts
  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  const navigation = [
    { name: 'Dashboard',            icon: LayoutDashboard,  path: '/dashboard',              module: null },
    { name: 'New Consultation',     icon: FileText,         path: '/receptionist-audio',     module: 'new_consultation' },
    { name: 'Doctor Assistant',     icon: Stethoscope,      path: '/doctor-audio',           module: 'doctor_assistant' },
    { name: 'Patient Records',      icon: UserSquare,       path: '/patient-records',        module: 'patient_records' },
    { name: 'Register Doctor',      icon: UserPlus,         path: '/register-doctor',        module: 'register_doctor' },
    { name: 'Register Receptionist',icon: UserPlus,         path: '/register-receptionist',  module: 'register_receptionist' },
    { name: 'Clinic Settings',      icon: Settings,         path: '/clinic-settings',        module: null },
    { name: 'Profile',              icon: User,             path: '/profile',                module: null },
  ];

  const filteredNavigation = navigation.filter(item =>
    !item.module || user?.accessible_modules?.includes(item.module)
  );

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40
          transition-all duration-300 ease-in-out
          ${sidebarWidth}
          transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">

          {/* Logo / Brand */}
          <div className={`border-b border-gray-100 flex items-center ${collapsed ? 'p-4 justify-center' : 'p-5 justify-between'}`}>
            <div className="flex items-center min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <h1 className="ml-3 text-base font-bold text-gray-900 leading-tight truncate">
                  AI Audio Doctor
                </h1>
              )}
            </div>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(c => !c)}
              className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ${collapsed ? 'mt-2' : ''}`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {filteredNavigation.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  title={collapsed ? item.name : undefined}
                  className={`
                    w-full flex items-center rounded-xl transition-all duration-200
                    ${collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3'}
                    ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                  {!collapsed && <span className="font-medium truncate">{item.name}</span>}
                </button>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className={`border-t border-gray-100 bg-gray-50 ${collapsed ? 'p-2' : 'p-4'}`}>
            {/* Avatar */}
            <div className={`flex items-center mb-2 ${collapsed ? 'justify-center' : 'px-2'}`}>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!collapsed && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'User'}</p>
                </div>
              )}
            </div>
            {/* Theme Toggle */}
            <button
              onClick={toggle}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`
                w-full flex items-center rounded-xl py-2.5 mb-1 text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 transition-all duration-200
                ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'}
              `}
            >
              {isDark
                ? <Sun className="w-5 h-5 flex-shrink-0 text-yellow-400" />
                : <Moon className="w-5 h-5 flex-shrink-0 text-indigo-500" />
              }
              {!collapsed && (
                <span className="font-medium">
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
              )}
            </button>
            {/* Logout */}
            <button
              onClick={logout}
              title={collapsed ? 'Logout' : undefined}
              className={`
                w-full flex items-center rounded-xl py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200
                ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'}
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
