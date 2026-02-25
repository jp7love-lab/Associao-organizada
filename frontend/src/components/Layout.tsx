import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-500">Associação de Moradores</p>
              <p className="text-sm font-semibold text-primary-700">Fazenda Cachoeirinha - AMFAC</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-accent-500' : 'bg-secondary-500'}`} />
              <span className="text-gray-600">{user?.nome}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isAdmin ? 'bg-accent-100 text-accent-700' : 'bg-secondary-100 text-secondary-700'}`}>
                {isAdmin ? 'Admin' : 'Secretário'}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
