import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import CadastroAssociacao from './pages/CadastroAssociacao';
import Dashboard from './pages/Dashboard';
import Associados from './pages/Associados';
import CadastroAssociado from './pages/Associados/CadastroAssociado';
import DetalhesAssociado from './pages/Associados/DetalhesAssociado';
import Mensalidades from './pages/Mensalidades';
import Carteirinha from './pages/Carteirinha';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import Denuncia from './pages/Denuncia';
import Avaliacao from './pages/Avaliacao';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-primary-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
        <p className="text-primary-600 text-sm">Carregando...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/cadastro" element={user ? <Navigate to="/" replace /> : <CadastroAssociacao />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="associados" element={<Associados />} />
        <Route path="associados/novo" element={<CadastroAssociado />} />
        <Route path="associados/:id" element={<DetalhesAssociado />} />
        <Route path="associados/:id/editar" element={<CadastroAssociado />} />
        <Route path="mensalidades" element={<Mensalidades />} />
        <Route path="carteirinha" element={<Carteirinha />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="denuncia" element={<Denuncia />} />
        <Route path="avaliacao" element={<Avaliacao />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
