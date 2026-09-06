import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { Send, ShieldAlert, BadgeCheck, Zap, CornerUpLeft, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/LanguageContext';

interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorTier: string;
  replyToId?: string;
  replyToText?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt: any;
}

export default function Chat() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activeActionMsg, setActiveActionMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeActionMsg) {
      const timer = setTimeout(() => {
        setActiveActionMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeActionMsg]);

  useEffect(() => {
    const q = query(collection(db, 'global_chat'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setMessages(data.reverse());
      setLoading(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    // Listen to online users
    const qUsers = query(collection(db, 'users'), where('isOnline', '==', true));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setOnlineCount(snapshot.docs.length);
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageText = input;
    setInput('');

    try {
      if (editingMsg) {
        await updateDoc(doc(db, 'global_chat', editingMsg.id), {
          text: messageText,
          isEdited: true
        });
        setEditingMsg(null);
      } else {
        const newMsg: any = {
          text: messageText,
          authorId: user.uid,
          authorName: user.displayName,
          authorTier: user.tier,
          createdAt: serverTimestamp()
        };
        if (replyingTo) {
          newMsg.replyToId = replyingTo.id;
          newMsg.replyToText = replyingTo.text;
          setReplyingTo(null);
        }
        await addDoc(collection(db, 'global_chat'), newMsg);
      }
    } catch (e) {
      console.error(e);
      alert(language === 'ID' ? 'Gagal memproses pesan.' : 'Failed to process message.');
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm(language === 'ID' ? 'Hapus pesan ini?' : 'Delete this message?')) return;
    try {
      await updateDoc(doc(db, 'global_chat', msgId), {
        isDeleted: true,
        text: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getTierBadge = (tier: string, role: string) => {
    if (role === 'admin' || tier === 'exclusive') {
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyber-pink/20 text-cyber-pink text-[9px] font-bold tracking-widest uppercase border border-cyber-pink/40 rounded-sm ml-2"><ShieldAlert className="w-3 h-3"/> Admin</span>;
    }
    if (tier === 'vip') {
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyber-yellow/20 text-cyber-yellow text-[9px] font-bold tracking-widest uppercase border border-cyber-yellow/40 rounded-sm ml-2"><BadgeCheck className="w-3 h-3"/> VIP</span>;
    }
    if (tier === 'premium') {
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyber-cyan/20 text-cyber-cyan text-[9px] font-bold tracking-widest uppercase border border-cyber-cyan/40 rounded-sm ml-2"><Zap className="w-3 h-3"/> Premium</span>;
    }
    return null;
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '...';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    };
    return date.toLocaleDateString(language === 'ID' ? 'id-ID' : 'en-US', options);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] font-['Space_Grotesk']">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-['Orbitron'] uppercase">{t('chat')}</h1>
            <p className="text-gray-400 mt-1">{language === 'ID' ? 'Ruang obrolan publik secara real-time antar pengguna.' : 'Public real-time chat room.'}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-surface border border-cyber-cyan/30 rounded-sm">
            <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse"></div>
            <span className="text-sm font-mono text-cyber-cyan font-bold">{onlineCount} <span className="text-gray-400 font-normal">{language === 'ID' ? 'Online' : 'Online'}</span></span>
          </div>
        </header>

        <div className="flex-1 bg-cyber-surface border border-white/10 rounded-sm flex flex-col overflow-hidden relative shadow-[0_0_20px_rgba(0,243,255,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyber-cyan via-cyber-pink to-cyber-yellow z-10"></div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {loading ? (
              <div className="text-center text-cyber-cyan font-mono text-sm animate-pulse">{language === 'ID' ? 'Menghubungkan ke server...' : 'Connecting to server...'}</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 font-mono text-sm">{language === 'ID' ? 'Belum ada pesan. Jadilah yang pertama mengirim pesan.' : 'No messages yet.'}</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.authorId === user?.uid;
                const isAdmin = msg.authorTier === 'exclusive';
                const isDeleted = msg.isDeleted;
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="font-['Orbitron'] font-semibold text-sm text-gray-300">
                        {msg.authorName}
                      </span>
                      {getTierBadge(msg.authorTier, isAdmin ? 'admin' : 'member')}
                    </div>

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-full`}>
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(e, info) => {
                          if (Math.abs(info.offset.x) > 50 && !isDeleted) {
                            setReplyingTo(msg);
                            setEditingMsg(null);
                          }
                        }}
                        onClick={() => {
                          if (!isDeleted) {
                            setActiveActionMsg(activeActionMsg === msg.id ? null : msg.id);
                          }
                        }}
                        className={`px-4 py-2.5 rounded-sm max-w-sm sm:max-w-md break-words shadow-sm relative cursor-pointer ${
                          isMe 
                            ? (isDeleted ? 'bg-cyber-bg border border-white/10 text-gray-500 italic' : 'bg-cyber-cyan text-cyber-bg font-medium')
                            : isAdmin
                              ? (isDeleted ? 'bg-cyber-bg border border-white/10 text-gray-500 italic' : 'bg-cyber-pink/10 border border-cyber-pink/30 text-white')
                              : (isDeleted ? 'bg-cyber-bg border border-white/10 text-gray-500 italic' : 'bg-white/5 border border-white/10 text-gray-200')
                        }`}
                      >
                        
                        {!isDeleted && msg.replyToText && (
                           <div className={`mb-2 pl-2 border-l-2 text-xs opacity-70 pointer-events-none ${isMe ? 'border-cyber-bg/50' : 'border-cyber-cyan/50'}`}>
                             {msg.replyToText.slice(0, 50)}{msg.replyToText.length > 50 ? '...' : ''}
                           </div>
                        )}
                        
                        <div className="pointer-events-none">
                          {isDeleted ? (language === 'ID' ? 'Pesan ini dihapus' : 'This message was deleted') : msg.text}
                          
                          {!isDeleted && msg.isEdited && (
                            <span className="ml-2 text-[9px] opacity-60 uppercase font-mono">(Edited)</span>
                          )}
                        </div>
                      </motion.div>

                      {/* Action buttons (timed reveal under the chat) */}
                      <AnimatePresence>
                        {!isDeleted && activeActionMsg === msg.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className={`flex gap-2 mt-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <button onClick={() => { setReplyingTo(msg); setEditingMsg(null); setActiveActionMsg(null); }} className="p-1.5 bg-cyber-surface border border-white/10 text-gray-400 hover:text-white rounded-sm flex items-center gap-1 text-xs font-mono" title="Reply">
                              <CornerUpLeft className="w-3 h-3" /> Reply
                            </button>
                            {(isMe || user?.role === 'admin') && (
                              <button onClick={() => { deleteMessage(msg.id); setActiveActionMsg(null); }} className="p-1.5 bg-cyber-surface border border-cyber-pink/20 text-gray-400 hover:text-cyber-pink rounded-sm flex items-center gap-1 text-xs font-mono" title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            {isMe && (
                              <button onClick={() => { setEditingMsg(msg); setReplyingTo(null); setInput(msg.text); setActiveActionMsg(null); }} className="p-1.5 bg-cyber-surface border border-cyber-cyan/20 text-gray-400 hover:text-cyber-cyan rounded-sm flex items-center gap-1 text-xs font-mono" title="Edit">
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <span className={`text-[10px] text-gray-500 font-mono mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {(replyingTo || editingMsg) && (
            <div className="bg-white/5 border-t border-cyber-cyan/30 p-3 flex justify-between items-center text-sm font-mono text-gray-300">
              <div className="flex items-center gap-2">
                {replyingTo ? <CornerUpLeft className="w-4 h-4 text-cyber-cyan" /> : <Edit2 className="w-4 h-4 text-cyber-yellow" />}
                <span className="opacity-70">
                  {replyingTo 
                    ? (language === 'ID' ? `Membalas ke ${replyingTo.authorName}...` : `Replying to ${replyingTo.authorName}...`)
                    : (language === 'ID' ? `Mengedit pesan...` : `Editing message...`)
                  }
                </span>
              </div>
              <button onClick={() => { setReplyingTo(null); setEditingMsg(null); setInput(''); }} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-4 bg-black/40 border-t border-white/10">
            <form onSubmit={sendMessage} className="flex items-center gap-3">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={language === 'ID' ? "Ketik pesan Anda..." : "Type your message..."}
                className="flex-1 bg-cyber-bg border border-white/20 text-white px-4 py-3 rounded-sm focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all font-mono text-sm"
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                className={`px-6 py-3 rounded-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed ${
                  editingMsg ? 'bg-cyber-yellow hover:bg-white text-cyber-bg shadow-[0_0_15px_rgba(252,238,10,0.3)]' : 'bg-cyber-cyan hover:bg-white text-cyber-bg'
                }`}
              >
                {editingMsg ? <Edit2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
