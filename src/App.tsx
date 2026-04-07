import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { LandingPage } from './components/LandingPage';
import { ExpenseDashboard } from './components/ExpenseDashboard';
import { User, Funding, Log, FundInfo } from './types';
import { Loader2, ShieldCheck } from 'lucide-react';

// Main App component with routing
const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [fundings, setFundings] = useState<Funding[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [fundInfo, setFundInfo] = useState<FundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);

      if (firebaseUser) {
        // Check if first admin or has admin role in DB
        const isAdminEmail = firebaseUser.email === 'arafatinbusiness@gmail.com';
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // User document exists, check admin role
            setIsAdmin(userDoc.data().role === 'admin' || isAdminEmail);
          } else {
            // User document doesn't exist - create it automatically
            setIsAdmin(isAdminEmail);
            
            // Auto-create user document on first login
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: isAdminEmail ? 'admin' : 'member',
                details: '',
                createdAt: new Date().toISOString()
              });
              console.log('Auto-created user document for:', firebaseUser.email);
            } catch (createErr) {
              console.error('Error auto-creating user document:', createErr);
            }
          }
        } catch (err) {
          console.error('Error checking user document:', err);
          setIsAdmin(isAdminEmail);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to Users (public data)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });

    // Listen to Fundings (public data)
    const unsubFundings = onSnapshot(query(collection(db, 'fundings'), orderBy('year', 'desc'), orderBy('month', 'desc')), (snapshot) => {
      setFundings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funding)));
    });

    // Listen to Logs (public data)
    const unsubLogs = onSnapshot(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log)));
    });

    // Listen to Fund Info (public data)
    const unsubInfo = onSnapshot(collection(db, 'fund_info'), (snapshot) => {
      if (!snapshot.empty) {
        setFundInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as FundInfo);
      }
    });

    setLoading(false);

    return () => {
      unsubUsers();
      unsubFundings();
      unsubLogs();
      unsubInfo();
    };
  }, [isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
        <p className="text-slate-500">তথ্য লোড হচ্ছে...</p>
      </div>
    );
  }

  // Determine current view based on route
  const getCurrentView = () => {
    if (location.pathname === '/dashboard') return 'dashboard';
    if (location.pathname === '/expenses') return 'expenses';
    if (location.pathname === '/admin') return 'admin';
    return 'dashboard';
  };

  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route path="/" element={
        !user ? (
          <LandingPage onLogin={() => window.location.href = '/dashboard'} />
        ) : (
          <Navigate to="/dashboard" replace />
        )
      } />
      
      {/* Dashboard Page */}
      <Route path="/dashboard" element={
        <Layout 
          user={user} 
          isAdmin={isAdmin} 
          currentView={getCurrentView()}
        >
          <Dashboard 
            fundings={fundings} 
            logs={logs} 
            users={users} 
            fundName={fundInfo?.name || ''} 
            isAdmin={isAdmin}
          />
        </Layout>
      } />
      
      {/* Expenses Page - Public */}
      <Route path="/expenses" element={
        <Layout 
          user={user} 
          isAdmin={isAdmin} 
          currentView={getCurrentView()}
        >
          <ExpenseDashboard />
        </Layout>
      } />
      
      {/* Admin Page - Protected */}
      <Route path="/admin" element={
        isAdmin ? (
          <Layout 
            user={user} 
            isAdmin={isAdmin} 
            currentView={getCurrentView()}
          >
            <AdminPanel 
              users={users} 
              fundings={fundings} 
              fundInfo={fundInfo} 
              currentAdmin={user} 
            />
          </Layout>
        ) : (
          <Layout 
            user={user} 
            isAdmin={isAdmin} 
            currentView={getCurrentView()}
          >
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShieldCheck className="text-slate-300 mb-4" size={48} />
              <h3 className="text-xl font-bold text-slate-700 mb-2">অ্যাডমিন এক্সেস প্রয়োজন</h3>
              <p className="text-slate-500 max-w-md">
                এই প্যানেল শুধুমাত্র অ্যাডমিন ব্যবহারকারীদের জন্য। অ্যাডমিন এক্সেস পেতে লগইন করুন।
              </p>
            </div>
          </Layout>
        )
      } />
      
      {/* Auth Page */}
      <Route path="/auth" element={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Auth />
          </div>
        </div>
      } />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;