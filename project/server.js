/* global process */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu'; // Use CPU for server-side if no node-gpu
import { ExerciseModel } from './src/ml/ExerciseModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' })); // Allow large datasets

let serverModels = {};

const loadAllModels = () => {
  const modelsDir = path.join(__dirname, 'public', 'models');
  if (fs.existsSync(modelsDir)) {
    const exercises = ['squat', 'pushup', 'lunge', 'jumping_jacks'];
    for (const ex of exercises) {
      const modelFilename = ex === 'squat' ? 'model.json' : `${ex}_model.json`;
      const modelPath = path.join(modelsDir, modelFilename);
      if (fs.existsSync(modelPath)) {
        const m = new ExerciseModel();
        m.load(`file://${modelPath}`).then(() => {
          serverModels[ex] = m;
          console.log(`Server ML Model loaded from disk for exercise: ${ex}`);
        }).catch(err => console.error(`Error loading model for ${ex}:`, err));
      }
    }
  }
};

loadAllModels();

// Serwowanie plików statycznych z folderu 'dist' (wygenerowanego przez vite build)
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint pomocniczy do sprawdzania statusu serwera
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    ml_ready: Object.keys(serverModels).length > 0,
    models: Object.keys(serverModels),
    timestamp: new Date() 
  });
});

// Endpoint do trenowania modelu na serwerze (domyślnie trenuje squat dla kompatybilności)
app.post('/api/train', async (req, res) => {
  const { dataset } = req.body;
  if (!dataset || !Array.isArray(dataset)) {
    return res.status(400).json({ error: 'Błędny format danych (wymagana tablica dataset)' });
  }

  try {
    let modelToTrain = serverModels['squat'];
    if (!modelToTrain) {
       modelToTrain = new ExerciseModel();
       serverModels['squat'] = modelToTrain;
    }

    console.log(`Rozpoczęto trening na serwerze (${dataset.length} próbek)...`);
    await modelToTrain.train(dataset, (epoch, logs) => {
      console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
    });

    // Zapis modelu do public/models
    const modelsDir = path.join(__dirname, 'public', 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });
    
    await modelToTrain.model.save(`file://${modelsDir}`);
    const LABELS_PATH = path.join(modelsDir, 'labels.json');
    fs.writeFileSync(LABELS_PATH, JSON.stringify(modelToTrain.labels));

    // --- NOWOŚĆ: Automatyczny Backup na serwerze ---
    try {
      const backupDir = path.join(__dirname, 'backups', `model_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`);
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      
      // Kopiujemy wszystkie pliki modelu (json, bin, labels)
      const filesToBackup = fs.readdirSync(modelsDir);
      for (const file of filesToBackup) {
        fs.copyFileSync(path.join(modelsDir, file), path.join(backupDir, file));
      }
      console.log(`Pomyślnie utworzono backup: ${backupDir}`);
    } catch (backupErr) {
      console.error("Błąd podczas tworzenia backupu:", backupErr);
      // Nie przerywamy głównego procesu, jeśli tylko backup się nie udał
    }

    res.json({ success: true, message: 'Model wytrenowany, zapisany i zarchiwizowany na serwerze.' });
  } catch (err) {
    console.error("Błąd treningu na serwerze:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint do predykcji (ocena techniki przez serwer)
app.post('/api/predict', async (req, res) => {
  const { landmarks, exerciseId } = req.body;
  if (!landmarks) return res.status(400).json({ error: 'Brak landmarków' });
  
  const modelToUse = serverModels[exerciseId] || serverModels['squat'];
  
  if (!modelToUse || !modelToUse.model) return res.status(503).json({ error: 'Model nie jest jeszcze wytrenowany na serwerze dla tego ćwiczenia' });

  try {
    const predictions = await modelToUse.predict(landmarks);
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint do usuwania modelu z serwera
app.post('/api/reset-model', (req, res) => {
  const modelsDir = path.join(__dirname, 'public', 'models');
  try {
    if (fs.existsSync(modelsDir)) {
      const files = fs.readdirSync(modelsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(modelsDir, file));
      }
    }
    serverModel = new ExerciseModel(); // Resetujemy też obiekt w pamięci
    res.json({ success: true, message: 'Model usunięty z serwera.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obsługa SPA - wszystkie inne zapytania zwracają index.html
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer produkcyjny FormCheckAI działa na porcie ${PORT}`);
  console.log(`Ścieżka statyczna: ${path.join(__dirname, 'dist')}`);
});
