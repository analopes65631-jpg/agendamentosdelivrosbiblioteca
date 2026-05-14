import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, Student, Loan, BookStatus, LoanStatus } from '../types';
import { Book as BookIcon, Users, FileText, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: any) => void }) {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalStudents: 0,
    activeLoans: 0,
    overdueLoans: 0
  });

  useEffect(() => {
    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      const books = snap.docs.map(doc => doc.data() as Book);
      setStats(prev => ({
        ...prev,
        totalBooks: books.length,
        availableBooks: books.filter(b => b.status === BookStatus.AVAILABLE).length
      }));
    });

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStats(prev => ({ ...prev, totalStudents: snap.size }));
    });

    const unsubLoans = onSnapshot(collection(db, 'loans'), (snap) => {
      const loans = snap.docs.map(doc => doc.data() as Loan);
      const now = Timestamp.now();
      setStats(prev => ({
        ...prev,
        activeLoans: loans.filter(l => l.status === LoanStatus.ACTIVE).length,
        overdueLoans: loans.filter(l => l.status === LoanStatus.ACTIVE && l.dueDate.toMillis() < now.toMillis()).length
      }));
    });

    return () => {
      unsubBooks();
      unsubStudents();
      unsubLoans();
    };
  }, []);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          icon={<BookIcon size={20} />} 
          label="Total no Acervo" 
          value={stats.totalBooks} 
          subValue={`${stats.availableBooks} Disponíveis`}
          variant="indigo"
        />
        <StatCard 
          icon={<Users size={20} />} 
          label="Estudantes" 
          value={stats.totalStudents} 
          subValue="Leitores ativos"
          variant="amber"
        />
        <StatCard 
          icon={<FileText size={20} />} 
          label="Empréstimos" 
          value={stats.activeLoans} 
          subValue="Livros circulando"
          variant="indigo"
        />
        <StatCard 
          icon={<AlertCircle size={20} />} 
          label="Atrasados" 
          value={stats.overdueLoans} 
          subValue="Ações necessárias"
          variant={stats.overdueLoans > 0 ? "rose" : "indigo"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="vibrant-card p-10">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-xl font-black text-indigo-950 tracking-tight">Painel de Ações</h4>
              <TrendingUp size={20} className="text-indigo-400" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <QuickAction 
                title="Cadastrar Livro" 
                description="Adicionar novas obras ao catálogo da biblioteca" 
                onClick={() => setActiveTab('books')}
              />
              <QuickAction 
                title="Novo Estudante" 
                description="Cadastrar novos membros na comunidade" 
                onClick={() => setActiveTab('students')}
              />
              <QuickAction 
                title="Gerar Ficha" 
                description="Abrir novo registro de empréstimo de obra" 
                highlight
                onClick={() => setActiveTab('new-loan')}
              />
              <QuickAction 
                title="Relatórios" 
                description="Consultar histórico e métricas mensais" 
                onClick={() => setActiveTab('loans')}
              />
            </div>
          </div>

          <div className="vibrant-card p-10 bg-gradient-to-br from-white to-indigo-50/30">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xl font-black text-indigo-950 tracking-tight">Status da Coleção</h4>
              <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Tempo Real</span>
            </div>
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-1000" 
                      style={{ width: `${(stats.availableBooks / (stats.totalBooks || 1)) * 100}%` }} 
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-1000" 
                      style={{ width: `${((stats.totalBooks - stats.availableBooks) / (stats.totalBooks || 1)) * 100}%` }} 
                    />
                  </div>
               </div>
               <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-indigo-600 rounded-lg shadow-sm" />
                    <span className="text-indigo-950">Disponível ({stats.availableBooks})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-400 rounded-lg shadow-sm" />
                    <span className="text-indigo-950">Emprestado ({stats.totalBooks - stats.availableBooks})</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-700 rounded-[40px] text-white p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-50 transition-all group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-amber-400 rounded-2xl flex items-center justify-center mb-10 shadow-lg shadow-indigo-900/40">
              <AlertCircle size={32} className="text-indigo-950" />
            </div>
            <h4 className="text-4xl font-black mb-6 leading-tight tracking-tighter italic">Vigie o fluxo.</h4>
            <p className="text-sm text-indigo-100 font-medium leading-relaxed opacity-80">
              Devoluções atrasadas afetam a disponibilidade das obras para a comunidade. 
              Mantenha o registro atualizado para garantir o acesso de todos.
            </p>
          </div>
          <div className="mt-12 relative z-10">
            <div className="text-8xl font-black tracking-tighter text-amber-400 mb-2">{stats.overdueLoans}</div>
            <div className="font-black text-[12px] uppercase tracking-[0.3em] text-indigo-300">Pendências Críticas</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, variant = "indigo" }: any) {
  const variants: any = {
    indigo: "bg-white border-indigo-100",
    emerald: "bg-emerald-500 text-white border-transparent",
    amber: "bg-amber-400 text-indigo-950 border-transparent",
    rose: "bg-rose-50 border-rose-100 text-rose-700"
  };

  return (
    <div className={cn(
      "p-8 rounded-[32px] border-2 shadow-xl shadow-indigo-200/20 transition-all hover:-translate-y-1",
      variants[variant] || variants.indigo
    )}>
      <div className={cn("flex items-center gap-3 mb-6", variant === 'indigo' ? "opacity-40" : "opacity-80")}>
        <div className={cn("p-2 rounded-xl", variant === 'indigo' ? "bg-indigo-50" : "bg-white/20")}>
          {icon}
        </div>
        <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-4xl font-black tracking-tighter mb-1">{value}</div>
      <div className={cn("text-[10px] font-bold uppercase tracking-tight", variant === 'indigo' ? "opacity-40" : "opacity-60")}>
        {subValue}
      </div>
    </div>
  );
}

function QuickAction({ title, description, onClick, highlight = false }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-left p-6 rounded-3xl border-2 transition-all group flex flex-col justify-between h-full",
        highlight 
          ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-200" 
          : "bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white"
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h5 className="font-black text-xs uppercase tracking-wider">{title}</h5>
          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-all", highlight ? 'bg-indigo-500' : 'bg-white group-hover:bg-indigo-50')}>
            <ArrowRight size={16} className={cn("transition-transform group-hover:translate-x-1", highlight ? 'text-white' : 'text-indigo-400')} />
          </div>
        </div>
        <p className={cn("text-xs font-medium leading-relaxed", highlight ? 'text-indigo-100' : 'text-slate-400')}>
          {description}
        </p>
      </div>
    </button>
  );
}
