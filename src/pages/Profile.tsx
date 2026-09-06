import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, BadgeCheck, ShieldAlert, Cpu, Check, QrCode, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export default function Profile() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);

  const requestUpgrade = async (targetTier: 'premium' | 'vip') => {
    setIsGenerating(true);
    // Simulate AI / Xendit QRIS generation
    setTimeout(() => {
      setQrisData({
        tier: targetTier,
        amount: targetTier === 'premium' ? 'Rp 99.000' : 'Rp 299.000',
        qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=AI_GENERATED_QRIS_PAYMENT_MOCKUP'
      });
      setIsGenerating(false);
    }, 1500);
  };

  const simulatePaymentSuccess = async () => {
    if (!user || !qrisData) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        tier: qrisData.tier
      });
      alert(language === 'ID' 
        ? `Akun berhasil ditingkatkan ke tingkat ${qrisData.tier.toUpperCase()}! Memuat ulang sistem...`
        : `Account successfully upgraded to ${qrisData.tier.toUpperCase()}! Reloading system...`);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 font-['Space_Grotesk']">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-white font-['Orbitron'] uppercase">{t('profile')}</h1>
          <p className="text-gray-400 mt-1">{language === 'ID' ? 'Kelola tingkat akses dan identitas Anda di dalam sistem.' : 'Manage your access tier and system identity.'}</p>
        </header>

        {/* Profile Card */}
        <div className="bg-cyber-surface border border-white/10 rounded-sm p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-pink/5 rounded-full blur-[100px]"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="w-24 h-24 bg-cyber-bg border-2 border-cyber-cyan/50 rounded-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.2)]">
              <span className="text-4xl font-['Orbitron'] font-bold text-cyber-cyan">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold text-white font-['Orbitron']">{user.displayName}</h2>
              <p className="text-gray-400 font-mono text-sm">{user.email}</p>
              
              <div className="flex flex-wrap gap-3 mt-4 pt-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold tracking-widest uppercase rounded-sm">
                  {language === 'ID' ? 'Akses:' : 'Access:'} {user.role === 'admin' ? 'Administrator' : 'Member'}
                </div>
                {user.tier === 'exclusive' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyber-pink/20 border border-cyber-pink/50 text-cyber-pink text-xs font-bold tracking-widest uppercase rounded-sm shadow-[0_0_10px_rgba(255,0,60,0.2)]">
                    <ShieldAlert className="w-4 h-4" /> {language === 'ID' ? 'Eksklusif' : 'Exclusive'}
                  </div>
                )}
                {user.tier === 'vip' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow text-xs font-bold tracking-widest uppercase rounded-sm shadow-[0_0_10px_rgba(252,238,10,0.2)]">
                    <BadgeCheck className="w-4 h-4" /> VIP Member
                  </div>
                )}
                {user.tier === 'premium' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan text-xs font-bold tracking-widest uppercase rounded-sm shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                    <Zap className="w-4 h-4" /> Premium
                  </div>
                )}
                {user.tier === 'free' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-600 text-gray-400 text-xs font-bold tracking-widest uppercase rounded-sm">
                    {language === 'ID' ? 'Gratis' : 'Free'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Path */}
        {user.tier === 'free' || user.tier === 'premium' ? (
          <div className="space-y-6 pt-4">
            <h3 className="text-xl font-bold font-['Orbitron'] text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyber-yellow" /> {language === 'ID' ? 'Pilihan Paket Langganan' : 'Subscription Plans'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Premium */}
              <div className="bg-cyber-surface border border-cyber-cyan/30 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyber-cyan"></div>
                <h4 className="text-lg font-bold text-cyber-cyan font-['Orbitron'] uppercase tracking-widest">Premium Tier</h4>
                <div className="text-3xl font-mono text-white mt-2 mb-6">Rp 99k<span className="text-sm text-gray-500">/{language === 'ID' ? 'bulan' : 'month'}</span></div>
                <ul className="space-y-3 mb-8 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-cyan" /> {language === 'ID' ? 'Tak Terbatas Link Tagihan Aktif' : 'Unlimited Active Links'}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-cyan" /> {language === 'ID' ? 'Lencana Chat Premium' : 'Premium Chat Badge'}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-cyan" /> {language === 'ID' ? '0% Biaya Transaksi' : '0% Transaction Fee'}</li>
                </ul>
                <button 
                  onClick={() => requestUpgrade('premium')}
                  disabled={user.tier === 'premium' || user.tier === 'vip' || user.tier === 'exclusive'}
                  className="w-full py-3 bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan hover:bg-cyber-cyan hover:text-cyber-bg font-bold uppercase tracking-widest text-sm transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {user.tier === 'premium' ? (language === 'ID' ? 'Paket Saat Ini' : 'Current Plan') : (language === 'ID' ? 'Berlangganan Premium' : 'Upgrade to Premium')}
                </button>
              </div>

              {/* VIP */}
              <div className="bg-cyber-surface border border-cyber-yellow/50 p-6 rounded-sm relative overflow-hidden shadow-[0_0_20px_rgba(252,238,10,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-cyber-yellow"></div>
                <div className="absolute -right-6 top-4 bg-cyber-yellow text-cyber-bg text-[10px] font-bold uppercase tracking-widest py-1 px-8 rotate-45">{language === 'ID' ? 'Terpopuler' : 'Popular'}</div>
                <h4 className="text-lg font-bold text-cyber-yellow font-['Orbitron'] uppercase tracking-widest">VIP Tier</h4>
                <div className="text-3xl font-mono text-white mt-2 mb-6">Rp 299k<span className="text-sm text-gray-500">/{language === 'ID' ? 'selamanya' : 'lifetime'}</span></div>
                <ul className="space-y-3 mb-8 text-sm text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-yellow" /> {language === 'ID' ? 'Link Tagihan Tanpa Batas' : 'Unlimited Links'}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-yellow" /> {language === 'ID' ? 'Lencana & Highlight VIP' : 'VIP Chat Badge'}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyber-yellow" /> {language === 'ID' ? 'Prioritas Webhook & AI' : 'Webhook & AI Priority'}</li>
                </ul>
                <button 
                  onClick={() => requestUpgrade('vip')}
                  className="w-full py-3 bg-cyber-yellow hover:bg-white text-cyber-bg font-bold uppercase tracking-widest text-sm transition-all rounded-sm shadow-[0_0_15px_rgba(252,238,10,0.4)]"
                >
                  {language === 'ID' ? 'Dapatkan Akses VIP' : 'Get VIP Access'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-sm mt-8 text-center">
            <BadgeCheck className="w-12 h-12 text-cyber-cyan mx-auto mb-4" />
            <h3 className="text-xl font-bold font-['Orbitron'] text-white uppercase tracking-wider mb-2">{language === 'ID' ? 'Tingkat Maksimal Tercapai' : 'Maximum Tier Reached'}</h3>
            <p className="text-gray-400">{language === 'ID' ? 'Akun Anda telah memiliki tingkat akses dan fitur tertinggi di dalam sistem.' : 'Your account currently holds the highest privileges in the system.'}</p>
          </div>
        )}
      </div>

      {/* QRIS Modal */}
      <AnimatePresence>
        {(isGenerating || qrisData) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-cyber-surface border border-cyber-cyan/50 p-8 rounded-sm w-full max-w-sm relative text-center shadow-[0_0_40px_rgba(0,243,255,0.2)]"
            >
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center">
                  <Cpu className="w-12 h-12 text-cyber-cyan animate-pulse mb-6" />
                  <h3 className="text-lg font-bold font-['Orbitron'] text-white tracking-widest uppercase glitch-wrapper" data-text={language === 'ID' ? "MEMBUAT QRIS..." : "GENERATING QRIS..."}>
                    {language === 'ID' ? "MEMBUAT QRIS..." : "GENERATING QRIS..."}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-2">{language === 'ID' ? 'Menghubungkan ke Gateway Pembayaran' : 'Connecting to Payment Gateway'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button onClick={() => setQrisData(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <QrCode className="w-8 h-8 text-cyber-pink mb-4" />
                  <h3 className="text-lg font-bold font-['Orbitron'] text-white tracking-widest uppercase mb-1">{language === 'ID' ? 'Scan untuk Bayar' : 'Scan to Pay'}</h3>
                  <p className="text-sm font-mono text-cyber-cyan mb-6">Total: {qrisData.amount}</p>
                  
                  <div className="bg-white p-4 rounded-xl mb-6">
                    <img src={qrisData.qrisUrl} alt="QRIS Code" className="w-48 h-48" />
                  </div>
                  
                  <p className="text-[10px] text-gray-500 font-mono mb-6">{language === 'ID' ? 'Sistem akan memverifikasi pembayaran Anda secara otomatis.' : 'The system will automatically verify your payment.'}</p>
                  
                  <button 
                    onClick={simulatePaymentSuccess}
                    className="w-full py-3 bg-cyber-pink hover:bg-white text-white hover:text-cyber-bg font-bold uppercase tracking-widest text-sm transition-all rounded-sm shadow-[0_0_15px_rgba(255,0,60,0.4)]"
                  >
                    {language === 'ID' ? 'Konfirmasi Pembayaran (Simulasi)' : 'Confirm Payment (Simulation)'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
