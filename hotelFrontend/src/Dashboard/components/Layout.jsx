import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ role, title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
  <div className="flex min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#474747] bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-auto lg:ml-72 xl:ml-80">
        <Header 
          title={title} 
          subtitle={subtitle} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
