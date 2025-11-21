import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ role, title, subtitle, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile overlay (only visible on small screens when sidebarOpen) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content - reserve space for sidebar only when open */}
      <main
        className={`relative flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <div
          className={`${
            sidebarOpen
              ? 'max-w-7xl mx-auto px-8 lg:px-10'
              : 'w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10'
          } w-full flex-1 pt-3 pb-6 lg:pb-8 absolute top-16  bottom-0 overflow-auto scrollbar-custom`}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
