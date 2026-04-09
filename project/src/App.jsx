// src/App.jsx
import React, { useState, useRef } from 'react';
import Webcam from "react-webcam";
import { 
  BotMessageSquare, Video, BrainCircuit, Footprints, AlertTriangle, CameraOff 
} from 'lucide-react';

// === Komponent Kamery ===
const CameraView = ({ isActive, feedback }) => {
  const webcamRef = useRef(null);
  const videoConstraints = { width: 1280, height: 720, facingMode: "user" };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
      {isActive ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            className="w-full h-full object-cover scale-x-[-1] animate-in fade-in duration-700"
            videoConstraints={videoConstraints}
          />
          {/* Szkielet AI Overlay (Makieta) */}
          <div className="absolute inset-0 p-10 flex flex-col items-center justify-between pointer-events-none opacity-40">
             <div className="w-16 h-16 border-2 border-sky-400 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-300 text-[10px] uppercase font-bold tracking-widest">Głowa</div>
             <div className="w-1 h-3/5 bg-sky-400 rounded shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
             <div className="flex gap-40 mt-auto mb-10">
               <div className="w-8 h-8 border-2 border-sky-400 rounded-full bg-sky-400/20"></div>
               <div className="w-8 h-8 border-2 border-sky-400 rounded-full bg-sky-400/20"></div>
             </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-700">
          <CameraOff size={64} className="opacity-20" />
          <p className="text-sm font-mono tracking-widest uppercase opacity-40">Wybierz nogi i kliknij Start</p>
        </div>
      )}

      {feedback && isActive && (
        <div className="absolute top-4 right-4 left-4 bg-slate-900/95 p-4 rounded-xl border-l-4 border-amber-400 flex items-center gap-4 shadow-2xl animate-bounce z-50">
          <AlertTriangle className="text-amber-400 h-8 w-8 shrink-0" />
          <div>
            <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">Korekta AI</h4>
            <p className="text-blue-50 font-medium text-lg leading-tight">{feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// === Komponent Modelu 3D ===
const Placeholder3DModel = ({ onBodyPartClick, activePart }) => (
  <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col items-center justify-center group overflow-hidden">
    <Footprints size={120} className="text-blue-950 absolute scale-150 rotate-12 opacity-50" />
    <div className="text-center z-10">
      <p className="text-xl font-black text-blue-100 uppercase tracking-widest italic leading-tight">Interaktywny<br/>Model 3D</p>
      <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase italic tracking-tighter">Skeleton week 1</p>
    </div>
    <div 
      onClick={() => onBodyPartClick('Nogi - Przysiad')}
      className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 border-2 border-dashed rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 ${
        activePart === 'Nogi - Przysiad' ? 'border-sky-400 bg-sky-400/20 shadow-[0_0_20px_rgba(56,189,248,0.2)]' : 'border-slate-700 hover:border-sky-400'
      }`}
    >
       <span className={`text-[10px] font-black px-3 py-1 rounded-full border transition-colors uppercase ${
         activePart === 'Nogi - Przysiad' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-900 text-sky-400 border-sky-400/30'
       }`}>
         {activePart === 'Nogi - Przysiad' ? 'Wybrano Nogi' : 'Kliknij: Nogi'}
       </span>
    </div>
  </div>
);

// === Główny Komponent App ===
function App() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [trainingActive, setTrainingActive] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-blue-100 p-4 md:p-8 flex flex-col gap-6">
      
      {/* Header */}
      <header className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-10 w-10 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">
            Form<span className="text-sky-400">Check</span><span className="text-slate-600 font-light ml-1 text-sm italic">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-full border border-slate-800">
          <div className={`h-2 w-2 rounded-full ${trainingActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {trainingActive ? 'Analiza w toku' : 'System gotowy'}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lewy Panel: Sterowanie i Model */}
        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
            <Placeholder3DModel onBodyPartClick={setSelectedMuscle} activePart={selectedMuscle} />
          </div>

          {selectedMuscle && (
            <div className="bg-slate-900 p-8 rounded-3xl border border-sky-900/40 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Trening</span>
                <p className="text-3xl font-black text-sky-300 italic uppercase leading-none">{selectedMuscle}</p>
              </div>
              <button 
                onClick={() => setTrainingActive(!trainingActive)}
                className={`w-full sm:w-auto px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl ${
                  trainingActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-900/20' 
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                }`}
              >
                {trainingActive ? 'Zakończ' : 'Rozpocznij'}
              </button>
            </div>
          )}
        </section>

        {/* Prawy Panel: Kamera */}
        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
            <CameraView 
              isActive={trainingActive} 
              feedback={trainingActive ? "Utrzymuj proste plecy!" : null} 
            />
          </div>
          
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
              Status: <span className="text-sky-500">Podgląd wizyjny aktywny</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="text-center text-[10px] text-slate-800 font-mono tracking-[0.4em] uppercase py-4 border-t border-slate-900/50">
        FormCheck AI | Sprint 1 Prototype | Build 0426
      </footer>
    </div>
  );
}

export default App;