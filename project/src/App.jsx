import React, { useState, useRef, useEffect } from 'react';
import Webcam from "react-webcam";
import { 
  BotMessageSquare, Video, BrainCircuit, Footprints, AlertTriangle, 
  CameraOff, LayoutGrid, Activity as ActivityIcon, Play, Square 
} from 'lucide-react';

import GymActivitiesList from './GymActivitiesList';

<<<<<<< HEAD
// === Komponent Kamery (z MediaPipe) ===
=======
// === Komponent Kamery z Analizą MediaPipe ===
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
const CameraView = ({ isActive, feedback }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const onResults = (results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
<<<<<<< HEAD
=======

>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
    const canvasCtx = canvasRef.current.getContext("2d");
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    canvasCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

    if (results.poseLandmarks) {
      if (window.drawConnectors && window.POSE_CONNECTIONS) {
        window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: "#38bdf8",
          lineWidth: 4,
        });
      }
      if (window.drawLandmarks) {
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#ffffff",
          fillColor: "#0ea5e9",
          lineWidth: 2,
          radius: 4,
        });
      }
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    let pose = null;
<<<<<<< HEAD
=======

>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
    const initPose = async () => {
      if (isActive && window.Pose) {
        pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
<<<<<<< HEAD
=======

>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
<<<<<<< HEAD
        pose.onResults(onResults);
        if (webcamRef.current?.video && window.Camera) {
          cameraRef.current = new window.Camera(webcamRef.current.video, {
            onFrame: async () => {
              if (webcamRef.current?.video) await pose.send({ image: webcamRef.current.video });
=======

        pose.onResults(onResults);

        if (webcamRef.current?.video && window.Camera) {
          cameraRef.current = new window.Camera(webcamRef.current.video, {
            onFrame: async () => {
              if (webcamRef.current?.video) {
                await pose.send({ image: webcamRef.current.video });
              }
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
            },
            width: 1280,
            height: 720,
          });
          cameraRef.current.start();
        }
      }
    };
<<<<<<< HEAD
    initPose();
=======

    initPose();

>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (pose) pose.close();
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
      {isActive ? (
        <>
<<<<<<< HEAD
          <Webcam audio={false} ref={webcamRef} className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover scale-x-[-1] animate-in fade-in duration-700" />
=======
          <Webcam
            audio={false}
            ref={webcamRef}
            className="hidden"
            videoConstraints={{ facingMode: "user" }}
          />
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover scale-x-[-1] animate-in fade-in duration-700"
          />
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-700">
          <CameraOff size={64} className="opacity-20" />
          <p className="text-sm font-mono tracking-widest uppercase opacity-40">Kamera nieaktywna</p>
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

<<<<<<< HEAD
// === Komponent Modelu 3D ===
=======
// === Komponent Modelu 3D (Placeholder) ===
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
const Placeholder3DModel = ({ onBodyPartClick, activePart }) => (
  <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700 p-6 flex flex-col items-center justify-center group overflow-hidden transition-colors hover:border-slate-600">
    <Footprints size={120} className="text-blue-950 absolute scale-150 rotate-12 opacity-50" />
    <div className="text-center z-10">
      <p className="text-xl font-black text-blue-100 uppercase tracking-widest italic leading-tight">Interaktywny<br/>Model 3D</p>
      <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase italic tracking-tighter">Skeleton week 1</p>
    </div>
    {/* Klikalna strefa nóg (niewidoczna/subtelna) */}
    <div 
      onClick={() => onBodyPartClick('Nogi - Przysiad')}
<<<<<<< HEAD
      className="absolute inset-0 cursor-pointer z-20"
      title="Kliknij, aby wybrać Nogi"
    />
=======
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
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
  </div>
);

// === Główny Komponent App ===
export default function App() {
<<<<<<< HEAD
  const [selectedMuscle, setSelectedMuscle] = useState({ name: "Brak wyboru", id: "000" });
  const [trainingActive, setTrainingActive] = useState(false);
  const [currentView, setCurrentView] = useState('model');

  const handleActivitySelect = (activity) => {
    setSelectedMuscle({
      name: activity.name,
      id: activity.id < 10 ? `00${activity.id}` : `0${activity.id}`
    });
    setCurrentView('model');
  };

  const handleModelClick = (name) => {
    setSelectedMuscle({ name: name, id: "M-01" });
=======
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [trainingActive, setTrainingActive] = useState(false);
  const [currentView, setCurrentView] = useState('model');

  const handleActivitySelect = (name) => {
    setSelectedMuscle(name);
    setCurrentView('model');
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
  };

  return (
    <div className="min-h-screen bg-slate-950 text-blue-100 p-4 md:p-8 flex flex-col gap-6 selection:bg-sky-500/20">
      
      {/* 1. Header (Przycisk usunięty) */}
      <header className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 gap-4">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-10 w-10 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-blue-50">
            Form<span className="text-sky-400">Check</span><span className="text-slate-600 font-light ml-1 text-sm italic">AI</span>
          </h1>
        </div>
        
        <nav className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button 
            onClick={() => setCurrentView('model')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === 'model' ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-sky-400'
            }`}
          >
            <ActivityIcon size={14} /> Trening
          </button>
          <button 
            onClick={() => setCurrentView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              currentView === 'list' ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-sky-400'
            }`}
          >
            <LayoutGrid size={14} /> Biblioteka
          </button>
        </nav>
        
        {/* Usunięto przycisk, aby zachować czystość nagłówka */}
        <div className="hidden md:block w-[150px]"></div> 
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
<<<<<<< HEAD
        
        {/* Lewy Panel (Model/Lista + ID) */}
        <section className="flex flex-col gap-4">
          <div className="flex-grow min-h-[450px]">
=======
        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
            {currentView === 'model' ? (
              <Placeholder3DModel onBodyPartClick={handleModelClick} activePart={selectedMuscle.name} />
            ) : (
              <GymActivitiesList onSelectActivity={handleActivitySelect} />
            )}
          </div>
          
<<<<<<< HEAD
          {currentView === 'model' && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg h-[64px]">
              <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                Wybrane: <span className="text-sky-400 font-bold">{selectedMuscle.name}</span>
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-sky-500 font-black uppercase tracking-tighter bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded">
                  #{selectedMuscle.id}
                </span>
=======
          {selectedMuscle && currentView === 'model' && (
            <div className="bg-slate-900 p-8 rounded-3xl border border-sky-900/40 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Wybrano:</span>
                <p className="text-3xl font-black text-sky-300 italic uppercase leading-none mt-1">{selectedMuscle}</p>
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
              </div>
            </div>
          )}
        </section>

<<<<<<< HEAD
        {/* Prawy Panel (Kamera + Sterowanie) */}
        <section className="flex flex-col gap-4">
          <div className="flex-grow min-h-[450px]">
=======
        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
            <CameraView 
              isActive={trainingActive} 
              feedback={trainingActive ? "System kalibruje szkielet..." : null} 
            />
          </div>
<<<<<<< HEAD

          {/* PASEK Z DYNAMICZNĄ KROPKĄ STATUSU */}
          <div className="bg-slate-900 p-2 pl-6 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg overflow-hidden h-[64px]">
            <div className="flex items-center gap-3">
              {/* Dynamiczna kropka LED */}
              <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                !trainingActive 
                  ? 'bg-red-500 shadow-red-500/40' // Nieaktywny
                  : (trainingActive && !window.drawConnectors) // Przykład warunku ładowania
                    ? 'bg-amber-500 animate-pulse shadow-amber-500/40' // W trakcie uruchamiania
                    : 'bg-green-500 shadow-green-500/40' // Działa
              }`}></div>

              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Status: <span className={`font-bold ${
                  !trainingActive ? "text-red-500" : (trainingActive && !window.drawConnectors) ? "text-amber-500" : "text-green-500"
                }`}>
                  {!trainingActive ? 'System wstrzymany' : (trainingActive && !window.drawConnectors) ? 'Inicjalizacja...' : 'Analiza AI Live'}
                </span>
              </p>
            </div>

           <button 
              onClick={() => setTrainingActive(!trainingActive)}
              // Wyłączamy przycisk, jeśli nie wybrano ćwiczenia (id === "000") I system nie jest już aktywny
              disabled={selectedMuscle.id === "000" && !trainingActive}
              className={`flex items-center gap-3 px-8 h-full rounded-xl border transition-all duration-300 font-black uppercase tracking-[0.2em] text-[10px] ${
                trainingActive 
                  ? 'bg-red-500/10 border-red-500 text-red-500' 
                  : (selectedMuscle.id === "000")
                    ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed opacity-50' // Styl zablokowany
                    : 'bg-sky-500/10 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.1)]'
              }`}
            >
              {trainingActive ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              {trainingActive 
                ? 'Zatrzymaj' 
                : (selectedMuscle.id === "000") ? 'Wybierz ćwiczenie' : 'Uruchom AI'
              }
            </button>
=======
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center shadow-lg">
            <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
              Status: <span className="text-sky-500">{trainingActive ? 'Analiza ruchu AI' : 'Oczekiwanie na start'}</span>
            </p>
>>>>>>> 5fc122af4817db443de84a102b61d176ef58f035
          </div>
        </section>
      </main>

      <footer className="text-center text-[10px] text-slate-800 font-mono tracking-[0.4em] uppercase py-4 border-t border-slate-900/50 relative z-0">
        FormCheck AI | Sprint 1 Prototype | Build 0426
      </footer>
    </div>
  );
}