import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Zap, Shield, KeySquare, Users, Cpu, ArrowRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function Landing() {
  const { signIn, user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-cyber-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyber-cyan border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 overflow-hidden relative selection:bg-cyber-pink selection:text-white">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-50"></div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyber-pink rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyber-cyan rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-cyber-yellow drop-shadow-[0_0_8px_rgba(252,238,10,0.8)]" />
          <span className="text-xl md:text-2xl font-bold font-['Orbitron'] tracking-wider glitch-wrapper text-white" data-text="SECURELINK">
            SECURELINK<span className="text-cyber-pink">.PAY</span>
          </span>
        </div>
        <button 
          onClick={signIn}
          className="px-4 py-2 md:px-6 md:py-2.5 font-['Orbitron'] font-semibold text-xs md:text-sm tracking-widest text-cyber-bg bg-cyber-cyan rounded-sm hover:bg-white transition-all shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:shadow-[0_0_25px_rgba(0,243,255,0.8)] uppercase"
        >
          Masuk / Daftar
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-32">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-full text-cyber-cyan text-xs md:text-sm font-semibold tracking-widest uppercase">
              <Cpu className="w-4 h-4" /> Sistem v2.0 Aktif
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-['Orbitron'] leading-tight text-white uppercase">
              SOLUSI PEMBAYARAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-pink">AMAN &</span> OTOMATIS.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-['Space_Grotesk'] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Kirim file kerjaan atau aset digital tanpa rasa khawatir. Klien bayar via QRIS, file otomatis terbuka, dan notifikasi WhatsApp terkirim instan. Simpel, aman, dan tanpa drama.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <button 
                onClick={signIn}
                className="group relative px-6 md:px-8 py-4 bg-cyber-pink text-white font-['Orbitron'] font-bold tracking-widest uppercase text-sm overflow-hidden whitespace-nowrap"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
                <span className="relative flex items-center justify-center gap-2 drop-shadow-[0_0_10px_rgba(255,0,60,0.8)]">
                  BUAT LINK SEKARANG <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative w-full mt-8 lg:mt-0"
          >
            <div className="relative w-full max-w-[300px] md:max-w-md aspect-square mx-auto">
              <div className="absolute inset-0 border border-cyber-cyan/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-4 border border-cyber-pink/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 bg-cyber-surface border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl flex flex-col justify-center">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-pink to-cyber-yellow"></div>
                  <Shield className="w-10 h-10 md:w-12 md:h-12 text-cyber-cyan mb-4 md:mb-6" />
                  <div className="space-y-3 md:space-y-4 font-['Space_Grotesk']">
                    <div className="h-2 w-1/2 bg-gray-700 rounded"></div>
                    <div className="h-2 w-3/4 bg-gray-700 rounded"></div>
                    <div className="h-2 w-2/3 bg-gray-700 rounded"></div>
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] md:text-xs text-cyber-cyan font-mono">STATUS: AMAN</span>
                    <KeySquare className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {[
            { icon: Shield, title: 'Proteksi Penuh', desc: 'Konten atau file Anda akan terkunci rapat dan hanya terbuka otomatis setelah klien berhasil membayar via QRIS.' },
            { icon: Zap, title: 'Notifikasi Otomatis', desc: 'Sistem cerdas kami akan membuat dan mengirimkan detail tagihan via WhatsApp secara instan ke klien Anda.' },
            { icon: Users, title: 'Komunitas Global', desc: 'Akses ke forum obrolan eksklusif. Bangun relasi dan bertukar informasi dengan sesama pengguna profesional.' }
          ].map((feature, i) => (
            <div key={i} className="bg-cyber-surface/50 border border-white/5 p-6 md:p-8 backdrop-blur-md hover:border-cyber-cyan/50 transition-colors group">
              <feature.icon className="w-8 h-8 md:w-10 md:h-10 text-gray-500 group-hover:text-cyber-cyan transition-colors mb-4 md:mb-6" />
              <h3 className="text-lg md:text-xl font-['Orbitron'] font-semibold text-white mb-2 md:mb-3 uppercase tracking-wider">{feature.title}</h3>
              <p className="text-gray-400 font-['Space_Grotesk'] text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
