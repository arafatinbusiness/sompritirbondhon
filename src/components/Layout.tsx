import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldCheck, User as UserIcon, X, DollarSign } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Auth } from './Auth';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  isAdmin: boolean;
  currentView?: 'dashboard' | 'admin' | 'expenses';
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  isAdmin, 
  currentView 
}) => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Login Modal */}
      {showLogin && !user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
            >
              <X size={20} />
            </button>
            <Auth />
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200 rotate-3">
                ত
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                  তহবিল ব্যবস্থাপনা
                </h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">
                  FUND MANAGER PRO
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-black text-slate-900">{user.displayName || 'ব্যবহারকারী'}</p>
                  <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{isAdmin ? 'অ্যাডমিন' : 'সদস্য'}</p>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={18} className="text-slate-400" />
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                  title="লগ আউট"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              // Show Admin Login button when user is not logged in
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
              >
                <ShieldCheck size={16} />
                অ্যাডমিন লগইন
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      {user && (
        <div className="hidden sm:flex max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                currentView === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard size={18} />
              ড্যাশবোর্ড
            </Link>
            <Link
              to="/expenses"
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                currentView === 'expenses' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <DollarSign size={18} />
              খরচ
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  currentView === 'admin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={18} />
                অ্যাডমিন প্যানেল
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Show to all users */}
      {user && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-around z-40 safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <Link
            to="/dashboard"
            className={`mobile-nav-item flex flex-col items-center ${currentView === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={24} className={currentView === 'dashboard' ? 'fill-emerald-50' : ''} />
            <span className="text-xs mt-1">ড্যাশবোর্ড</span>
          </Link>
          <Link
            to="/expenses"
            className={`mobile-nav-item flex flex-col items-center ${currentView === 'expenses' ? 'text-emerald-600' : 'text-slate-400'}`}
          >
            <DollarSign size={24} className={currentView === 'expenses' ? 'fill-emerald-50' : ''} />
            <span className="text-xs mt-1">খরচ</span>
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className={`mobile-nav-item flex flex-col items-center ${currentView === 'admin' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <ShieldCheck size={24} className={currentView === 'admin' ? 'fill-emerald-50' : ''} />
              <span className="text-xs mt-1">অ্যাডমিন</span>
            </Link>
          )}
        </nav>
      )}

      <footer className="hidden sm:block bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-xs font-medium">
          <p>© ২০২৬ তহবিল ব্যবস্থাপনা অ্যাপ। সকল অধিকার সংরক্ষিত।</p>
        </div>
      </footer>
    </div>
  );
};