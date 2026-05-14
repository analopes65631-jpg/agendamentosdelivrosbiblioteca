import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, BookStatus, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Plus, Search, Book as BookIcon, X, Trash2, Edit2, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function BookManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'books'));
    return onSnapshot(q, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Book)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'books');
    });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'books'), {
        ...newBook,
        status: BookStatus.AVAILABLE,
        createdAt: Timestamp.now()
      });
      setShowAdd(false);
      setNewBook({ title: '', author: '', isbn: '', category: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'books');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este livro?")) return;
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `books/${id}`);
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white rounded-3xl border-2 border-indigo-100 p-4 shrink-0 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Pesquisar no Acervo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium w-80 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-lg shadow-indigo-100"
        >
          <Plus size={16} /> Incluir Obra
        </button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="vibrant-card p-10 mb-10 bg-gradient-to-br from-white to-slate-50"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-indigo-950 tracking-tight">Novo Registro de Acervo</h4>
            <button onClick={() => setShowAdd(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Título do Livro</label>
                <input 
                  required
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: Dom Casmurro"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Autor / Escritor</label>
                <input 
                  required
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: Machado de Assis"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Código ISBN</label>
                <input 
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: 978-3-16-148410-0"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Categoria Literária</label>
                <input 
                  value={newBook.category}
                  onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                  className="vibrant-input"
                  placeholder="Ex: Literatura Brasileira"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowAdd(false)}
                className="px-8 py-3 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Descartar
              </button>
              <button 
                type="submit"
                className="vibrant-button-primary px-12 py-3 h-auto"
              >
                Arquivar Livro
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredBooks.map((book) => (
          <motion.div 
            layout
            key={book.id} 
            className="vibrant-card p-8 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition-all duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <span className={cn(
                  "text-[9px] font-black px-3 py-1 uppercase tracking-widest rounded-lg ring-1 transition-all",
                  book.status === BookStatus.AVAILABLE 
                    ? "text-emerald-600 bg-emerald-50 ring-emerald-100" 
                    : "text-amber-600 bg-amber-50 ring-amber-100"
                )}>
                  {book.status === BookStatus.AVAILABLE ? 'Disponível' : 'Emprestado'}
                </span>
                <button 
                  onClick={() => handleDelete(book.id!)} 
                  className="text-slate-200 hover:text-rose-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex-1">
                <h5 className="text-xl font-black text-indigo-950 tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{book.title}</h5>
                <p className="text-sm font-bold text-slate-400 mb-6 italic">{book.author}</p>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-indigo-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px]">🔖</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{book.category || 'Geral'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-300 font-bold">{book.isbn || 'SEM ISBN'}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
