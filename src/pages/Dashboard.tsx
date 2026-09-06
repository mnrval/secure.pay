import React, { useState, useEffect } from 'react';
import { PaymentLink } from '../types';
import { Copy, Plus, Send, ExternalLink, Lock, CheckCircle2, AlertCircle, X, Wallet, Clock, TrendingUp, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useLanguage } from '../lib/LanguageContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    title: '',
    amount: '',
    clientWa: '',
    description: '',
    secretContent: '',
    ngrokUrl: 'https://YOUR_NGROK_ID.ngrok-free.app/send-message'
  });

  const [lastAiMessage, setLastAiMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Admins see all, members see their own
    const linksRef = collection(db, 'links');
    const q = user.role === 'admin' 
      ? query(linksRef, orderBy('createdAt', 'desc'))
      : query(linksRef, where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: PaymentLink[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as PaymentLink);
      });
      setLinks(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = () => {
    if (user?.tier === 'free' && links.length >= 5) {
      alert(language === 'ID' 
        ? "Batas Limit Free Tier Tercapai! Upgrade ke Premium untuk membuat link tagihan tanpa batas." 
        : "Free Tier Limit Reached! Upgrade to Premium to create unlimited links.");
      return;
    }
    setIsModalOpen(true);
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);
    
    try {
      // Create in Firestore
      const newDoc = await addDoc(collection(db, 'links'), {
        title: form.title,
        amount: Number(form.amount),
        clientWa: form.clientWa,
        description: form.description,
        secretContent: form.secretContent,
        status: 'pending',
        ngrokUrl: user.role === 'admin' ? form.ngrokUrl : '',
        authorId: user.uid,
        createdAt: serverTimestamp()
      });

      // Call Backend to generate AI message and trigger Webhook
      const res = await fetch('/api/links/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: newDoc.id })
      });
      
      const data = await res.json();
      if (data.success) {
        setLastAiMessage(data.message);
        
        // Log Webhook execution if Admin
        if (user.role === 'admin') {
          await addDoc(collection(db, 'webhook_logs'), {
            linkId: newDoc.id,
            status: data.status || 'success',
            payload: form.ngrokUrl || '',
            message: data.message || '',
            createdAt: serverTimestamp()
          });
        }
      }
      
      setForm(f => ({ ...f, title: '', amount: '', description: '', secretContent: '' }));
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(language === 'ID' ? 'Gagal membuat tagihan.' : 'Failed to create payment link.');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteLink = async () => {
    if (!linkToDelete) return;
    try {
      await deleteDoc(doc(db, 'links', linkToDelete));
      
      if (user?.role === 'admin') {
         await addDoc(collection(db, 'webhook_logs'), {
            linkId: linkToDelete,
            status: 'deleted',
            message: 'Admin deleted payment link',
            createdAt: serverTimestamp()
         });
      }

      setLinkToDelete(null);
    } catch (e) {
      console.error("Error deleting link:", e);
      alert(language === 'ID' ? "Gagal menghapus link. Pastikan Anda memiliki akses." : "Failed to delete link.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(language === 'ID' ? 'Link berhasil disalin!' : 'Link copied to clipboard!');
  };

  const totalRevenue = links.filter(l => l.status === 'paid').reduce((sum, l) => sum + l.amount, 0);
  const pendingRevenue = links.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0);
  const totalLinks = links.length;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-['Orbitron'] uppercase">
              {language === 'ID' ? 'Dashboard Transaksi' : 'Transaction Dashboard'}
            </h1>
            <p className="text-gray-400 mt-1 font-['Space_Grotesk']">
              {language === 'ID' ? 'Pantau tagihan dan transaksi pembayaran Anda.' : 'Monitor all your invoices and payment statuses.'}
            </p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="bg-cyber-cyan hover:bg-white text-cyber-bg font-['Orbitron'] font-bold tracking-wider uppercase py-2.5 px-5 rounded-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)]"
          >
            <Plus className="w-5 h-5" />
            {language === 'ID' ? 'Buat Tagihan' : 'Create Invoice'}
          </button>
        </header>

        {/* Fremium Notice */}
        {user?.tier === 'free' && (
           <div className="bg-cyber-yellow/10 border border-cyber-yellow/50 p-4 rounded-sm flex items-center justify-between shadow-[0_0_15px_rgba(252,238,10,0.1)]">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-cyber-yellow" />
               <span className="text-sm text-gray-300 font-['Space_Grotesk']">
                 {language === 'ID' 
                   ? `Lisensi Free: Anda dapat membuat hingga 5 tautan tagihan. Saat ini Anda menggunakan ${links.length}/5.`
                   : `Free Tier: You can create up to 5 payment links. Currently using ${links.length}/5.`}
               </span>
             </div>
             {links.length >= 5 && (
                <span className="text-xs font-bold text-cyber-pink tracking-widest uppercase bg-cyber-pink/20 px-2 py-1 rounded">LIMIT REACHED</span>
             )}
           </div>
        )}

        {/* AI Notification Banner */}
        <AnimatePresence>
          {lastAiMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }} 
              animate={{ opacity: 1, y: 0, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="bg-cyber-cyan/10 p-4 rounded-sm border border-cyber-cyan/50 flex items-start justify-between overflow-hidden shadow-[0_0_15px_rgba(0,243,255,0.2)]"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 text-cyber-cyan font-['Orbitron'] font-semibold tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'ID' ? 'WHATSAPP TERKIRIM' : 'WHATSAPP SENT'}
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-['Space_Grotesk']">{lastAiMessage}</p>
              </div>
              <button onClick={() => setLastAiMessage('')} className="text-cyber-cyan hover:text-white p-1 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-['Space_Grotesk']">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-cyber-surface/50 p-6 rounded-sm border border-white/5 animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded"></div>
                  <div className="flex-1">
                    <div className="w-24 h-3 bg-white/10 rounded mb-2"></div>
                    <div className="w-32 h-6 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-cyber-surface p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-cyber-cyan/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 rounded flex items-center justify-center shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{language === 'ID' ? 'Total Pendapatan' : 'Total Revenue'}</p>
                    <p className="text-2xl font-bold text-white font-mono mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-cyber-surface p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-cyber-yellow/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-yellow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30 rounded flex items-center justify-center shadow-[0_0_10px_rgba(252,238,10,0.2)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{language === 'ID' ? 'Menunggu Pembayaran' : 'Pending Revenue'}</p>
                    <p className="text-2xl font-bold text-white font-mono mt-1">Rp {pendingRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-cyber-surface p-6 rounded-sm border border-white/10 relative overflow-hidden group hover:border-cyber-pink/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30 rounded flex items-center justify-center shadow-[0_0_10px_rgba(255,0,60,0.2)]">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{language === 'ID' ? 'Link Tagihan Aktif' : 'Active Links'}</p>
                    <p className="text-2xl font-bold text-white font-mono mt-1">{totalLinks} <span className="text-sm text-gray-500">{language === 'ID' ? 'tautan' : 'links'}</span></p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* List View */}
        <div className="bg-cyber-surface rounded-sm border border-white/10 overflow-hidden font-['Space_Grotesk']">
          <div className="p-6 border-b border-white/10 bg-black/20">
            <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-['Orbitron']">
              {language === 'ID' ? 'Daftar Link Tagihan' : 'Payment Links Directory'}
            </h2>
          </div>
          
          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-5 bg-white/10 rounded"></div>
                      <div className="w-16 h-5 bg-white/10 rounded"></div>
                    </div>
                    <div className="w-24 h-4 bg-white/10 rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-8 bg-white/10 rounded-sm"></div>
                    <div className="w-12 h-8 bg-white/10 rounded-sm"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-mono text-sm">
              {language === 'ID' ? 'Belum ada link tagihan yang dibuat.' : 'No payment links created yet.'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {links.map(link => (
                <div key={link.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white text-lg">{link.title}</h3>
                      <AnimatePresence mode="wait">
                        {link.status === 'paid' ? (
                          <motion.span 
                            key="paid"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest rounded-sm uppercase bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30"
                          >
                            {language === 'ID' ? 'Lunas' : 'Paid'}
                          </motion.span>
                        ) : (
                          <motion.span 
                            key="pending"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest rounded-sm uppercase bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30"
                          >
                            {language === 'ID' ? 'Menunggu' : 'Pending'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="text-sm text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
                      <span className="text-cyber-cyan font-semibold">Rp {link.amount.toLocaleString('id-ID')}</span>
                      <span className="hidden sm:inline opacity-30">|</span>
                      <span>Target: {link.clientWa}</span>
                      <span className="hidden sm:inline opacity-30">|</span>
                      {/* Note: In Firestore, createdAt might be a Timestamp object */}
                      <span className="text-xs">{link.createdAt ? new Date(link.createdAt?.seconds ? link.createdAt.seconds * 1000 : link.createdAt).toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US') : 'Baru saja'}</span>
                    </div>
                    <AnimatePresence>
                      {link.status === 'paid' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                          className="text-xs text-cyber-cyan flex items-center gap-1 overflow-hidden"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === 'ID' ? 'Konten rahasia telah dibuka oleh sistem.' : 'Secret content unlocked by system.'}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/pay/${link.id}`)} 
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 bg-cyber-bg border border-white/20 hover:bg-white/10 hover:border-white/40 rounded-sm flex items-center gap-2 transition-all font-['Orbitron']"
                      title={language === 'ID' ? 'Salin Tautan' : 'Copy Link'}
                    >
                      <Copy className="w-4 h-4" /> <span className="hidden lg:inline">{language === 'ID' ? 'Salin' : 'Copy'}</span>
                    </button>
                    <a 
                      href={`/pay/${link.id}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyber-bg bg-cyber-cyan hover:bg-white rounded-sm flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(0,243,255,0.2)] font-['Orbitron']"
                      title={language === 'ID' ? 'Buka Halaman Pembayaran' : 'Open Checkout'}
                    >
                      <ExternalLink className="w-4 h-4" /> <span className="hidden lg:inline">{language === 'ID' ? 'Buka' : 'Open'}</span>
                    </a>
                    <button 
                      onClick={() => setLinkToDelete(link.id)} 
                      className="px-3 py-2 text-xs font-bold text-cyber-pink bg-cyber-pink/10 border border-cyber-pink/30 hover:bg-cyber-pink hover:text-white rounded-sm flex items-center gap-2 transition-all"
                      title={language === 'ID' ? 'Hapus Tagihan' : 'Delete Invoice'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {linkToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Space_Grotesk']">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-cyber-surface border border-cyber-pink/50 rounded-sm w-full max-w-sm shadow-[0_0_40px_rgba(255,0,60,0.2)] p-6 text-center relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-cyber-pink"></div>
              <AlertTriangle className="w-12 h-12 text-cyber-pink mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white font-['Orbitron'] uppercase tracking-widest mb-2">{language === 'ID' ? 'Hapus Tagihan?' : 'Delete Link?'}</h3>
              <p className="text-sm text-gray-400 mb-6">{language === 'ID' ? 'Tindakan ini permanen. Semua data terkait tagihan dan konten rahasia akan dihapus dari sistem.' : 'This is irreversible. All associated data will be deleted.'}</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setLinkToDelete(null)}
                  className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-sm text-sm font-bold uppercase tracking-widest transition-colors font-['Orbitron']"
                >
                  {language === 'ID' ? 'Batal' : 'Cancel'}
                </button>
                <button 
                  onClick={deleteLink}
                  className="flex-1 py-2.5 px-4 bg-cyber-pink hover:bg-white text-white hover:text-cyber-bg rounded-sm text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(255,0,60,0.4)] font-['Orbitron']"
                >
                  {language === 'ID' ? 'Hapus' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Link Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-['Space_Grotesk']">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-cyber-surface border border-cyber-cyan/30 rounded-sm w-full max-w-lg shadow-[0_0_30px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/30 sticky top-0 z-10">
                <h2 className="text-sm font-bold text-white tracking-widest uppercase font-['Orbitron'] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyber-cyan" />
                  {language === 'ID' ? 'Buat Link Tagihan Baru' : 'Create New Invoice'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-cyber-pink hover:bg-cyber-pink/10 rounded-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="create-link-form" onSubmit={createLink} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-1.5">{language === 'ID' ? 'Judul Tagihan / Layanan' : 'Invoice Title / Service'}</label>
                    <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2.5 bg-cyber-bg border border-white/20 text-white rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all font-mono text-sm" placeholder="Contoh: Pembayaran Aset UI/UX Desain" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-1.5">{language === 'ID' ? 'Nominal (Rp)' : 'Amount (IDR)'}</label>
                      <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-4 py-2.5 bg-cyber-bg border border-white/20 text-white rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all font-mono text-sm" placeholder="500000" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-1.5">{language === 'ID' ? 'Nomor WA Klien' : 'Client WA Number'}</label>
                      <input required type="text" value={form.clientWa} onChange={e => setForm({...form, clientWa: e.target.value})} className="w-full px-4 py-2.5 bg-cyber-bg border border-white/20 text-white rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all font-mono text-sm" placeholder="6281234567890" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-1.5">{language === 'ID' ? 'Deskripsi Detail' : 'Detailed Description'}</label>
                    <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2.5 bg-cyber-bg border border-white/20 text-white rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all resize-none font-mono text-sm" rows={2} placeholder="Jelaskan detail tagihan ini kepada klien..." />
                  </div>

                  <div className="p-4 bg-cyber-cyan/5 border border-cyber-cyan/30 rounded-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyber-cyan"></div>
                    <label className="block text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-1 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5" />
                      {language === 'ID' ? 'Konten Rahasia (File / Link)' : 'Secret Content (File / Link)'}
                    </label>
                    <p className="text-[10px] text-gray-400 mb-3 font-mono">{language === 'ID' ? 'Konten ini akan terkunci & terbuka otomatis setelah lunas.' : 'Content will be locked until payment is verified.'}</p>
                    <textarea required value={form.secretContent} onChange={e => setForm({...form, secretContent: e.target.value})} className="w-full px-4 py-2.5 bg-cyber-bg border border-white/10 text-white rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all resize-none font-mono text-sm" rows={3} placeholder="Masukkan Link Google Drive, Password Akun, atau Keterangan Rahasia..." />
                  </div>

                  {user?.role === 'admin' && (
                    <div className="p-4 bg-cyber-pink/5 border border-cyber-pink/30 rounded-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-cyber-pink"></div>
                      <label className="block text-xs font-bold text-cyber-pink tracking-wider uppercase mb-1 flex items-center gap-2">
                        <Send className="w-3.5 h-3.5" />
                        Pengaturan Webhook (Khusus Admin)
                      </label>
                      <p className="text-[10px] text-gray-400 mb-3 font-mono">Tautkan endpoint Termux/Baileys Anda untuk pengiriman otomatis.</p>
                      <input required type="text" value={form.ngrokUrl} onChange={e => setForm({...form, ngrokUrl: e.target.value})} className="w-full px-4 py-2 bg-cyber-bg border border-white/10 text-white rounded-sm focus:border-cyber-pink focus:ring-1 focus:ring-cyber-pink outline-none transition-all text-xs font-mono" placeholder="https://..." />
                    </div>
                  )}
                </form>
              </div>

              <div className="p-4 border-t border-white/10 bg-black/40">
                <button 
                  form="create-link-form"
                  disabled={isCreating} 
                  type="submit" 
                  className="w-full bg-cyber-cyan hover:bg-white text-cyber-bg font-['Orbitron'] font-bold tracking-widest uppercase py-3 px-4 rounded-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (language === 'ID' ? 'Memproses Data...' : 'Processing...') : (language === 'ID' ? 'Buat Link Sekarang' : 'Create Link Now')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}


