import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, getCountFromServer, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Activity, Server, Database, Globe, RefreshCcw, ShieldCheck, Users, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface WebhookLog {
  id: string;
  linkId: string;
  status: string;
  message?: string;
  payload?: string;
  createdAt: any;
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  tier: string;
  createdAt: any;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('users');
  
  const [stats, setStats] = useState({
    users: 0,
    links: 0,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Listen to webhook logs
    const qLogs = query(collection(db, 'webhook_logs'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const data: WebhookLog[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as WebhookLog);
      });
      setLogs(data);
    });

    // Listen to users
    const qUsers = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const data: UserData[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as UserData);
      });
      setUsers(data);
      setLoading(false);
    });

    // Fetch stats
    const fetchStats = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const linksSnap = await getCountFromServer(collection(db, 'links'));
        setStats({
          users: usersSnap.data().count,
          links: linksSnap.data().count,
        });
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    };
    fetchStats();

    return () => {
      unsubscribeLogs();
      unsubscribeUsers();
    };
  }, [user]);

  const updateUserRole = async (userId: string, newRole: string, newTier: string) => {
    if (!confirm(`Ubah role user ini?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        tier: newTier
      });
    } catch (e) {
      console.error(e);
      alert('Gagal update user.');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Hapus data user dari database? (Auth record di Firebase Auth harus dihapus manual di console)')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus user.');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8 font-['Space_Grotesk']">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-['Orbitron'] uppercase flex items-center gap-3">
              <Server className="w-8 h-8 text-cyber-pink" />
              {language === 'ID' ? 'Panel Administrator' : 'Admin Panel'}
            </h1>
            <p className="text-gray-400 mt-1">
              {language === 'ID' ? 'Sistem monitoring infrastruktur & log Webhook.' : 'Infrastructure monitoring & Webhook logs.'}
            </p>
          </div>
        </header>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-cyber-surface border border-white/10 p-5 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-cyber-pink/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Users</p>
                <p className="text-2xl font-mono text-white mt-1">{stats.users}</p>
              </div>
              <Database className="w-8 h-8 text-cyber-pink opacity-50" />
            </div>
          </div>
          <div className="bg-cyber-surface border border-white/10 p-5 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-cyber-cyan/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total Nodes</p>
                <p className="text-2xl font-mono text-white mt-1">{stats.links}</p>
              </div>
              <Globe className="w-8 h-8 text-cyber-cyan opacity-50" />
            </div>
          </div>
          <div className="bg-cyber-surface border border-white/10 p-5 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-cyber-yellow/5"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">API Health</p>
                <p className="text-2xl font-mono text-white mt-1 text-cyber-yellow flex items-center gap-2">99.9% <ShieldCheck className="w-5 h-5"/></p>
              </div>
              <Activity className="w-8 h-8 text-cyber-yellow opacity-50" />
            </div>
          </div>
          <div className="bg-cyber-surface border border-white/10 p-5 rounded-sm relative overflow-hidden flex flex-col justify-center items-center cursor-pointer hover:bg-white/5 transition-colors">
             <RefreshCcw className="w-6 h-6 text-gray-400 mb-2" />
             <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">
               {language === 'ID' ? 'Segarkan Data' : 'Refresh Data'}
             </span>
          </div>
        </div>

        <div className="flex gap-4 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-['Orbitron'] font-bold tracking-widest uppercase text-sm rounded-sm transition-all flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50 shadow-[0_0_10px_rgba(255,0,60,0.2)]' 
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-['Orbitron'] font-bold tracking-widest uppercase text-sm rounded-sm transition-all flex items-center gap-2 ${
              activeTab === 'logs' 
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> System Logs
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-cyber-surface rounded-sm border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-black/40">
              <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-['Orbitron']">
                Registered Users Directory
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm">
                <thead className="bg-white/5 text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-medium uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-wider">Tier</th>
                    <th className="px-4 py-3 font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-300">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={u.role}
                          onChange={(e) => updateUserRole(u.id, e.target.value, u.tier)}
                          className="bg-black/50 border border-white/20 text-gray-300 text-xs rounded-sm focus:border-cyber-pink focus:ring-0 outline-none p-1"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={u.tier}
                          onChange={(e) => updateUserRole(u.id, u.role, e.target.value)}
                          className="bg-black/50 border border-white/20 text-gray-300 text-xs rounded-sm focus:border-cyber-pink focus:ring-0 outline-none p-1"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="vip">VIP</option>
                          <option value="exclusive">Exclusive</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-sm transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Webhook Logs */}
        {activeTab === 'logs' && (
        <div className="bg-cyber-surface rounded-sm border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-['Orbitron']">
              {language === 'ID' ? 'Log Webhook & AI Engine (Real-time)' : 'Webhook & AI Engine Logs (Real-time)'}
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono text-cyber-cyan">
              <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></span> Live
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500 font-mono text-sm animate-pulse">
                {language === 'ID' ? 'Menerima transmisi log...' : 'Receiving log transmission...'}
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-mono text-sm">
                {language === 'ID' ? 'Sistem kosong. Belum ada aktivitas webhook tercatat.' : 'System void. No webhook activity recorded yet.'}
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/5 text-xs uppercase tracking-widest text-gray-400 font-['Orbitron'] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Node ID</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {logs.map(log => (
                    <motion.tr 
                      initial={{ opacity: 0, backgroundColor: "rgba(255,0,60,0.2)" }} 
                      animate={{ opacity: 1, backgroundColor: "transparent" }}
                      key={log.id} 
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-widest rounded-sm border ${
                          log.status === 'success' 
                            ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30' 
                            : log.status === 'pending'
                              ? 'bg-cyber-yellow/10 text-cyber-yellow border-cyber-yellow/30'
                              : 'bg-cyber-pink/10 text-cyber-pink border-cyber-pink/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{log.linkId.slice(0,8)}...</td>
                      <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={log.message || log.payload}>
                        {log.message || log.payload || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500 text-xs">
                        {log.createdAt ? new Date(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.createdAt).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US') : 'Now'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}
      </div>
    </AppLayout>
  );
}
