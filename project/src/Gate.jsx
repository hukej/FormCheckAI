import React from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './hooks';
import { Auth, LandingPage } from './components';
import App from './App';

export default function Gate() {
  const authState = useAuth();
  const { session, loading, isGuest, setIsGuest } = authState;
  const navigate = useNavigate();

  const handleStartDemo = () => {
    setIsGuest(true);
    navigate('/app');
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  if (loading && !isGuest) {
    return (
      <div className="bg-slate-950 h-screen flex items-center justify-center text-sky-400 font-black tracking-widest animate-pulse">
        WERYFIKACJA DOSTĘPU...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={
        session ? <Navigate to="/app" replace /> : 
        <LandingPage onLaunch={handleGoToLogin} onDemo={handleStartDemo} session={session} />
      } />
      
      <Route path="/auth" element={
        session ? <Navigate to="/app" replace /> : 
        <Auth authState={authState} onGoToLanding={() => navigate('/')} />
      } />

      <Route path="/app/*" element={
        (session || isGuest) ? 
        <App 
          key={isGuest ? 'guest-app' : (session?.user?.id || 'auth-app')}
          session={session}
          isGuest={isGuest}
          onGoToLanding={() => navigate('/')}
          onGoToLogin={handleGoToLogin}
        /> : <Navigate to="/" replace />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
