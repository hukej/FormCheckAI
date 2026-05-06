import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import "@tensorflow/tfjs-backend-webgl";
import { Play, Square, Loader2 } from 'lucide-react';

// Custom Hooks
import { useAppState } from './hooks';

// Layout Components
import { Sidebar, Header, AchievementsPanel } from './components/Layout';

// Lazy loaded heavy components
const CameraView = lazy(() => import('./components/Workout/CameraView/CameraView'));
const GymActivitiesList = lazy(() => import('./components/Workout/GymActivitiesList/GymActivitiesList'));
const InteractiveModel = lazy(() => import('./components/Workout/InteractiveModel/InteractiveModel'));
const ExerciseModelViewer = lazy(() => import('./components/Workout/ExerciseModelViewer/ExerciseModelViewer'));
const FeedbackPage = lazy(() => import('./components/Feedback'));
const UserProfile = lazy(() => import('./components/Profile'));
const HomeView = lazy(() => import('./components/Home/HomeView'));

// Loading Placeholder
const LoadingView = () => (
  <div className="flex-grow flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="text-sky-500 animate-spin" size={40} />
      <p className="text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicjalizacja...</p>
    </div>
  </div>
);

export default function App({ onGoToLanding, onGoToLogin, isGuest, session }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'home';

  const {
    isSidebarOpen, setIsSidebarOpen,
    showAchievements, setShowAchievements,
    muscleFilter, setMuscleFilter,
    selectedEx, setSelectedEx,
    active, setActive,
    workoutHistory,
    currentWorkoutIndex, setCurrentWorkoutIndex,
    avatarUrl, setAvatarUrl,
    selectedAchievementId,
    handleWorkoutFinish,
    handleAchievementClick
  } = useAppState();

  const isWorkoutView = location.pathname.includes('/workout');

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 text-blue-100 flex overflow-hidden relative font-sans">

      {/* 1. Sidebar Navigation */}
      {currentPath !== 'home' && (
        <div className="relative z-[1000]">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentView={currentPath}
            setCurrentView={(view) => navigate(`/app/${view}`)}
            workoutHistory={workoutHistory}
            avatarUrl={avatarUrl}
            onGoToLanding={onGoToLanding}
          />
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className={`flex-grow min-w-0 flex flex-col overflow-y-auto relative text-blue-100 
        ${currentPath === 'home' || isWorkoutView ? 'p-0' : 'p-4 md:p-8'}`}>

        {currentPath !== 'home' && !isWorkoutView && (
          <Header
            currentView={currentPath}
            setShowAchievements={setShowAchievements}
          />
        )}

        <div className="flex-grow flex flex-col min-h-0 relative">
          <Suspense fallback={<LoadingView />}>
            <Routes>
              <Route path="home" element={
                <HomeView
                  userName={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]}
                  onSelectCategory={(cat) => {
                    setMuscleFilter(cat);
                    navigate('/app/exercises');
                  }}
                />
              } />

              <Route path="exercises" element={
                <div className="h-full xl:grid xl:grid-cols-2 gap-6 min-h-0">
                  <section className="flex flex-col gap-4 min-h-[400px] order-2 xl:order-1 relative min-h-0">
                    <div className="flex-grow bg-slate-900/40 rounded-[2rem] border border-slate-800 overflow-hidden relative shadow-inner min-h-0">
                      <GymActivitiesList
                        onSelectActivity={(a) => {
                          setSelectedEx(a);
                          navigate('/app/workout');
                        }}
                        filter={muscleFilter}
                        setFilter={setMuscleFilter}
                      />
                    </div>
                  </section>
                  <section className="min-h-[480px] md:min-h-[500px] order-1 xl:order-2">
                    <div className="h-full rounded-[2rem] border border-slate-800 shadow-2xl bg-slate-950 overflow-hidden">
                      <InteractiveModel
                        onSelect={(c) => setMuscleFilter(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())}
                        currentCategory={muscleFilter.toUpperCase()}
                      />
                    </div>
                  </section>
                </div>
              } />

              <Route path="workout" element={
                <div className="relative h-full w-full">
                  <CameraView active={active} exercise={selectedEx} onFinish={handleWorkoutFinish} />

                  {/* MINI MODEL OVERLAY */}
                  <div className="absolute bottom-[110px] md:bottom-28 left-4 w-[150px] h-[165px] md:w-[320px] md:h-[240px] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden z-[140] animate-in slide-in-from-left-5 duration-700">
                    <div className="absolute top-4 left-5 z-10 flex items-center gap-2 pointer-events-none">
                      <div className="bg-sky-500 p-1 rounded-lg" />
                      <p className="text-[7px] font-black uppercase text-white tracking-[0.15em] drop-shadow-md">
                        {selectedEx?.name}
                      </p>
                    </div>
                    <ExerciseModelViewer exerciseId={selectedEx?.id} />
                  </div>
                </div>
              } />

              <Route path="feedback" element={
                <FeedbackPage
                  workouts={workoutHistory}
                  currentIndex={currentWorkoutIndex}
                  onNavigate={setCurrentWorkoutIndex}
                  onBack={() => navigate('/app/exercises')}
                  onSelectNewExercise={(ex) => {
                    setSelectedEx(ex);
                    navigate('/app/workout');
                  }}
                />
              } />

              <Route path="profile" element={
                <UserProfile
                  avatarUrl={avatarUrl}
                  isGuest={isGuest}
                  onLogin={onGoToLogin}
                  onAvatarChange={(newUrl) => {
                    setAvatarUrl(newUrl);
                    localStorage.setItem('userAvatar', newUrl);
                  }}
                  initialAchievementId={selectedAchievementId}
                />
              } />

              <Route path="*" element={<Navigate to="home" replace />} />
            </Routes>
          </Suspense>
        </div>

        {/* AI Control Panel */}
        {isWorkoutView && (
          <div className="bg-slate-900/95 backdrop-blur-xl h-[90px] md:h-[85px] flex items-center justify-between px-6 md:px-12 fixed bottom-0 left-0 w-full z-[150]">
            <div className="hidden md:block" />
            <div className="flex flex-col items-start md:items-center justify-center text-left md:text-center">
              <div className="flex items-center gap-3 mb-1.5">
                <div className={`h-3 w-3 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  {active ? 'Analiza AI Aktywna' : 'Status: Gotowość'}
                </p>
              </div>
              <p className="text-[12px] text-white font-black uppercase tracking-wider italic">
                {active ? 'Monitorowanie postawy...' : 'Ustaw się przed kamerą'}
              </p>
            </div>
            <div className="flex justify-end w-auto">
              <button
                onClick={() => setActive(!active)}
                className={`flex items-center gap-4 px-10 h-[54px] rounded-2xl border transition-all duration-500 font-black uppercase tracking-[0.25em] text-[11px] ${active
                  ? 'bg-red-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                  : 'bg-sky-500 border-sky-400 text-slate-950 shadow-[0_0_30px_rgba(14,165,233,0.4)] hover:scale-105'
                  }`}
              >
                {active ? <Square size={16} fill="white" /> : <Play size={16} fill="black" />}
                <span>{active ? 'Zakończ' : 'Rozpocznij'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      <AchievementsPanel
        showAchievements={showAchievements}
        setShowAchievements={setShowAchievements}
        handleAchievementClick={(id) => handleAchievementClick(id, (v) => navigate(`/app/${v}`), setShowAchievements)}
      />
    </div>
  );
}