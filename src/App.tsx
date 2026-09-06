/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import AdminPanel from './pages/Admin';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { LanguageProvider } from './lib/LanguageContext';
import { ToastProvider } from './lib/ToastContext';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-cyber-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
              <Route path="/pay/:id" element={<Checkout />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}


