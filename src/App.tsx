/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  Book as BookIcon, 
  Users, 
  Calendar, 
  Plus, 
  Library, 
  LogOut, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { auth, db } from './lib/firebase';
import { cn } from './lib/utils';
import { handleFirestoreError } from './lib/error-handler';
import { 
  Book, 
  Student, 
  Loan, 
  BookStatus, 
  LoanStatus, 
  OperationType 
} from './types';

// Components
import Dashboard from './components/Dashboard';
import BookManagement from './components/BookManagement';
import StudentManagement from './components/StudentManagement';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'loans' | 'books' | 'students' | 'new-loan'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono text-sm uppercase tracking-widest">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Carregando BiblioFlow...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="vibrant-card p-12 max-w-md w-full text-center"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-200">
              <Library size={48} className="text-indigo-900" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-indigo-950 tracking-tighter mb-2">BiblioTech</h1>
          <p className="font-medium text-slate-400 mb-10">Sistema de Gestão Vibrante para Bibliotecários</p>
          <button 
            onClick={handleLogin}
            className="vibrant-button-primary w-full flex items-center justify-center gap-3"
          >
            Acessar Sistema
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 flex font-sans text-indigo-950">
      {/* Sidebar */}
      <aside className="w-72 bg-indigo-700 p-8 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-indigo-900 text-xl shadow-lg shadow-amber-900/20">B</div>
            <h1 className="text-white font-black text-2xl tracking-tighter uppercase">BiblioTech</h1>
          </div>

          <nav className="space-y-4">
            <NavItem 
              icon={<Clock size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <NavItem 
              icon={<FileText size={20} />} 
              label="Empréstimos" 
              active={activeTab === 'loans'} 
              onClick={() => setActiveTab('loans')} 
            />
            <NavItem 
              icon={<Plus size={20} />} 
              label="Nova Ficha" 
              active={activeTab === 'new-loan'} 
              onClick={() => setActiveTab('new-loan')} 
              highlight
            />
            <div className="h-px bg-indigo-600/50 my-6" />
            <NavItem 
              icon={<BookIcon size={20} />} 
              label="Acervo" 
              active={activeTab === 'books'} 
              onClick={() => setActiveTab('books')} 
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Estudantes" 
              active={activeTab === 'students'} 
              onClick={() => setActiveTab('students')} 
            />
          </nav>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-800 rounded-3xl p-5 flex items-center gap-4 border border-indigo-600/30">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 overflow-hidden flex-shrink-0">
               {user.photoURL ? (
                 <img src={user.photoURL} alt={user.displayName || ''} referrerPolicy="no-referrer" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-white font-bold">{user.displayName?.charAt(0)}</div>
               )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
              <p className="text-[10px] uppercase font-black text-indigo-300 truncate">Administrador</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-center py-2 text-indigo-300 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 flex items-center justify-between px-12 shrink-0">
          <h2 className="text-3xl font-black text-indigo-950 tracking-tight">
            {activeTab === 'dashboard' && 'Visão Geral'}
            {activeTab === 'loans' && 'Livros em Circulação'}
            {activeTab === 'new-loan' && 'Registro de Empréstimo'}
            {activeTab === 'books' && 'Central de Acervo'}
            {activeTab === 'students' && 'Gestão de Estudantes'}
          </h2>
          <div className="flex gap-6 items-center">
            <div className="flex items-center gap-4 bg-white p-2 px-5 rounded-full shadow-sm border border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Busca Inteligente..."
                className="outline-none text-sm w-48 font-medium"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 pt-0 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
              {activeTab === 'loans' && <LoanList />}
              {activeTab === 'new-loan' && <LoanForm onComplete={() => setActiveTab('loans')} />}
              {activeTab === 'books' && <BookManagement />}
              {activeTab === 'students' && <StudentManagement />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, highlight = false }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, highlight?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/30 active:scale-95" 
          : "text-indigo-200 hover:bg-indigo-600/50 hover:text-white"
      )}
    >
      <span className={cn("transition-colors", active ? "text-amber-400" : "text-indigo-300")}>
        {icon}
      </span>
      <span className="text-sm tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-nav-dot"
          className="ml-auto w-2 h-2 bg-amber-400 rounded-full"
        />
      )}
    </button>
  );
}

