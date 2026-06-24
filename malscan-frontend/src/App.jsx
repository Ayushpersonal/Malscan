import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Result from './pages/Result';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import ScanDetails from './pages/ScanDetails';
import ScanComparison from './pages/ScanComparison';
import Antigravity from './pages/Antigravity';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();

  if (location.pathname === '/') {
    return <Landing />;
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="w-full min-h-screen bg-background flex flex-col justify-center items-center">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="app-container min-h-screen bg-background text-on-surface">
      <Navbar />
      <main className="ml-64 p-margin-desktop min-h-[calc(100vh-64px-56px)] bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/scan" element={<Home />} />
          <Route path="/result" element={<Result />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scan/:id" 
            element={
              <ProtectedRoute>
                <ScanDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/compare" 
            element={
              <ProtectedRoute>
                <ScanComparison />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/antigravity" 
            element={
              <ProtectedRoute>
                <Antigravity />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <footer className="flex justify-between items-center px-margin-desktop ml-64 max-w-[calc(100%-16rem)] bg-surface-container-lowest dark:bg-surface-container-lowest w-full py-4 border-t border-outline-variant">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="MalScan Logo" className="w-5 h-5 object-contain" />
          <span className="font-label-code text-primary">MALSCAN v2.4.0</span>
          <span className="text-on-surface-variant font-label-code text-label-code opacity-50">© 2026 MalScan Defensive Intelligence</span>
        </div>
        <div className="flex gap-6">
          <a className="text-on-surface-variant font-label-code text-label-code hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="text-on-surface-variant font-label-code text-label-code hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="text-on-surface-variant font-label-code text-label-code hover:text-primary transition-colors" href="#">Security Disclosure</a>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
