import React, { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, Cpu, Database, Play, Save, CheckCircle, 
  AlertTriangle, Terminal, BarChart, FileUp, Cloud, Server, HardDrive 
} from 'lucide-react';
import { ExerciseModel } from '../../../ml/ExerciseModel';
import { supabase } from '../../../supabaseClient';
import { EXERCISES } from '../../../config/exercises';

const AITraining = () => {
  const [selectedEx, setSelectedEx] = useState('squat');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [stats, setStats] = useState({ totalFrames: 0, correctCount: 0, errorCount: 0 });
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({ loss: 0, acc: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState(null);
  
  const modelRef = useRef(new ExerciseModel());
  const logEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, [selectedEx]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [trainingLogs]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('training_data')
        .select('payload')
        .eq('exercise_id', selectedEx);

      if (error) throw error;

      if (data) {
        let total = 0;
        let corrects = 0;
        let errors = 0;

        data.forEach(item => {
          const frames = item.payload.frames || [];
          total += frames.length;
          frames.forEach(f => {
            if (f.labels.correct) corrects++;
            else errors++;
          });
        });

        setStats({ totalFrames: total, correctCount: corrects, errorCount: errors });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setTrainingLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.frames && !Array.isArray(json)) {
          throw new Error("Nieprawidłowy format JSON (wymagana lista klatek)");
        }
        const frames = Array.isArray(json) ? json : (json.frames || []);
        setUploadedDataset(frames);
        addLog(`Wczytano plik: ${file.name} (${frames.length} klatek)`, 'success');
        
        // Update stats for the uploaded file
        let corrects = 0; let errors = 0;
        frames.forEach(f => {
          if (f.labels.correct) corrects++;
          else errors++;
        });
        setStats({ totalFrames: frames.length, correctCount: corrects, errorCount: errors });
      } catch (err) {
        addLog(`Błąd wczytywania pliku: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleTrainLocal = async () => {
    setIsTraining(true);
    setIsSuccess(false);
    setProgress(0);
    setTrainingLogs([]);
    addLog(`Inicjalizacja LOKALNEGO treningu dla: ${selectedEx.toUpperCase()}`, 'system');

    try {
      let dataset = [];
      
      if (uploadedDataset) {
        addLog("Używanie danych z wczytanego pliku...");
        dataset = uploadedDataset;
      } else {
        addLog("Pobieranie danych z bazy Supabase...");
        const { data, error } = await supabase
          .from('training_data')
          .select('payload')
          .eq('exercise_id', selectedEx);

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Brak danych treningowych.");

        data.forEach(pkg => {
          if (pkg.payload && pkg.payload.frames) dataset = [...dataset, ...pkg.payload.frames];
        });
      }

      addLog(`Rozpoczęto trening na ${dataset.length} klatkach...`);
      
      const onEpochEnd = (epoch, logs) => {
        const p = Math.round(((epoch + 1) / 50) * 100);
        setProgress(p);
        setMetrics({ loss: logs.loss.toFixed(4), acc: logs.acc.toFixed(4) });
        if ((epoch + 1) % 5 === 0) addLog(`Epoch ${epoch + 1}/50 - Loss: ${logs.loss.toFixed(4)}, Acc: ${logs.acc.toFixed(4)}`, 'metric');
      };

      await modelRef.current.train(dataset, onEpochEnd);
      addLog("✅ Trening lokalny zakończony!", "success");
      setIsSuccess(true);
    } catch (err) {
      addLog(`❌ BŁĄD: ${err.message}`, 'error');
    } finally {
      setIsTraining(false);
    }
  };

  const handleTrainServer = async () => {
    setIsTraining(true);
    setIsSuccess(false);
    setProgress(0);
    setTrainingLogs([]);
    addLog(`Wysyłanie żądania TRENINGU SERWEROWEGO dla: ${selectedEx.toUpperCase()}`, 'system');

    try {
      let dataset = [];
      if (uploadedDataset) {
        dataset = uploadedDataset;
      } else {
        const { data, error } = await supabase.from('training_data').select('payload').eq('exercise_id', selectedEx);
        if (error) throw error;
        data.forEach(pkg => { if (pkg.payload?.frames) dataset = [...dataset, ...pkg.payload.frames]; });
      }

      if (dataset.length === 0) throw new Error("Brak danych do wysłania.");

      addLog(`Wysyłanie ${dataset.length} próbek do API serwera...`);
      
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset, exerciseId: selectedEx })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Błąd serwera');

      addLog("✅ SERWER: Model wytrenowany i zapisany na dysku serwera.", "success");
      addLog("Model będzie teraz dostępny globalnie dla wszystkich użytkowników.", "info");
      setIsSuccess(true);
    } catch (err) {
      addLog(`❌ BŁĄD SERWERA: ${err.message}`, 'error');
    } finally {
      setIsTraining(false);
    }
  };

  const handleSyncToCloud = async () => {
    if (!uploadedDataset) {
      addLog("Błąd: Najpierw wczytaj plik JSON, aby go zsynchronizować.", "error");
      return;
    }

    try {
      addLog(`Synchronizacja ${uploadedDataset.length} klatek z Supabase...`);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('training_data').insert({
        payload: { exercise: selectedEx, frames: uploadedDataset },
        user_id: user?.id || 'guest',
        exercise_id: selectedEx,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      addLog("✅ Pomyślnie przesłano dane do chmury Supabase.", "success");
      setUploadedDataset(null);
      fetchStats();
    } catch (err) {
      addLog(`❌ Błąd synchronizacji: ${err.message}`, 'error');
    }
  };

  const handleSave = async () => {
    try {
      addLog("Zapisywanie modelu do pamięci lokalnej...");
      await modelRef.current.save(`localstorage://${selectedEx}-model`);
      addLog(`✅ Model ${selectedEx} zapisany jako Twój prywatny model.`, 'success');
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      addLog(`❌ Błąd zapisu: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="bg-sky-500 p-4 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.3)]">
            <BrainCircuit className="text-slate-950 h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Centrum <span className="text-sky-400">AI</span></h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Zarządzanie modelami i danymi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* File Upload Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".json" 
            className="hidden" 
          />
          
          <button
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800 text-slate-300 font-black uppercase tracking-widest text-[10px] border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <FileUp size={16} /> Wczytaj JSON
          </button>

          {uploadedDataset && (
            <button
              onClick={handleSyncToCloud}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-all"
            >
              <Cloud size={16} /> Wyślij do Supabase
            </button>
          )}

          <div className="h-10 w-px bg-slate-800 mx-2" />

          <select 
            value={selectedEx}
            onChange={(e) => setSelectedEx(e.target.value)}
            className="bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-2xl border border-slate-700 outline-none focus:border-sky-500 cursor-pointer"
          >
            {Object.values(EXERCISES).map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleTrainLocal}
              disabled={isTraining}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-sky-500 text-slate-950 font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <HardDrive size={16} /> Lokalny
            </button>
            <button
              onClick={handleTrainServer}
              disabled={isTraining}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Server size={16} /> Serwer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        
        {/* Left Column: Stats & Progress */}
        <div className="flex flex-col gap-6">
          
          {/* Stats Card */}
          <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="text-sky-400" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Statystyki Zbioru</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Wszystkie klatki</span>
                <span className="text-2xl font-black text-white italic">{stats.totalFrames}</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full w-full opacity-20" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[9px] font-bold text-green-500 uppercase block mb-1">Poprawne</span>
                  <span className="text-xl font-black text-white">{stats.correctCount}</span>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[9px] font-bold text-red-500 uppercase block mb-1">Błędy</span>
                  <span className="text-xl font-black text-white">{stats.errorCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Training Progress Card */}
          <div className="bg-slate-900/40 rounded-[2rem] border border-slate-800 p-6 flex-grow">
            <div className="flex items-center gap-3 mb-6">
              <BarChart className="text-sky-400" size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Postęp Procesu</h3>
            </div>

            <div className="flex flex-col gap-8">
              <div className="relative h-32 w-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeDasharray="100, 100" strokeWidth="2" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-sky-500 transition-all duration-500" strokeDasharray={`${progress}, 100`} strokeWidth="2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white italic leading-none">{progress}%</span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Ukończono</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Loss (Błąd)</span>
                  <span className="text-lg font-black text-sky-400 font-mono">{metrics.loss}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">Accuracy</span>
                  <span className="text-lg font-black text-green-400 font-mono">{metrics.acc}</span>
                </div>
              </div>

              {isSuccess && (
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-3 bg-green-500 text-slate-950 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-all"
                >
                  <Save size={16} /> Zapisz Model Lokalnie
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Terminal Logs */}
        <div className="lg:col-span-2 flex flex-col bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl min-h-[400px]">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-sky-400" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">TensorFlow Console</span>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-6 font-mono text-[11px] space-y-2 selection:bg-sky-500 selection:text-slate-950">
            {trainingLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-700 italic uppercase tracking-widest">
                System gotowy do pracy...
              </div>
            ) : (
              trainingLogs.map((log, i) => (
                <div key={i} className={`flex gap-4 animate-in slide-in-from-left-2 duration-300 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'metric' ? 'text-sky-400' : 'text-slate-400'}`}>
                  <span className="opacity-30 shrink-0">[{log.time}]</span>
                  <span className={`${log.type === 'system' ? 'font-black text-white uppercase' : ''}`}>
                    {log.msg}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          <div className="p-4 bg-slate-900/30 border-t border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isTraining ? 'bg-sky-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[9px] font-bold text-slate-500 uppercase">{isTraining ? 'Analiza w toku' : 'IDLE'}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Engine: TF.js WebGL / Server Node</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AITraining;
