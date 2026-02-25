import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, BadgeCheck,
  BarChart3, Settings, ChevronLeft, ChevronRight, X, Building2, Shield, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel', exact: true },
  { to: '/associados', icon: Users, label: 'Sócios' },
  { to: '/mensalidades', icon: CreditCard, label: 'Mensalidades' },
  { to: '/carteirinha', icon: BadgeCheck, label: 'Carteirinha' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/denuncia', icon: Shield, label: 'Denúncias' },
  { to: '/avaliacao', icon: Star, label: 'Avaliação' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', adminOnly: true },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, user } = useAuth();

  const filteredItems = navItems.filter(i => !i.adminOnly || isAdmin);
  const assocNome = user?.associacao_nome || 'AMFAC';
  const assocAbrev = assocNome.split(' ').map((w: string) => w[0]).join('').slice(0, 4).toUpperCase();
  const logoSrc = (user as any)?.logo || '/logo.png';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-primary-700">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="bg-white rounded-full p-0.5 flex-shrink-0 shadow">
            <img src={logoSrc} alt="Logo" className="w-8 h-8 rounded-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight truncate max-w-[140px]" title={assocNome}>
                {assocNome.length > 16 ? assocAbrev : assocNome}
              </p>
              <p className="text-primary-300 text-xs truncate max-w-[140px]">{user?.nome}</p>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex text-primary-300 hover:text-white p-1 rounded transition-colors flex-shrink-0">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
          return (
            <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                ${isActive ? 'bg-primary-500 text-white shadow-sm' : 'text-primary-200 hover:bg-primary-700 hover:text-white'}
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-primary-700">
          <div className="flex items-center gap-2 text-xs text-primary-400">
            <Building2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate" title={assocNome}>{assocNome}</span>
          </div>
          <p className="text-primary-500 text-xs mt-1">v2.0 © Associação Organizada</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
        bg-primary-800 flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between lg:hidden p-4">
          <span className="text-white font-bold">{assocAbrev}</span>
          <button onClick={() => setMobileOpen(false)} className="text-white"><X className="w-5 h-5" /></button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
