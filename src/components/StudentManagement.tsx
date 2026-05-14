import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Plus, Search, User as UserIcon, X, Trash2, Edit2, Mail, Phone, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'students'));
    return onSnapshot(q, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'students');
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        createdAt: Timestamp.now()
      });
      setShowAdd(false);
      setNewStudent({ name: '', studentId: '', email: '', phone: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este estudante?")) return;
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white rounded-3xl border-2 border-indigo-100 p-4 shrink-0 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Buscar por Matrícula ou Nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium w-80 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Novo Registro
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vibrant-card p-10 mb-10 bg-gradient-to-br from-white to-indigo-50/20"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-indigo-950 tracking-tight">Cadastro de Novo Estudante</h4>
            <button onClick={() => setShowAdd(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  required
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="vibrant-input"
                  placeholder="Nome do estudante"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">RA / Matrícula</label>
                <input 
                  required
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: 2024001"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">E-mail de Contato</label>
                <input 
                  type="email"
                  required
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="vibrant-input"
                  placeholder="estudante@escola.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Telefone / Contato</label>
                <input 
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: (11) 98888-7777"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAdd(false)}
                className="px-8 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                CANC.
              </button>
              <button 
                type="submit"
                className="vibrant-button-primary px-12 py-3 h-auto"
              >
                Efetivar Matrícula
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredStudents.map((student) => (
          <motion.div 
            layout
            key={student.id} 
            className="vibrant-card p-8 group relative overflow-hidden flex gap-8 items-center"
          >
            <div className="w-24 h-24 rounded-[32px] bg-indigo-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
               <span className="text-3xl font-black">{student.name.charAt(0)}</span>
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start mb-2">
                  <h5 className="text-xl font-black text-indigo-950 truncate tracking-tight group-hover:text-indigo-600 transition-colors">{student.name}</h5>
                  <button onClick={() => handleDelete(student.id!)} className="text-slate-200 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
               </div>
               <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                    RA: {student.studentId}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    BOLSISTA N/A
                  </span>
               </div>
               <div className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                  <Mail size={12} className="text-indigo-300" />
                  {student.email || 'Sem e-mail'}
               </div>
            </div>

            <div className="absolute bottom-0 right-0 p-4 opacity-10">
               <Users size={64} strokeWidth={1} className="text-indigo-950" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
