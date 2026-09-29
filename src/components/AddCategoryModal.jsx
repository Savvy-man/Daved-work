import React, { useState } from 'react';
import { AlertTriangle, FolderPlus } from 'lucide-react';

export default function AddCategoryModal({ isOpen, onClose, onCategoryAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const API_URL = 'http://localhost:7070';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/products/categories/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, description })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Category registration transaction failed.');
      }

      if (data.category) {
        onCategoryAdded(data.category);
      } else {
        onCategoryAdded(data);
      }

      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-indigo-600" /> Create New Category
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
              placeholder="e.g. Electronics, Raw Goods" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description (Optional)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-24 resize-none transition-all" 
              placeholder="Provide a brief summary for items under this grouping..." 
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50">
              {isSubmitting ? 'Registering...' : 'Register Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
