/**
 * train_and_build.mjs
 * ====================
 * Trenuje modele ML dla każdego ćwiczenia i zapisuje je jako
 * pliki model.json + weights.bin + labels.json w public/models/
 *
 * Użycie:  node ml/train_and_build.mjs
 */

import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'training_data');
const OUT_DIR = path.join(__dirname, '..', 'public', 'models');
const NUM_FEATURES = 14;

// ============================================================
//  Konfiguracja per ćwiczenie
//  model_file musi pasować do useWorkoutDetection.js:
//    squat -> 'model.json', reszta -> '{id}_model.json'
// ============================================================
const EXERCISES = {
  squat: {
    labels: ['correct', 'shallow', 'valgus', 'lean', 'heels_up'],
    dataFile: 'trening_squat.json',
    modelFile: 'model.json',
    labelsFile: 'labels.json',
    weightsFile: 'squat_weights.bin',
  },
  pushup: {
    labels: ['correct', 'shallow', 'sagging_hips', 'wide_elbows'],
    dataFile: 'trening_pushup.json',
    modelFile: 'pushup_model.json',
    labelsFile: 'pushup_labels.json',
    weightsFile: 'pushup_weights.bin',
  },
  lunge: {
    labels: ['correct', 'shallow', 'unstable_core', 'knee_over_toe'],
    dataFile: 'trening_lunge.json',
    modelFile: 'lunge_model.json',
    labelsFile: 'lunge_labels.json',
    weightsFile: 'lunge_weights.bin',
  },
  jumping_jacks: {
    labels: ['correct', 'shallow', 'arms_too_low', 'asymmetry'],
    dataFile: 'trening_jumping_jacks.json',
    modelFile: 'jumping_jacks_model.json',
    labelsFile: 'jumping_jacks_labels.json',
    weightsFile: 'jumping_jacks_weights.bin',
  },
};

// ============================================================
//  Ładowanie danych
// ============================================================
function loadData(jsonPath, labels) {
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const frames = raw.frames || [];
  const X = [];
  const Y = [];

  for (const fr of frames) {
    const feats = fr.features;
    if (!feats || feats.length !== NUM_FEATURES) continue;
    const fl = fr.labels || {};
    X.push(feats);
    Y.push(labels.map(l => (fl[l] ? 1.0 : 0.0)));
  }
  return { X, Y };
}

// ============================================================
//  Augmentacja (szum + oversampling błędów)
// ============================================================
function augment(X, Y, noiseFactor = 3) {
  const Xa = [...X.map(r => [...r])];
  const Ya = [...Y.map(r => [...r])];

  // Gaussian noise
  for (let n = 0; n < noiseFactor; n++) {
    for (let i = 0; i < X.length; i++) {
      Xa.push(X[i].map(v => v + (Math.random() - 0.5) * 0.04));
      Ya.push([...Y[i]]);
    }
  }

  // Oversampling błędów (correct=0 to indeks 0)
  const errors = X.filter((_, i) => Y[i][0] === 0);
  const errorsY = Y.filter(row => row[0] === 0);
  if (errors.length > 0) {
    for (let n = 0; n < noiseFactor; n++) {
      for (let i = 0; i < errors.length; i++) {
        Xa.push(errors[i].map(v => v + (Math.random() - 0.5) * 0.06));
        Ya.push([...errorsY[i]]);
      }
    }
  }

  return { X: Xa, Y: Ya };
}

// ============================================================
//  Budowa modelu (identyczna z ExerciseModel.js)
// ============================================================
function buildModel(numLabels) {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [NUM_FEATURES] }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: numLabels, activation: 'sigmoid' }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });
  return model;
}

// ============================================================
//  Shuffle arrays in-place (Fisher-Yates)
// ============================================================
function shuffle(X, Y) {
  for (let i = X.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [X[i], X[j]] = [X[j], X[i]];
    [Y[i], Y[j]] = [Y[j], Y[i]];
  }
}

// ============================================================
//  Własny IOHandler - zapis do pliku z kontrolą nazw
// ============================================================
function createFileIOHandler(modelJsonPath, weightsFileName) {
  const dir = path.dirname(modelJsonPath);
  return {
    async save(modelArtifacts) {
      // Zapisz wagi binarnie
      const weightData = modelArtifacts.weightData;
      const buf = Buffer.from(
        weightData instanceof ArrayBuffer ? weightData : weightData.buffer
      );
      const weightsPath = path.join(dir, weightsFileName);
      fs.writeFileSync(weightsPath, buf);

      // Zapisz model.json z referencją do naszego pliku wag
      const modelJSON = {
        modelTopology: modelArtifacts.modelTopology,
        format: modelArtifacts.format,
        generatedBy: modelArtifacts.generatedBy,
        convertedBy: modelArtifacts.convertedBy,
        weightsManifest: [{
          paths: [weightsFileName],
          weights: modelArtifacts.weightSpecs,
        }],
      };
      fs.writeFileSync(modelJsonPath, JSON.stringify(modelJSON));
      return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    }
  };
}

