// src/App.jsx
import React, { useState } from 'react';
import { BotMessageSquare, Video, BrainCircuit, Mic, Footprints, AlertTriangle } from 'lucide-react';

// === Komponent Makietowy dla Modelu 3D (Three.js) ===
// W przyszłości tu umieścisz Canvas Three.js
const Placeholder3DModel = ({ onBodyPartClick }) => (
  <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col items-center justify-center group overflow-hidden">
    <Footprints size={100} className="text-blue-950 absolute scale-150 rotate-12" />
    <img src="https://raw.githubusercontent.com/pmndrs/three-fiber/master/examples/src/resources/images/cover.jpg" alt="Model 3D" className="w-1/2 opacity-20" />
    
    <div className="text-center z-10">
      <p className="text-xl font-bold text-blue-100">Interaktywny Model Anatomiczny</p>
      <p className="text-sm text-slate-400 mt-2">[Trwają prace nad ładowaniem modelu Three.js]</p>
    </div>

    {/* MVP Area: Hotspot na nogach (symulacja) */}
    <div 
      onClick={() => onBodyPartClick('Nogi - Przysiad')}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 border-2 border-dashed border-sky-400 bg-sky-500/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-500/30 transition-all hover:scale-105"
    >
      <span className="text-sky-300 font-semibold bg-slate-900 px-2 rounded-full">[Kliknij: Nogi]</span>
    </div>
  </div>
);

// === Komponent Makietowy dla Kamery/MediaPipe ===
// W przyszłości tu będzie <video> i Canvas do rysowania punktów kluczowych
const PlaceholderCameraView = ({ feedback }) => (
  <div className="relative w-full h-full bg-slate-950 rounded-2xl border-4 border-slate-700 overflow-hidden shadow-inner">
    {/* Symulacja obrazu z kamery */}
    <img 
      src="https://images.unsplash.com/photo-1599058917412-11f81d596429?q=80&w=600&auto=format&fit=crop" 
      alt="User doing squat" 
      className="w-full h-full object-cover filter blur-sm grayscale"
    />
    
    {/* Symulacja nałożenia "Szkieletu" AI (MediaPipe) */}
    <div className="absolute inset-0 p-10 flex flex-col items-center justify-between">
      {/* Klatka głowy */}
      <div className="w-16 h-16 border-2 border-green-500 rounded-full bg-green-500/10 flex items-center justify-center text-green-300 text-xs">Głowa</div>
      
      {/* Kręgosłup */}
      <div className="w-1 h-3/5 bg-green-500 rounded"></div>
      
      {/* Kolana */}
      <div className="flex gap-40 mt-auto mb-10">
        <div className="w-10 h-10 border-2 border-green-500 rounded-full bg-green-500/20 text-green-300 text-center text-xs pt-2">Kolano (L)</div>
        <div className="w-10 h-10 border-2 border-green-500 rounded-full bg-green-500/20 text-green-300 text-center text-xs pt-2">Kolano (P)</div>
      </div>
    </div>

    {/* Live AI Feedback Overlay - MVP KEY FEATURE */}
    {feedback && (
      <div className="absolute top-4 right-4 left-4 bg-slate-900/90 p-4 rounded-xl border-l-4 border-amber-400 flex items-center gap-4 animate-pulse">
        <AlertTriangle className="text-amber-400 h-8 w-8" />
        <div>
          <h4 className="text-amber-300 font-bold text-sm uppercase">Korekta AI:</h4>
          <p className="text-blue-50 font-medium text-lg">{feedback}</p>
        </div>
      </div>
    )}
  </div>
);

// === Główny Komponent Aplikacji ===
function App() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [trainingActive, setTrainingActive] = useState(false);
  
  // Symulacja feedbacku AI (tylko do demonstracji szkieletu UI)
  const simulatedFeedback = selectedMuscle === 'Nogi - Przysiad' && trainingActive 
    ? "Schodź wolniej i wypchnij kolana do zewnątrz!" 
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-blue-100 font-sans p-6 md:p-10 flex flex-col gap-6">
      
      {/* 1. Header (Górny Pasek) */}
      <header className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-9 w-9 text-blue-400" />
          <h1 className="text-3xl font-extrabold text-blue-50 tracking-tight">
            Form<span className="text-sky-400">Check</span> <span className="text-xs font-mono text-slate-500">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${trainingActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="font-medium text-slate-300">{trainingActive ? 'W TRAKCIE ANALIZY...' : 'GOTOWY'}</span>
          <BotMessageSquare className="h-6 w-6 text-slate-500 ml-4 hover:text-blue-400 cursor-pointer" />
        </div>
      </header>

      {/* 2. Main Layout - Grid */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* --- LEWY PANEL: Three.js Model / Wybór --- */}
        <section className="flex flex-col gap-6">
          <div className="flex-grow">
            <Placeholder3DModel onBodyPartClick={(part) => setSelectedMuscle(part)} />
          </div>

          {/* Panel Sterowania MVP */}
          {selectedMuscle && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-blue-800 shadow-xl flex flex-col sm:flex-row gap-4 justify-between items-center transition-all duration-300 ease-in-out">
              <div>
                <span className="text-sm text-slate-500">Wybrany cel:</span>
                <p className="text-2xl font-bold text-sky-300">{selectedMuscle}</p>
              </div>
              <button 
                onClick={() => setTrainingActive(!trainingActive)}
                className={`px-8 py-3 rounded-full text-lg font-bold flex gap-3 transition-colors ${trainingActive ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                <Video />
                {trainingActive ? 'Zakończ Trening' : 'Rozpocznij Analizę'}
              </button>
            </div>
          )}
        </section>

        {/* --- PRAWY PANEL: MediaPipe / Camera Feed --- */}
        <section className="flex flex-col gap-6">
          <div className="flex-grow">
            <PlaceholderCameraView feedback={simulatedFeedback} />
          </div>

          {/* Panel Wskazówek/Głosowy MVP */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-400">
               <Mic className='h-5 w-5' />
               <p className='text-sm'>Status komend głosowych: <span className='text-green-400 font-medium'>Nasłuchiwanie</span></p>
            </div>
            <p className="text-xs text-slate-600 font-mono">[Tutaj będzie historia komunikatów głosowych]</p>
          </div>
        </section>
      </main>

      {/* 3. Footer / Raport po treningu (ukryty do czasu MVP 4 tydz) */}
      <footer className="text-center text-sm text-slate-700 mt-4 border-t border-slate-900 pt-4">
        FormCheck AI MVP v0.1 | Projekt: 5 Osob | Tydzień 1 Skeleton
      </footer>
    </div>
  );
}

export default App;