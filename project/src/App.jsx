import React, { useState, useRef, useEffect } from 'react';
import Webcam from "react-webcam";
import { 
  BotMessageSquare, Video, BrainCircuit, Footprints, AlertTriangle, CameraOff 
} from 'lucide-react';

// === Komponent Kamery z Analizą MediaPipe ===
const CameraView = ({ isActive, feedback }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const onResults = (results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvasCtx = canvasRef.current.getContext("2d");
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    canvasCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);

    if (results.poseLandmarks) {
      // @mediapipe/drawing_utils jest ładowane globalnie z CDN
      window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
        color: "#38bdf8",
        lineWidth: 4,
      });
      window.drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#ffffff",
        fillColor: "#0ea5e9",
        lineWidth: 2,
        radius: 4,
      });
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    let pose = null;

    const initPose = async () => {
      if (isActive) {
        // Tworzymy instancję Pose korzystając z globalnych obiektów załadowanych w index.html
        pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);

        if (webcamRef.current?.video) {
          cameraRef.current = new window.Camera(webcamRef.current.video, {
            onFrame: async () => {
              if (webcamRef.current?.video) {
                await pose.send({ image: webcamRef.current.video });
              }
            },
            width: 1280,
            height: 720,
          });
          cameraRef.current.start();
        }
      }
    };

    initPose();

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (pose) pose.close();
    };
  }, [isActive]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl flex items-center justify-center">
      {isActive ? (
        <>
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

// === Komponent Modelu 3D (Placeholder) ===
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
export default function App() {
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [trainingActive, setTrainingActive] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-blue-100 p-4 md:p-8 flex flex-col gap-6 selection:bg-sky-500/20">
      <header className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <BrainCircuit className="h-10 w-10 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic text-blue-50">
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

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
            <Placeholder3DModel onBodyPartClick={setSelectedMuscle} activePart={selectedMuscle} />
          </div>
          {selectedMuscle && (
            <div className="bg-slate-900 p-8 rounded-3xl border border-sky-900/40 shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-6 animate-in slide-in-from-bottom-6 duration-500">
              <div className="text-center sm:text-left">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Trening</span>
                <p className="text-3xl font-black text-sky-300 italic uppercase leading-none mt-1">{selectedMuscle}</p>
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

        <section className="flex flex-col gap-6">
          <div className="flex-grow min-h-[400px]">
            <CameraView 
              isActive={trainingActive} 
              feedback={trainingActive ? "System kalibruje szkielet..." : null} 
            />
          </div>
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center shadow-lg">
            <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
              Status: <span className="text-sky-500">{trainingActive ? 'Analiza punktów kluczowych' : 'Podgląd wizyjny aktywny'}</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}