import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'ID';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  EN: {
    dashboard: 'Dashboard',
    chat: 'Global Syndicate',
    profile: 'Profile & Tier',
    admin: 'Admin Panel',
    disconnect: 'Disconnect',
    securePay: 'SECURE',
    pay: '.PAY',
    systemAdmin: 'System Admin',
  },
  ID: {
    dashboard: 'Dasbor Transaksi',
    chat: 'Chat Komunitas',
    profile: 'Profil Akun',
    admin: 'Panel Admin',
    disconnect: 'Keluar Akses',
    securePay: 'SECURE',
    pay: '.PAY',
    systemAdmin: 'Admin Sistem',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ID');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['EN']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
