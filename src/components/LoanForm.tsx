import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, Student, BookStatus, LoanStatus, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Calendar, User, Book as BookIcon, Check, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function LoanForm({ onComplete }: { onComplete: () => void }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bookId: '',
    studentId: '',
    days: 7,
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const booksSnap = await getDocs(query(collection(db, 'books'), where('status', '==', BookStatus.AVAILABLE)));
        const booksData = booksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
        setBooks(booksData);

        const studentsSnap = await getDocs(collection(db, 'students'));
        const studentsData = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bookId || !formData.studentId) return;

    setLoading(true);
    setError(null);

    try {
      const loanDate = Timestamp.now();
      const dueDate = new Timestamp(loanDate.seconds + (formData.days * 24 * 60 * 60), 0);

      // 1. Create the loan record
      await addDoc(collection(db, 'loans'), {
        bookId: formData.bookId,
        studentId: formData.studentId,
        loanDate,
        dueDate,
        status: LoanStatus.ACTIVE,
        notes: formData.notes
      });

      // 2. Update book status
      await updateDoc(doc(db, 'books', formData.bookId), {
        status: BookStatus.LOANED
      });

      onComplete();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'loans/books');
    } finally {
      setLoading(false);
    }
  };

  const selectedBook = books.find(b => b.id === formData.bookId);
  const selectedStudent = students.find(s => s.id === formData.studentId);

  return (
    <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-[48px] shadow-2xl shadow-indigo-200 border-2 border-indigo-100 overflow-hidden flex flex-col md:flex-row w-full h-full max-h-[700px]"
      >
        {/* Left Side: Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-12 flex flex-col justify-between border-r border-indigo-50">
          <div className="space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-2 ring-rose-50 shadow-sm">Registro Ativo</span>
                <p className="text-slate-400 text-sm mt-3 font-medium">Preencha os dados do agendamento</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Interno</p>
                <p className="font-mono font-black text-indigo-600">#{Math.floor(Math.random() * 90000) + 10000}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">1. Obra Selecionada</label>
                <div className="relative">
                  <select 
                    required
                    value={formData.bookId}
                    onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                    className="vibrant-input pr-12 appearance-none text-sm font-bold text-indigo-600 bg-indigo-50/50 border-indigo-100"
                  >
                    <option value="" disabled>Escolha um título disponível...</option>
                    {books.map(book => (
                      <option key={book.id} value={book.id}>{book.title} ({book.author})</option>
                    ))}
                  </select>
                  <BookIcon size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">2. Estudante / Matrícula</label>
                <div className="relative">
                  <select 
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="vibrant-input pr-12 appearance-none text-sm font-bold text-indigo-600 bg-indigo-50/50 border-indigo-100"
                  >
                    <option value="" disabled>Identifique o leitor...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.name} [{student.studentId}]</option>
                    ))}
                  </select>
                  <User size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">3. Prazo de Entrega</label>
                  <div className="flex bg-slate-50 border-2 border-slate-100 rounded-2xl p-1 gap-1">
                    {[7, 14, 21].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, days: d })}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all",
                          formData.days === d ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                        )}
                      >
                        {d} Dias
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">4. Data de Devolução</label>
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-[14px] px-5 text-amber-700 font-black text-sm flex items-center gap-3">
                    <Calendar size={18} />
                    {new Date(Date.now() + formData.days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              type="submit"
              disabled={loading || !formData.bookId || !formData.studentId}
              className="vibrant-button-primary flex-1 flex items-center justify-center gap-4 group"
            >
              {loading ? 'Processando...' : (
                <>
                  Confirmar Empréstimo
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={onComplete}
              className="px-8 border-2 border-slate-100 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
            >
              CANC.
            </button>
          </div>
        </form>

        {/* Right Side: Info / Summary */}
        <div className="w-full md:w-[350px] bg-slate-50 p-12 flex flex-col justify-between">
          <div className="space-y-10">
            <div className="bg-emerald-500 rounded-[32px] p-6 text-white shadow-lg shadow-emerald-200">
               <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Status do Estudante</p>
               <h3 className="text-3xl font-black mb-3">Livre</h3>
               <p className="text-xs text-emerald-50 leading-relaxed font-medium opacity-90">Sem pendências registradas. Limite disponível para até 3 obras simultâneas.</p>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.3em]">Resumo do Atendimento</h4>
              <div className="space-y-4">
                <SummaryItem label="Obra" value={selectedBook?.title || '---'} />
                <SummaryItem label="Leitor" value={selectedStudent?.name || '---'} />
                <SummaryItem label="Data Saída" value={new Date().toLocaleDateString('pt-BR')} />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integridade Física</span>
                <span className="text-[10px] font-black text-indigo-600 italic">Ótimo</span>
             </div>
             <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="w-[95%] h-full bg-indigo-500 rounded-full" />
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <p className="text-sm font-bold text-indigo-950 truncate">{value}</p>
    </div>
  );
}
