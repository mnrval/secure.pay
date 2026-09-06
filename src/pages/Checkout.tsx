import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PaymentLink } from '../types';
import { Lock, Unlock, ShieldCheck, CreditCard, CheckCircle2, Clock, Cpu, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  
  // QRIS Simulation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrisData, setQrisData] = useState<any>(null);

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'links', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as PaymentLink;
          setLink({ ...data, id: docSnap.id });
          setIsPaid(data.status === 'paid');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [id]);

  const requestPayment = async () => {
    setIsGenerating(true);
    // Simulate AI / Xendit QRIS generation
    setTimeout(() => {
      setQrisData({
        amount: `Rp ${link?.amount.toLocaleString('id-ID')}`,
        qrisUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=AI_GENERATED_QRIS_PAYMENT_MOCKUP'
      });
      setIsGenerating(false);
    }, 1500);
  };

  const simulatePaymentSuccess = async () => {
    if (!id || !link) return;
    try {
      await updateDoc(doc(db, 'links', id), {
        status: 'paid'
      });
      setIsPaid(true);
      setQrisData(null);
    } catch (e) {
      console.error(e);
      alert("Pembayaran gagal. Silakan coba lagi.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-cyber-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!link) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center font-['Orbitron'] text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <p className="text-gray-400">Tagihan tidak ditemukan atau telah dihapus.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 flex flex-col items-center justify-center p-6 selection:bg-cyber-pink selection:text-white font-['Space_Grotesk']">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50 z-0"></div>

      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cyber-surface rounded-sm shadow-[0_0_30px_rgba(0,243,255,0.1)] border border-white/10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 pb-6 border-b border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-pink to-cyber-yellow"></div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <ShieldCheck className="w-8 h-8 text-cyber-cyan" />
              <span className="text-xl font-bold font-['Orbitron'] tracking-wider text-white">
                SECURE<span className="text-cyber-pink">.PAY</span>
              </span>
            </div>
            
            {/* Invoice Details */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <AnimatePresence mode="wait">
                  {isPaid ? (
                    <motion.span 
                      key="paid"
                      initial={{ opacity: 0, scale: 0.8, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -5 }}
                      className="px-3 py-1 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                    </motion.span>
                  ) : (
                    <motion.span 
                      key="pending"
                      initial={{ opacity: 0, scale: 0.8, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -5 }}
                      className="px-3 py-1 bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30 text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Menunggu
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest font-['Orbitron']">ID Tagihan: {id.slice(0, 8)}</h2>
              <p className="text-2xl font-bold text-white mt-1">{link.title}</p>
              <p className="text-gray-400 text-sm mt-2">{link.description}</p>
              <p className="text-3xl font-bold text-cyber-cyan font-mono mt-4">Rp {link.amount.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="p-8 pt-6 space-y-6">
            
            <div className="h-px bg-white/5 w-full" />

            {/* Content Area */}
            <motion.div layout className={`p-6 rounded-sm border transition-colors duration-500 relative overflow-hidden ${isPaid ? 'bg-cyber-cyan/5 border-cyber-cyan/30' : 'bg-black/30 border-white/10 border-dashed'}`}>
              <div className="flex items-center gap-2 mb-3">
                {isPaid ? (
                  <Unlock className="w-5 h-5 text-cyber-cyan" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
                <span className={`font-semibold font-['Orbitron'] tracking-widest uppercase text-sm ${isPaid ? 'text-cyber-cyan' : 'text-gray-400'}`}>
                  {isPaid ? 'Konten Rahasia (Terbuka)' : 'Konten Rahasia (Terkunci)'}
                </span>
              </div>
              
              <div className={`p-4 rounded-sm font-mono text-sm break-all ${isPaid ? 'bg-cyber-bg text-white border border-cyber-cyan/30' : 'bg-cyber-bg text-gray-600 border border-white/5 blur-[4px] select-none'}`}>
                {link.secretContent}
              </div>
              
              <AnimatePresence>
                {!isPaid && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-gray-400 text-center mt-4 overflow-hidden"
                  >
                    Lakukan pembayaran untuk membuka konten rahasia.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Payment Actions */}
            {!isPaid ? (
              <button 
                onClick={requestPayment}
                className="w-full bg-cyber-pink hover:bg-white text-white hover:text-cyber-bg font-['Orbitron'] font-bold tracking-widest uppercase py-4 px-4 rounded-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.3)] hover:shadow-[0_0_25px_rgba(255,0,60,0.6)]"
              >
                <CreditCard className="w-5 h-5" /> Bayar Sekarang (QRIS)
              </button>
            ) : (
              <div className="bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded-sm p-4 text-center font-['Orbitron'] font-bold tracking-widest uppercase text-sm">
                Pembayaran Berhasil
              </div>
            )}
          </div>
        </motion.div>
        
        <p className="text-center text-gray-500 text-xs mt-6 font-mono">
          Didukung oleh AI & Xendit Gateway
        </p>
      </div>

      {/* QRIS Modal */}
      <AnimatePresence>
        {(isGenerating || qrisData) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-cyber-surface border border-cyber-pink/50 p-8 rounded-sm w-full max-w-sm relative text-center shadow-[0_0_40px_rgba(255,0,60,0.2)]"
            >
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center">
                  <Cpu className="w-12 h-12 text-cyber-pink animate-pulse mb-6" />
                  <h3 className="text-lg font-bold font-['Orbitron'] text-white tracking-widest uppercase glitch-wrapper" data-text="MEMBUAT QRIS...">MEMBUAT QRIS...</h3>
                  <p className="text-xs text-gray-500 font-mono mt-2">Menghubungkan ke Gateway Pembayaran</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button onClick={() => setQrisData(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <QrCode className="w-8 h-8 text-cyber-cyan mb-4" />
                  <h3 className="text-lg font-bold font-['Orbitron'] text-white tracking-widest uppercase mb-1">Scan untuk Bayar</h3>
                  <p className="text-sm font-mono text-cyber-cyan mb-6">{qrisData.amount}</p>
                  
                  <div className="bg-white p-4 rounded-xl mb-6">
                    <img src={qrisData.qrisUrl} alt="QRIS Code" className="w-48 h-48" />
                  </div>
                  
                  <p className="text-[10px] text-gray-500 font-mono mb-6">Sistem akan memverifikasi pembayaran Anda secara otomatis.</p>
                  
                  <button 
                    onClick={simulatePaymentSuccess}
                    className="w-full py-3 bg-cyber-pink hover:bg-white text-white hover:text-cyber-bg font-bold uppercase tracking-widest text-sm transition-all rounded-sm shadow-[0_0_15px_rgba(255,0,60,0.4)]"
                  >
                    Konfirmasi Pembayaran (Simulasi)
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
