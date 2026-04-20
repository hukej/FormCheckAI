import React, { useState } from 'react';
import { 
  Dumbbell, Timer, Trophy, ChevronRight, Zap, 
  Flame, Medal, X, Award, Target
} from 'lucide-react';

export const ACTIVITIES = [
  { id: 1, name: 'Przysiady Klasyczne', category: 'Nogi', time: '15m', icon: <Zap size={16} className="text-amber-400"/>, achievement: "Król Przysiadów" },
  { id: 2, name: 'Pompki Diamentowe', category: 'Klatka', time: '10m', icon: <Dumbbell size={16} className="text-sky-400"/>, achievement: "Twardy jak Diament" },
  { id: 3, name: 'Plank (Deska)', category: 'Core', time: '5m', icon: <Timer size={16} className="text-emerald-400"/>, achievement: "Łamacz Desek" },
  { id: 4, name: 'Wykroki AI', category: 'Nogi', time: '20m', icon: <Zap size={16} className="text-amber-400"/>, achievement: "Cyber-Wykrok" },
  { id: 5, name: 'Podciąganie', category: 'Plecy', time: '15m', icon: <Trophy size={16} className="text-emerald-400"/>, achievement: "Wspinaczka na Szczyt" },
  { id: 6, name: 'Wyciskanie Żołnierskie', category: 'Barki', time: '12m', icon: <Zap size={16} className="text-amber-400"/>, achievement: "Generał Barków" },
  { id: 7, name: 'Uginanie ramion', category: 'Biceps', time: '10m', icon: <Dumbbell size={16} className="text-sky-400"/>, achievement: "Stalowe Bicepsy" },
  { id: 8, name: 'Dipy (Pompki tyłem)', category: 'Triceps', time: '12m', icon: <Dumbbell size={16} className="text-sky-400"/>, achievement: "Mistrz Tricepsu" },
  { id: 9, name: 'Burpees', category: 'Kardio', time: '10m', icon: <Flame size={16} className="text-red-500"/>, achievement: "Piekielna Kondycja" },
  { id: 10, name: 'Dead Bug', category: 'Core', time: '8m', icon: <Timer size={16} className="text-emerald-400"/>, achievement: "Pogromca Robaka" },
  { id: 11, name: 'Wiosłowanie', category: 'Plecy', time: '15m', icon: <Trophy size={16} className="text-emerald-400"/>, achievement: "Galernik Mocy" },
  { id: 12, name: 'Wspięcia na palce', category: 'Nogi', time: '10m', icon: <Dumbbell size={16} className="text-sky-400"/>, achievement: "Lekka Stopa" },
  { id: 13, name: 'Uginanie nadgarstków z hantlami', category: 'Przedramie', time: '10m', icon: <Dumbbell size={16} className="text-sky-400"/>, achievement: "Uścisk Imadła" },
];

const GymActivitiesList = ({ onSelectActivity, filter, setFilter }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const categories = ['Wszystkie', 'Nogi', 'Klatka', 'Plecy', 'Barki', 'Biceps', 'Triceps', 'Core', 'Kardio', 'Przedramie'];
  const filtered = filter === 'Wszystkie' ? ACTIVITIES : ACTIVITIES.filter(a => a.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="relative p-4 h-full flex flex-col gap-4 overflow-hidden bg-slate-950">
      
      {/* HEADER Z MEDALEM */}
      <div className="flex justify-between items-center shrink-0 mb-2">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Trening</h2>
      </div>

      {/* FILTRY KATEGORII */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map(c => (
          <button 
            key={c} 
            onClick={() => setFilter(c)} 
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all ${filter === c ? 'bg-sky-500 border-sky-500 text-black shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* LISTA ĆWICZEŃ */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 overflow-y-auto pr-2 scrollbar-hide pb-20">
        {filtered.map(a => (
          <div key={a.id} onClick={() => onSelectActivity(a)} className="group bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-sky-500 transition-all cursor-pointer flex flex-col justify-between h-32 sm:h-36">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-black rounded border border-slate-800 group-hover:border-sky-500/50">{a.icon}</div>
              <span className="text-[9px] font-mono text-slate-700">#{a.id}</span>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase italic leading-tight text-slate-200 group-hover:text-white">{a.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{a.time}</p>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-2 mt-2">
              <span className="text-[10px] text-sky-500 font-black uppercase tracking-wider">{a.category}</span>
              <ChevronRight size={14} className="text-slate-700 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GymActivitiesList;