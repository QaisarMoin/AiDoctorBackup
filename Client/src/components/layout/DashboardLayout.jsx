import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar onCollapseChange={setSidebarCollapsed} />
      {/* Main content shifts based on sidebar width */}
      <main
        className={`flex-1 h-screen flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
