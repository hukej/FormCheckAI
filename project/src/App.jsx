import React, { useMemo, useRef, useEffect, useState } from 'react';
import Webcam from "react-webcam";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import { 
  BrainCircuit, Footprints, LayoutGrid, Activity as ActivityIcon, 
  Play, Square, LogOut, Save 
} from 'lucide-react';

import GymActivitiesList from './GymActivitiesList';
import InteractiveModel from './InteractiveModel';
import { supabase } from './supabaseClient';

// --- LOGIKA ANALIZY (ORYGINALNA) ---
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const angleDeg = (a, b, c) => {
  const abx = a.x - b.x; const aby = a.y - b.y;
  const cbx = c.x - b.x; const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby); const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return 0;
  return (Math.acos(clamp(dot / (magAB * magCB), -1, 1)) * 180) / Math.PI;
};

const CameraView = ({ isActive, selectedExercise }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseRef = useRef(null);
  
  const [repCount, setRepCount] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [dogGreeting, setDogGreeting] = useState(null);
  const [recording, setRecording] = useState(false);
  
  const datasetFramesRef = useRef([]);
  const dogModelRef = useRef(null);

  const exportDataset = () => {
    if (!datasetFramesRef.current.length) return;
    const payload = { exercise: selectedExercise, frames: datasetFramesRef.current };
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `data-${selectedExercise}.json`; a.click();
  };

  const onResults = (results) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    
    ctx.save();
    ctx.clearRect(0, 0, videoWidth, videoHeight);
    ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
    
    if (results.poseLandmarks) {
      if (window.drawConnectors) {
        window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: "#38bdf8", lineWidth: 4 });
        window.drawLandmarks(ctx, results.poseLandmarks, { color: "#ffffff", fillColor: "#0ea5e9", lineWidth: 2, radius: 3 });
      }

      if (recording) {
        datasetFramesRef.current.push({ timestamp: Date.now(), landmarks: results.poseLandmarks });
      }

      const lm = results.poseLandmarks;
      const angle = angleDeg(lm[23], lm[25], lm[27]);

      if (angle < 115 && phase !== "down") setPhase("down");
      if (angle > 160 && phase === "down") {
        setRepCount(prev => prev + 1);
        setPhase("up");
      }

      // Oryginalny wygląd HUD na kamerze
      ctx.save();
      ctx.scale(-1, 1);
      ctx.fillStyle = "rgba(2,6,23,0.8)";
      ctx.fillRect(-videoWidth + 10, 10, 200, 80);
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`REPS: ${repCount}`, -videoWidth + 25, 40);
      ctx.fillText(`ANGLE: ${Math.round(angle)}°`, -videoWidth + 25, 70);
      ctx.restore();
    }
    ctx.restore();
  };

  useEffect(() => {
    if (!isActive) return;
    const initPose = async () => {
      poseRef.current = new window.Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
      poseRef.current.setOptions({ modelComplexity: 1, minDetectionConfidence: 0.5 });
      poseRef.current.onResults(onResults);
      cameraRef.current = new window.Camera(webcamRef.current.video, {
        onFrame: async () => { if(poseRef.current) await poseRef.current.send({ image: webcamRef.current.video }); },
        width: 1280, height: 720
      });
      cameraRef.current.start();
      
      dogModelRef.current = await cocoSsd.load();
      const dogInterval = setInterval(async () => {
        if (webcamRef.current?.video) {
          const preds = await dogModelRef.current.detect(webcamRef.current.video);
          if (preds.find(p => p.class === 'dog')) {
            setDogGreeting("Hej piesku! 🐶💙");
            setTimeout(() => setDogGreeting(null), 4500);
          }
        }
      }, 2000);
      return () => clearInterval(dogInterval);
    };
    initPose();
    return () => { cameraRef.current?.stop(); poseRef.current?.close(); };
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl">
      <Webcam audio={false} ref={webcamRef} className="hidden" />
      <canvas ref={canvasRef} className="w-full h-full object-cover scale-x-[-1]" />
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setRecording(!recording)} className={`p-3 rounded-xl border ${recording ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-slate-900 border-slate-700'}`}>
          <Save size={20} className="text-white" />
        </button>
      </div>
      {dogGreeting && (
        <div className="absolute bottom-4 inset-x-4 bg-pink-500 text-white p-3 rounded-xl text-center font-black animate-bounce z-50">
          {dogGreeting}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState('model'); 
  const [muscleFilter, setMuscleFilter] = useState('Wszystkie');
  const [selectedEx, setSelectedEx] = useState({ name: "Brak wyboru", id: "000" });
  const [active, setActive] = useState(false);

  return (
    <div className="h-screen w-screen bg-slate-950 text-blue-100 flex flex-col p-4 md:p-8 overflow-hidden">
      <header className="flex flex-col md:flex-row items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-10 w-10 text-sky-400" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">FormCheck<span className="text-sky-400">AI</span></h1>
        </div>
        <nav className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button onClick={() => setCurrentView('model')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'model' ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-sky-400'}`}>
            <ActivityIcon size={14} /> Trening
          </button>
          <button onClick={() => setCurrentView('list')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'list' ? 'bg-sky-500 text-slate-950' : 'text-slate-500 hover:text-sky-400'}`}>
            <LayoutGrid size={14} /> Biblioteka
          </button>
          <button onClick={() => supabase.auth.signOut()} className="px-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={18}/></button>
        </nav>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        {/* LEWA STRONA (Oryginalne rozmiary) */}
        <section className="flex flex-col gap-4 min-h-0">
          <div className="flex-grow bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden">
            {currentView === 'model' ? (
              <div className="w-full h-full flex flex-col items-center justify-center relative">
                 <Footprints size={120} className="text-sky-900 opacity-20 absolute" />
                 <p className="text-xl font-black uppercase text-slate-700 tracking-[0.4em] italic z-10">Skeleton Ready</p>
              </div>
            ) : (
              <GymActivitiesList 
                onSelectActivity={(a) => { setSelectedEx(a); setCurrentView('model'); }} 
                filter={muscleFilter} 
                setFilter={setMuscleFilter} 
              />
            )}
          </div>
          {currentView === 'model' && (
            <div className="bg-slate-900 h-[64px] rounded-2xl border border-slate-800 flex items-center justify-between px-6 shadow-lg shrink-0">
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Wybrane: <span className="text-sky-400 font-bold">{selectedEx.name}</span></p>
              <span className="text-[9px] text-sky-500 font-black bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">#{selectedEx.id}</span>
            </div>
          )}
        </section>

        {/* PRAWA STRONA (Oryginalne rozmiary) */}
        <section className="flex flex-col gap-4 min-h-0">
          <div className="flex-grow rounded-2xl border border-slate-800 overflow-hidden relative">
            {currentView === 'list' ? (
              <InteractiveModel 
                onSelect={(c) => setMuscleFilter(c.charAt(0).toUpperCase() + c.slice(1).toLowerCase())} 
                currentCategory={muscleFilter.toUpperCase()} 
              />
            ) : (
              <CameraView isActive={active} selectedExercise={selectedEx.name} />
            )}
          </div>
          
          <div className="bg-slate-900 h-[64px] rounded-2xl border border-slate-800 flex items-center justify-between px-6 shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">AI Status: {active ? 'Analiza Live' : 'System wstrzymany'}</p>
            </div>
            {currentView === 'model' && (
              <button 
                onClick={() => setActive(!active)} 
                disabled={selectedEx.id === "000"} 
                className={`flex items-center gap-3 px-8 h-[40px] rounded-xl border transition-all font-black uppercase tracking-widest text-[10px] ${active ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-sky-500/10 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-slate-950'}`}
              >
                {active ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                {active ? 'Zatrzymaj' : 'Uruchom AI'}
              </button>
            )}
          </div>
        </section>
      </main>

      <footer className="text-center text-[10px] text-slate-800 font-mono tracking-[0.5em] uppercase py-4 shrink-0">
        FormCheck AI | Prototype Build 0426
      </footer>
    </div>
  );
}