// ============================================================
//  Trening jednego ćwiczenia
// ============================================================
async function trainExercise(name, cfg) {
  const src = path.join(DATA_DIR, cfg.dataFile);
  if (!fs.existsSync(src)) {
    console.log(`  ⚠  Brak danych: ${cfg.dataFile} - POMIJAM`);
    return false;
  }

  console.log(`\n${'='.repeat(55)}`);
  console.log(`  ${name.toUpperCase()}  |  etykiety: [${cfg.labels.join(', ')}]`);
  console.log(`${'='.repeat(55)}`);

  // 1. Załaduj
  let { X, Y } = loadData(src, cfg.labels);
  console.log(`  Klatek: ${X.length}`);
  cfg.labels.forEach((l, i) => {
    const n = Y.reduce((s, r) => s + r[i], 0);
    console.log(`    ${l.padEnd(18)} ${String(Math.round(n)).padStart(5)}  (${(n / Y.length * 100).toFixed(1)}%)`);
  });

  // 2. Augmentacja
  const aug = augment(X, Y, 3);
  X = aug.X;
  Y = aug.Y;
  console.log(`  Po augmentacji: ${X.length}`);

  // 3. Shuffle + split
  shuffle(X, Y);
  const splitIdx = Math.floor(X.length * 0.85);
  const xTrain = tf.tensor2d(X.slice(0, splitIdx));
  const yTrain = tf.tensor2d(Y.slice(0, splitIdx));
  const xVal = tf.tensor2d(X.slice(splitIdx));
  const yVal = tf.tensor2d(Y.slice(splitIdx));

  // 4. Trening
  const model = buildModel(cfg.labels.length);
  console.log(`  Trening (${splitIdx} train / ${X.length - splitIdx} val)...`);

  let bestValLoss = Infinity;
  let patience = 0;
  const MAX_PATIENCE = 12;
  let bestWeights = null;

  for (let epoch = 0; epoch < 100; epoch++) {
    const h = await model.fit(xTrain, yTrain, {
      epochs: 1,
      validationData: [xVal, yVal],
      verbose: 0,
      batchSize: 32,
    });

    const vl = h.history.val_loss[0];
    if (vl < bestValLoss) {
      bestValLoss = vl;
      patience = 0;
      // Zapisz najlepsze wagi
      bestWeights = model.getWeights().map(w => w.clone());
    } else {
      patience++;
    }

    if ((epoch + 1) % 10 === 0) {
      console.log(`    Epoch ${epoch + 1}: loss=${h.history.loss[0].toFixed(4)} val_loss=${vl.toFixed(4)}${patience > 0 ? ` (patience ${patience}/${MAX_PATIENCE})` : ''}`);
    }

    if (patience >= MAX_PATIENCE) {
      console.log(`    Early stopping na epoce ${epoch + 1}`);
      break;
    }
  }

  // Przywróć najlepsze wagi
  if (bestWeights) {
    model.setWeights(bestWeights);
    bestWeights.forEach(w => w.dispose());
  }

  // 5. Ewaluacja
  const evalResult = model.evaluate(xVal, yVal);
  const valLoss = (await evalResult[0].data())[0];
  const valAcc = (await evalResult[1].data())[0];
  console.log(`\n  val_loss=${valLoss.toFixed(4)}  val_acc=${valAcc.toFixed(4)}`);

  // Per-label metryki
  const preds = model.predict(xVal);
  const predsData = await preds.data();
  const yValData = await yVal.data();
  const nVal = X.length - splitIdx;
  const nLabels = cfg.labels.length;

  console.log('  Per-label:');
  for (let i = 0; i < nLabels; i++) {
    let tp = 0, fp = 0, fn = 0;
    for (let j = 0; j < nVal; j++) {
      const pred = predsData[j * nLabels + i] > 0.5 ? 1 : 0;
      const real = yValData[j * nLabels + i];
      if (pred === 1 && real === 1) tp++;
      if (pred === 1 && real === 0) fp++;
      if (pred === 0 && real === 1) fn++;
    }
    const p = tp + fp > 0 ? tp / (tp + fp) : 0;
    const r = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = p + r > 0 ? 2 * p * r / (p + r) : 0;
    console.log(`    ${cfg.labels[i].padEnd(18)} P=${p.toFixed(2)} R=${r.toFixed(2)} F1=${f1.toFixed(2)}`);
  }

  // 6. Zapis
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const modelJsonPath = path.join(OUT_DIR, cfg.modelFile);
  const handler = createFileIOHandler(modelJsonPath, cfg.weightsFile);
  await model.save(handler);

  // Labels.json
  const labelsPath = path.join(OUT_DIR, cfg.labelsFile);
  fs.writeFileSync(labelsPath, JSON.stringify(cfg.labels));

  console.log(`\n  ✅ Zapisano:`);
  console.log(`    ${modelJsonPath}`);
  console.log(`    ${path.join(OUT_DIR, cfg.weightsFile)}`);
  console.log(`    ${labelsPath}`);

  // Cleanup
  xTrain.dispose(); yTrain.dispose(); xVal.dispose(); yVal.dispose();
  preds.dispose(); evalResult.forEach(t => t.dispose());
  model.dispose();

  return true;
}

// ============================================================
//  MAIN
// ============================================================
async function main() {
  console.log('='.repeat(55));
  console.log('  FormCheckAI - Trening i Build modeli ML');
  console.log('='.repeat(55));

  let ok = 0;
  for (const [name, cfg] of Object.entries(EXERCISES)) {
    const success = await trainExercise(name, cfg);
    if (success) ok++;
  }

  console.log(`\n${'='.repeat(55)}`);
  console.log(`  GOTOWE! Wytrenowano ${ok}/${Object.keys(EXERCISES).length} modeli.`);
  console.log(`  Pliki w: ${path.resolve(OUT_DIR)}`);
  console.log(`  Możesz je wrzucić na serwer (Supabase Storage).`);
  console.log('='.repeat(55));
}

main().catch(e => { console.error(e); process.exit(1); });
