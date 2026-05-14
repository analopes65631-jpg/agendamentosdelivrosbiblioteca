import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loan, Book, Student, LoanStatus, BookStatus, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Calendar, Search, Filter, CheckCircle2, AlertCircle, Clock, MoreHorizontal, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function LoanList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [books, setBooks] = useState<Record<string, string>>({});
  const [students, setStudents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LoanStatus | 'all'>('all');

  useEffect(() => {
    // Listen to loans
    const q = query(collection(db, 'loans'), orderBy('loanDate', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const loanData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Loan));
      
      // Fetch related display names if needed (or we could store them in the loan doc)
      // For this demo, we'll fetch them and cache
      const bookIds = [...new Set(loanData.map(l => l.bookId))];
      const studentIds = [...new Set(loanData.map(l => l.studentId))];

      const bookMap: Record<string, string> = { ...books };
      const studentMap: Record<string, string> = { ...students };

      for (const id of bookIds) {
        if (!bookMap[id]) {
          const b = await getDoc(doc(db, 'books', id));
          bookMap[id] = b.exists() ? b.data().title : 'Livro não encontrado';
        }
      }

      for (const id of studentIds) {
        if (!studentMap[id]) {
          const s = await getDoc(doc(db, 'students', id));
          studentMap[id] = s.exists() ? s.data().name : 'Estudante não encontrado';
        }
      }

      setBooks(bookMap);
      setStudents(studentMap);
      setLoans(loanData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'loans');
    });

    return () => unsub();
  }, []);

  const handleReturn = async (loan: Loan) => {
    if (!loan.id) return;
    try {
      await updateDoc(doc(db, 'loans', loan.id), {
        status: LoanStatus.RETURNED,
        returnDate: Timestamp.now()
      });

      await updateDoc(doc(db, 'books', loan.bookId), {
        status: BookStatus.AVAILABLE
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loan.id}`);
    }
  };

  const filteredLoans = loans.filter(l => filter === 'all' || l.status === filter);

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white rounded-3xl border-2 border-indigo-100 p-4 shrink-0 shadow-sm">
        <div className="flex bg-indigo-50/50 p-1 rounded-2xl gap-1">
          {['all', 'active', 'returned', 'overdue'].map((stat) => (
            <button
              key={stat}
              onClick={() => setFilter(stat as any)}
              className={cn(
                "px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                filter === stat ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-100" : "text-slate-400 hover:text-indigo-400"
              )}
            >
              {stat === 'all' ? 'Ver Todos' : stat === 'active' ? 'Abertos' : stat === 'returned' ? 'Histórico' : 'Pendências'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-6 pr-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
            <Filter size={14} className="text-indigo-300" /> 
            <span>Painel Auditável</span>
          </div>
        </div>
      </div>

      <div className="vibrant-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b-2 border-indigo-50">
                <th className="px-8 py-6 text-[10px] font-black text-indigo-900 uppercase tracking-widest">Acervo</th>
                <th className="px-8 py-6 text-[10px] font-black text-indigo-900 uppercase tracking-widest">Leitor</th>
                <th className="px-8 py-6 text-[10px] font-black text-indigo-900 uppercase tracking-widest">Datas</th>
                <th className="px-8 py-6 text-[10px] font-black text-indigo-900 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-indigo-900 uppercase tracking-widest text-right">Controle</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <FileText size={64} strokeWidth={1} />
                      <p className="font-black text-xs uppercase tracking-[0.2em]">Sem registros para exibir</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const isOverdue = loan.status === LoanStatus.ACTIVE && loan.dueDate.toMillis() < Date.now();
                  
                  return (
                    <motion.tr 
                      layout
                      key={loan.id} 
                      className="border-b border-indigo-50 hover:bg-indigo-50/20 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="font-bold text-sm text-indigo-950 mb-1">{books[loan.bookId] || '...'}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400">#L-{loan.id?.slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700">{students[loan.studentId] || '...'}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-bold text-[10px] text-slate-400">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                             SAÍDA: {loan.loanDate.toDate().toLocaleDateString('pt-BR')}
                          </div>
                          <div className={cn("flex items-center gap-2 font-bold text-[10px]", isOverdue ? "text-rose-500" : "text-indigo-600")}>
                             <span className={cn("w-1.5 h-1.5 rounded-full", isOverdue ? "bg-rose-500 animate-pulse" : "bg-indigo-600")} />
                             DATA: {loan.dueDate.toDate().toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <StatusBadge status={loan.status} isOverdue={isOverdue} />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {loan.status === LoanStatus.ACTIVE ? (
                          <button 
                            onClick={() => handleReturn(loan)}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-md shadow-indigo-100 hover:shadow-emerald-100 active:scale-95"
                          >
                            Dar Baixa
                          </button>
                        ) : (
                          <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center justify-end gap-2">
                            <CheckCircle2 size={14} /> Arquivado
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, isOverdue }: { status: LoanStatus, isOverdue: boolean }) {
  if (status === LoanStatus.RETURNED) {
    return (
      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full ring-1 ring-emerald-200">
        Devolvido
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-4 py-1.5 rounded-full ring-1 ring-rose-200">
        Atrasado
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full ring-1 ring-indigo-200">
      Em Aberto
    </span>
  );
}
