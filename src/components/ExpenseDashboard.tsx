import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, DocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Expense } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter, ChevronLeft, ChevronRight, PieChart, BarChart3, Download } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

// Function to generate a consistent color for a category string
const getCategoryColor = (category: string): string => {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-pink-100 text-pink-800',
    'bg-teal-100 text-teal-800',
    'bg-orange-100 text-orange-800',
    'bg-cyan-100 text-cyan-800'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export const ExpenseDashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    byCategory: {} as Record<string, number>,
    monthlyTrend: [] as Array<{ month: string; year: number; total: number }>
  });

  const fetchExpenses = async (reset = false) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'expenses'),
        orderBy('date', 'desc'),
        limit(ITEMS_PER_PAGE + 1) // Fetch one extra to check for next page
      );

      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      // Check if there's a next page
      setHasNextPage(docs.length > ITEMS_PER_PAGE);
      
      // Remove the extra doc if present
      const expensesData = docs.slice(0, ITEMS_PER_PAGE).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      
      if (reset) {
        setExpenses(expensesData);
        setPage(1);
      } else {
        setExpenses(prev => [...prev, ...expensesData]);
      }
      
      // Update last document for pagination
      if (docs.length > 0) {
        setLastDoc(docs[docs.length - 1]);
      }

      // Calculate summary
      calculateSummary(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (expensesData: Expense[]) => {
    const total = expensesData.reduce((sum, expense) => sum + expense.amount, 0);
    
    const byCategory: Record<string, number> = {};
    expensesData.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    });

    // Group by month
    const monthlyMap = new Map<string, number>();
    expensesData.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString()}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + expense.amount);
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([key, totalAmount]) => {
      const [year, month] = key.split('-');
      return {
        month: getMonthName(parseInt(month, 10)),
        year: parseInt(year, 10),
        total: totalAmount
      };
    }).sort((a, b) => a.year === b.year ? b.month.localeCompare(a.month) : b.year - a.year);

    setSummary({
      totalExpenses: total,
      byCategory,
      monthlyTrend: monthlyTrend.slice(0, 6) // Last 6 months
    });
  };

  const getMonthName = (month: number): string => {
    const months = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return months[month - 1] || '';
  };

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

  useEffect(() => {
    fetchExpenses(true);
  }, []);

  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(prev => prev + 1);
      fetchExpenses(false);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
      // For simplicity, we'll refetch from beginning
      fetchExpenses(true);
    }
  };

  const filteredExpenses = selectedCategory === 'all' 
    ? expenses 
    : expenses.filter(expense => expense.category === selectedCategory);

  // Get unique categories from expenses
  const uniqueCategories = Array.from(new Set(expenses.map(expense => expense.category))).sort();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">খরচের হিসাব</h1>
          <p className="text-slate-600">বিভিন্ন ক্যাটাগরিতে খরচের বিস্তারিত তথ্য</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-all">
            <Download size={16} />
            রিপোর্ট ডাউনলোড
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-600" size={24} />
            </div>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{formatCurrency(summary.totalExpenses)}</h3>
          <p className="text-slate-600 text-sm">মোট খরচ</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <PieChart className="text-blue-600" size={24} />
            </div>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{Object.keys(summary.byCategory).length}</h3>
          <p className="text-slate-600 text-sm">ক্যাটাগরি সংখ্যা</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <TrendingDown className="text-purple-500" size={20} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{expenses.length}</h3>
          <p className="text-slate-600 text-sm">মোট এন্ট্রি</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Filter size={20} className="text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900">ক্যাটাগরি ফিল্টার</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            সব ক্যাটাগরি
          </button>
          {uniqueCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === category ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">ক্যাটাগরি অনুযায়ী খরচ</h3>
        <div className="space-y-4">
          {Object.entries(summary.byCategory).map(([category, amount]) => {
            const percentage = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0;
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getCategoryColor(category)}`}>
                      {category}
                    </span>
                    <span className="text-slate-700 font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <span className="text-slate-600 font-medium">{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">খরচের তালিকা</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-3 text-slate-600">তথ্য লোড হচ্ছে...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">কোনো খরচের তথ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                        <span className="text-slate-500 text-sm">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{expense.title}</h4>
                      <p className="text-slate-600 mb-3">{expense.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>যোগ করেছেন: {expense.createdByName}</span>
                        <span>•</span>
                        <span>আপডেট: {formatDate(expense.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 mb-1">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-sm text-slate-500">
                        BDT
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="p-6 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${page === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                <ChevronLeft size={16} />
                পূর্ববর্তী
              </button>
              
              <div className="text-slate-700 font-medium">
                পৃষ্ঠা {page}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${!hasNextPage ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                পরবর্তী
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Monthly Trend */}
      {summary.monthlyTrend.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">মাসিক খরচের ট্রেন্ড</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {summary.monthlyTrend.map((item, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-sm text-slate-600 mb-1">{item.month}</div>
                <div className="text-lg font-bold text-slate-900 mb-1">{formatCurrency(item.total)}</div>
                <div className="text-xs text-slate-500">{item.year}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};