import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Zap, LayoutDashboard, MessageSquare, LogOut, Globe, Server, Menu, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { useToast } from '../lib/ToastContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOnlineCount(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    let isInitialLoad = true;
    const q = query(collection(db, 'links'), where('authorId', '==', user.uid), where('status', '==', 'paid'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const data = change.doc.data();
          showToast(`Payment Confirmed: Rp ${data.amount.toLocaleString('id-ID')} - ${data.title}`, 'success');
        }
      });
    });

    return () => unsubscribe();
  }, [user, showToast]);

  const toggleLanguage = () => {
    setLanguage(language === 'ID' ? 'EN' : 'ID');
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col md:flex-row selection:bg-cyber-pink selection:text-white relative">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-cyber-surface border-b border-white/10 relative z-40">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyber-yellow" />
          <span className="text-lg font-bold font-['Orbitron'] tracking-wider text-white">
            {t('securePay')}<span className="text-cyber-pink">{t('pay')}</span>
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex absolute md:static top-[73px] left-0 w-full ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'} h-[calc(100vh-73px)] md:h-screen bg-cyber-surface/95 md:bg-cyber-surface backdrop-blur-xl md:backdrop-blur-none border-b md:border-b-0 md:border-r border-white/10 flex-col z-30 transition-all duration-300 ease-in-out`}>
        <div className={`hidden md:flex items-center ${isSidebarCollapsed ? 'flex-col justify-center p-4 gap-4' : 'justify-between p-6'} border-b border-white/10`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-6 h-6 text-cyber-yellow flex-shrink-0 ${isSidebarCollapsed ? 'w-8 h-8' : ''}`} />
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold font-['Orbitron'] tracking-wider text-white overflow-hidden whitespace-nowrap">
                {t('securePay')}<span className="text-cyber-pink">{t('pay')}</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-gray-500 hover:text-cyber-cyan transition-colors hidden md:block"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        {!isSidebarCollapsed && user?.role === 'admin' && (
          <div className="hidden md:block px-6 py-3 border-b border-white/5">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-cyber-pink/20 border border-cyber-pink/50 text-cyber-pink text-[10px] font-bold tracking-widest uppercase rounded">
              <ShieldAlert className="w-3 h-3 flex-shrink-0" /> <span className="whitespace-nowrap">System Admin</span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 font-['Space_Grotesk'] overflow-y-auto overflow-x-hidden">
          <NavLink 
            to="/dashboard" 
            onClick={() => setIsMobileMenuOpen(false)}
            title={isSidebarCollapsed ? t('dashboard') : undefined}
            className={({isActive}) => `flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-sm transition-all ${isActive ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{t('dashboard')}</span>}
          </NavLink>
          <NavLink 
            to="/chat" 
            onClick={() => setIsMobileMenuOpen(false)}
            title={isSidebarCollapsed ? t('chat') : undefined}
            className={({isActive}) => `flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-sm transition-all ${isActive ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{t('chat')}</span>}
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink 
              to="/admin" 
              onClick={() => setIsMobileMenuOpen(false)}
              title={isSidebarCollapsed ? t('admin') : undefined}
              className={({isActive}) => `flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 rounded-sm transition-all ${isActive ? 'bg-cyber-pink/10 text-cyber-pink border-l-2 border-cyber-pink' : 'text-gray-400 hover:text-cyber-pink hover:bg-cyber-pink/5'}`}
            >
              <Server className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{t('admin')}</span>}
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 overflow-x-hidden">
          <button 
            onClick={toggleLanguage}
            title={isSidebarCollapsed ? `Language: ${language}` : undefined}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 w-full text-left text-gray-400 hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all rounded-sm font-['Space_Grotesk'] border border-transparent hover:border-cyber-cyan/30`}
          >
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <Globe className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">Language</span>}
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xs font-bold font-['Orbitron'] text-cyber-cyan bg-cyber-cyan/20 px-2 py-0.5 rounded-sm flex-shrink-0">
                {language}
              </span>
            )}
          </button>

          <button 
            onClick={signOut}
            title={isSidebarCollapsed ? t('disconnect') : undefined}
            className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-4'} py-3 w-full text-left text-gray-400 hover:text-cyber-pink hover:bg-cyber-pink/10 transition-all rounded-sm font-['Space_Grotesk']`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap overflow-hidden">{t('disconnect')}</span>}
          </button>
          
          <div className={`pt-2 mt-2 border-t border-white/5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
             <div className="flex items-center gap-2" title={isSidebarCollapsed ? `${onlineCount} Online` : undefined}>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-cyan"></span>
                </div>
                {!isSidebarCollapsed && <span className="text-xs text-gray-500 font-['Space_Grotesk']">Users Online</span>}
             </div>
             {!isSidebarCollapsed && <span className="text-xs text-cyber-cyan font-mono">{onlineCount}</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50 z-0 fixed"></div>
        <div className="relative z-10 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
