import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PlusCircle, X, Check, AlertCircle } from 'lucide-react';

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('খরচের শিরোনাম প্রয়োজন');
      return;
    }
    
    if (!category.trim()) {
      setError('খরচের ক্যাটাগরি/কারণ লিখুন');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('সঠিক খরচের পরিমাণ লিখুন');
      return;
    }
    
    if (!date) {
      setError('তারিখ নির্বাচন করুন');
      return;
    }
    
    const user = auth.currentUser;
    if (!user) {
      setError('লগইন প্রয়োজন');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const expenseData = {
        title: title.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        date: new Date(date).toISOString(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email?.split('@')[0] || 'Admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'expenses'), expenseData);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        onSuccess?.();
      }, 2000);
      
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setError(err.message || 'খরচ যোগ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };
  
  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[^\d.]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('bn-BD').format(num);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <PlusCircle className="text-emerald-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">নতুন খরচ যোগ করুন</h3>
              <p className="text-slate-600 text-sm">খরচের বিস্তারিত তথ্য লিখুন</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-red-800 mb-1">ত্রুটি</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Check className="text-emerald-500 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-emerald-800 mb-1">সফল!</h4>
                <p className="text-emerald-700 text-sm">খরচ সফলভাবে যোগ করা হয়েছে</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              খরচের শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: অফিস ভাড়া, প্রোগ্রাম খরচ, ইত্যাদি"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              খরচের পরিমাণ (BDT) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatCurrency(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-12"
                required
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                ৳
              </div>
            </div>
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              খরচের কারণ/ক্যাটাগরি *
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="যেমন: গাড়ি মেরামত, প্রোগ্রাম খরচ, অফিস ভাড়া, ইত্যাদি"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
            />
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              তারিখ *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              required
            />
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            বিস্তারিত বিবরণ
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="খরচের বিস্তারিত বিবরণ লিখুন..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-all"
            >
              বাতিল
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <PlusCircle size={18} />
                খরচ যোগ করুন
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Help Text */}
      <div className="bg-slate-50 border-t border-slate-200 p-6">
        <h4 className="font-medium text-slate-800 mb-2">নির্দেশনা:</h4>
        <ul className="text-slate-600 text-sm space-y-1 list-disc pl-4">
          <li>খরচের শিরোনাম সংক্ষিপ্ত এবং স্পষ্ট রাখুন</li>
          <li>খরচের কারণ/ক্যাটাগরি স্পষ্টভাবে লিখুন যাতে সবাই বুঝতে পারে টাকা কোথায় খরচ হয়েছে</li>
          <li>খরচের তারিখ সঠিকভাবে নির্বাচন করুন</li>
          <li>বিস্তারিত বিবরণে প্রাসঙ্গিক তথ্য যোগ করুন</li>
        </ul>
      </div>
    </div>
  );
};