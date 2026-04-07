import React from 'react';
import { Expense, ExpenseCategory } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  page: number;
  hasNextPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  selectedCategory: ExpenseCategory | 'all';
}

const categoryLabels: Record<ExpenseCategory, string> = {
  vehicle: 'গাড়ি/যানবাহন',
  program: 'প্রোগ্রাম/অনুষ্ঠান',
  food: 'খাবার/খাদ্য',
  transport: 'পরিবহন',
  office: 'অফিস খরচ',
  utilities: 'ইউটিলিটি বিল',
  other: 'অন্যান্য'
};

const categoryColors: Record<ExpenseCategory, string> = {
  vehicle: 'bg-blue-100 text-blue-800',
  program: 'bg-purple-100 text-purple-800',
  food: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
  office: 'bg-red-100 text-red-800',
  utilities: 'bg-indigo-100 text-indigo-800',
  other: 'bg-gray-100 text-gray-800'
};

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  loading,
  page,
  hasNextPage,
  onNextPage,
  onPrevPage,
  selectedCategory
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="mt-3 text-slate-600">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">কোনো খরচের তথ্য পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">খরচের তালিকা</h3>
        {selectedCategory !== 'all' && (
          <p className="text-slate-600 text-sm mt-1">
            ফিল্টার করা হয়েছে: {categoryLabels[selectedCategory]}
          </p>
        )}
      </div>
      
      <div className="divide-y divide-slate-100">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-6 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
