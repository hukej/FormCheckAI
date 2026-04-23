import React, { useState, useEffect } from 'react';
import { ExerciseModel } from '../../ml/ExerciseModel';

export default function ModelTrainer({ onBack }) {
  const [model] = useState(() => new ExerciseModel());
  const [status, setStatus] = useState("Idle");
  const [datasetFiles, setDatasetFiles] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setDatasetFiles(prev => [...prev, ...files]);
  };

  const startTraining = async () => {
    if (datasetFiles.length === 0) {
      alert("Proszę wgrać przynajmniej jeden plik JSON z danymi.");
      return;
    }

    setIsTraining(true);
    setStatus("Parsowanie danych...");

    try {
      let fullDataset = [];
      for (let file of datasetFiles) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.frames) {
          fullDataset = fullDataset.concat(json.frames);
        }
      }

      // Analiza balansu danych
      const stats = { correct: 0, heels_up: 0, lean: 0, shallow: 0, valgus: 0 };
      fullDataset.forEach(f => {
        let hasError = false;
        Object.keys(f.labels).forEach(l => {
          if (f.labels[l]) { stats[l]++; hasError = true; }
        });
        if (!hasError) stats.correct++;
      });

      if (stats.correct === 0 || Object.values(stats).some(v => v === 0)) {
        if (!confirm("OSTRZEŻENIE: Twój zbiór danych jest niepełny. Model musi widzieć zarówno poprawne powtórzenia, jak i błędy, aby ich nie mylić. Kontynuować?")) {
           setIsTraining(false); setStatus("Przerwano ze względu na brak balansu danych."); return;
        }
      }

      setStatus(`Rozpoczęto trening na ${fullDataset.length} próbkach...`);

      await model.train(fullDataset, (epoch, logs) => {
        setProgress(Math.round(((epoch + 1) / 50) * 100));
        setStatus(`Epoka ${epoch + 1}/50 | Strata: ${logs.loss.toFixed(4)}`);
      });

      setStatus("Trening zakończony pomyślnie. Zapisywanie...");
      await model.save();
      setStatus("Model zapisany. Możesz teraz wrócić do aplikacji.");

    } catch (err) {
      console.error(err);
      setStatus(`Błąd: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const trainOnServer = async () => {
    if (datasetFiles.length === 0) {
      alert("Proszę wgrać przynajmniej jeden plik JSON z danymi.");
      return;
    }

    setIsTraining(true);
    setStatus("Wysyłanie danych na serwer...");

    try {
      let fullDataset = [];
      for (let file of datasetFiles) {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.frames) fullDataset = fullDataset.concat(json.frames);
      }

      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset: fullDataset })
      });

      const result = await response.json();
      if (result.success) {
        setStatus("Model wytrenowany i zapisany na SERWERZE.");
      } else {
        throw new Error(result.error || "Błąd serwera");
      }
    } catch (err) {
      console.error(err);
      setStatus(`Błąd serwera: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const resetModel = async () => {
    if (!confirm("Czy na pewno chcesz usunąć wytrenowany model? Tej operacji nie da się cofnąć.")) return;

    try {
      // 1. Czyścimy LocalStorage
      localStorage.removeItem('localstorage://exercise-model');
      localStorage.removeItem('localstorage://exercise-model-labels');

      // 2. Czyścimy Serwer
      await fetch('/api/reset-model', { method: 'POST' });

      setStatus("Model został pomyślnie USUNIĘTY. Możesz trenować od nowa.");
      setDatasetFiles([]);
    } catch (err) {
      setStatus(`Błąd podczas usuwania: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 bg-slate-900 rounded-[2rem] border border-slate-800 text-blue-100 max-w-2xl mx-auto mt-10">
      <div>
        <h2 className="text-3xl font-black text-white uppercase mb-2">Trenuj Model AI</h2>
        <p className="text-slate-400">
          Wgraj pliki JSON wygenerowane przez aplikację i dostosuj sztuczną inteligencję do analizy błędów. 
          Model użyje powiększania danych, aby poradzić sobie ze słabą jakością kamery.
        </p>
      </div>

      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
        <label className="block mb-2 font-bold uppercase text-xs tracking-wider text-sky-400">Wgraj zbiory danych (.json)</label>
        <input 
          type="file" 
          multiple 
          accept=".json" 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-bold file:uppercase
            file:bg-sky-500 file:text-slate-950
            hover:file:bg-sky-400 cursor-pointer"
        />
        {datasetFiles.length > 0 && (
          <p className="mt-3 text-sm text-slate-300">
            Wgrano plików: {datasetFiles.length}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <button 
          onClick={startTraining}
          disabled={isTraining || datasetFiles.length === 0}
          className={`py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
            isTraining || datasetFiles.length === 0 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-400 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
          }`}
        >
          {isTraining ? 'Trening w toku...' : 'Uruchom Trenowanie (Lokalnie)'}
        </button>

        <button 
          onClick={trainOnServer}
          disabled={isTraining || datasetFiles.length === 0}
          className={`py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
            isTraining || datasetFiles.length === 0 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]'
          }`}
        >
          {isTraining ? 'Wysyłanie...' : 'Uruchom Trenowanie na Serwerze'}
        </button>

        {isTraining && (
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <div className="text-sm font-mono p-4 bg-slate-950 rounded-xl border border-slate-800 text-sky-400">
          STATUS: {status}
        </div>
      </div>

      <button 
        onClick={resetModel}
        className="mt-8 text-red-500 hover:text-red-400 uppercase text-[10px] font-black tracking-[0.2em] border border-red-500/20 px-4 py-2 rounded-xl transition-all hover:bg-red-500/10"
      >
        DANGER: Resetuj Model (Usuń wszystko)
      </button>

      <button 
        onClick={onBack}
        className="mt-4 text-slate-400 hover:text-white uppercase text-xs font-bold tracking-widest text-center"
      >
        Wróć do aplikacji
      </button>
    </div>
  );
}
