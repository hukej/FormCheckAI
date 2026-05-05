/* eslint-disable no-unused-vars */
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, ChevronRight, Play, MessageSquare, BarChart3, AlertTriangle, Home, Target } from 'lucide-react';

// --- Sub-komponenty ---

const Nav = ({ onLaunch, onDemo, session }) => (
  <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-5xl">
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl px-4 md:px-6 py-3 flex items-center justify-between shadow-2xl">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="w-7 h-7 md:w-8 md:h-8 bg-sky-500 rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.4)] group-hover:scale-110 transition-transform">
          <div className="w-3.5 h-3.5 md:w-4 md:h-4 bg-slate-950 rounded-full" />
        </div>
        <span className="font-black tracking-tighter text-lg md:text-xl italic text-white uppercase">FORMCHECK<span className="text-sky-400">AI</span></span>
      </div>
      <div className="flex items-center gap-3 md:gap-6 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
        <a href="#disclaimer" className="hidden lg:block hover:text-sky-400 transition-colors">Ważne informacje</a>
        <button 
          onClick={onLaunch} 
          className="bg-sky-500 text-slate-950 px-4 py-2 md:px-5 md:py-2 rounded-xl font-black hover:bg-sky-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
        >
          {session ? (
            <span className="hidden sm:inline">Panel AI</span>
          ) : (
            <span>Zaloguj się</span>
          )}
          {session && <ChevronRight size={14} className="sm:hidden" />}
        </button>
      </div>
    </div>
  </nav>
);

const DemoSection = () => (
  <section id="demo" className="py-20 md:py-32">
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-6 leading-none text-center md:text-left">
            Twój salon to<br />
            <span className="text-sky-400">Twoja siłownia.</span>
          </h2>
          <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-widest italic mb-8 leading-relaxed text-center md:text-left">
            Nasz zaawansowany algorytm analizuje mechanikę ruchu Twojego ciała, abyś mógł bezpiecznie pracować nad formą w dowolnym miejscu. System wspiera treningi funkcjonalne i siłowe.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-white font-black uppercase text-[10px] justify-center md:justify-start">
              <Home className="text-sky-500 shrink-0" size={20} /> Dowolne miejsce. Twój progres.
            </div>
            <div className="flex items-center gap-4 text-white font-black uppercase text-[10px] justify-center md:justify-start">
              <ShieldCheck className="text-sky-500 shrink-0" size={20} /> Precyzyjna analiza stawów.
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <div className="relative aspect-[9/16] max-w-[280px] md:max-w-[300px] mx-auto bg-slate-950 rounded-[2.5rem] border-8 border-slate-900 overflow-hidden shadow-2xl shadow-sky-500/10">
            <video 
              autoPlay 
              muted 
              loop 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover grayscale-[50%] hover:grayscale-0 transition-all duration-700"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-girl-doing-squats-in-a-gym-40523-large.mp4" type="video/mp4" />
              Twoja przeglądarka nie wspiera wideo.
            </video>
            
            <div className="absolute inset-0 pointer-events-none">
               <svg className="w-full h-full text-sky-400/80" viewBox="0 0 100 177">
                 <circle cx="50" cy="35" r="5" fill="currentColor" className="animate-pulse" />
                 <line x1="50" y1="40" x2="50" y2="80" stroke="currentColor" strokeWidth="1" />
                 <line x1="50" y1="80" x2="35" y2="120" stroke="currentColor" strokeWidth="1" />
                 <line x1="50" y1="80" x2="65" y2="120" stroke="currentColor" strokeWidth="1" />
                 <line x1="35" y1="120" x2="35" y2="150" stroke="currentColor" strokeWidth="1" />
                 <line x1="65" y1="120" x2="65" y2="150" stroke="currentColor" strokeWidth="1" />
               </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Disclaimer = () => (
  <section id="disclaimer" className="py-12 md:py-20 border-y border-red-500/10">
    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
      <div className="bg-red-500/10 p-5 md:p-6 rounded-3xl shrink-0">
        <AlertTriangle className="text-red-500" size={32} />
      </div>
      <div>
        <h4 className="text-red-500 font-black uppercase italic tracking-widest mb-2 text-sm md:text-base">Pamiętaj o bezpieczeństwie!</h4>
        <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest leading-relaxed max-w-4xl italic">
          FormCheckAI jest narzędziem pomocniczym i edukacyjnym, a nie zamiennikiem medycznym. Nigdy nie forsuj bólu. Jeśli masz urazy kręgosłupa lub stawów, przed rozpoczęciem treningów skonsultuj się z fizjoterapeutą. Prawidłowa technika to fundament Twojego zdrowia.
        </p>
      </div>
    </div>
  </section>
);

const Hero = ({ onDemo, session, onLaunch }) => {
  const container = useRef(null);

  return (
    <section ref={container} className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden pt-32 pb-16 md:pb-20">
      <div className="container mx-auto px-6 relative z-10 text-center mb-8 md:mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.9] mb-6 md:mb-8 text-white"
        >
          Twój osobisty<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 inline-block py-2">trener techniki.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-[0.1em] mb-10 md:mb-12 italic leading-relaxed px-4 md:px-0"
        >
          Koryguj technikę przysiadów w czasie rzeczywistym. Analiza ruchu z wykorzystaniem AI dla maksymalnej precyzji i bezpieczeństwa.
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-5 md:gap-6 justify-center items-center w-full max-w-md mx-auto sm:max-w-none">
          <button 
            onClick={session ? onLaunch : onDemo}
            className="w-full sm:w-auto justify-center group bg-sky-500 text-slate-950 px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
          >
            {session ? 'Przejdź do aplikacji' : 'Uruchom Demo'} {session ? <ChevronRight size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <a href="#demo" className="text-white font-black text-xs uppercase tracking-[0.2em] border-b-2 border-sky-500/30 pb-1 hover:border-sky-500 transition-all italic mt-2 sm:mt-0">
            Zobacz przykład
          </a>
        </div>
      </div>
    </section>
  );
};

const BentoGrid = () => {
  return (
    <section id="features" className="py-20 md:py-32 container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-4 md:gap-6 md:h-[800px]">
        
        <div className="md:col-span-2 md:row-span-2 bg-slate-900/50 border border-slate-800 p-8 md:p-10 flex flex-col justify-end relative overflow-hidden group min-h-[300px] md:min-h-[400px] rounded-[2rem] md:rounded-[2.5rem] shadow-xl">
          <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Target size={200} className="md:w-[300px] md:h-[300px] text-sky-500" />
          </div>
          <h3 className="text-3xl md:text-4xl font-black uppercase italic mb-3 md:mb-4 text-white leading-none text-sky-400">Analiza Wizyjna</h3>
          <p className="text-slate-500 font-black text-[9px] md:text-[10px] uppercase tracking-widest leading-relaxed relative z-10">System wykorzystuje MediaPipe Pose do śledzenia 33 punktów kluczowych Twojego ciała bezpośrednio w Twoim telefonie lub laptopie.</p>
        </div>

        <div className="md:col-span-2 bg-sky-500 p-8 md:p-10 text-slate-950 flex flex-col justify-between min-h-[200px] md:min-h-[250px] rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_40px_rgba(14,165,233,0.2)]">
          <div className="flex justify-between items-start mb-6 md:mb-0">
            <MessageSquare size={32} className="md:w-10 md:h-10 opacity-80" />
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-black uppercase leading-[0.85] italic">Feedback<br />Głosowy.</h3>
            <p className="mt-3 md:mt-4 font-black text-[8px] md:text-[9px] uppercase tracking-widest opacity-80">"Przyklej pięty", "Zejdź niżej" - System informuje Cię o błędach w trakcie trwania serii.</p>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-8 md:p-10 flex flex-col justify-between hover:border-sky-500/50 transition-all cursor-pointer group min-h-[200px] md:min-h-[250px] rounded-[2rem] md:rounded-[2.5rem]">
          <BarChart3 className="group-hover:text-sky-400 transition-colors text-sky-500 mb-6 md:mb-0" size={32} />
          <h4 className="font-black uppercase italic text-white tracking-widest text-xl md:text-2xl">Lokalny<br />Raport</h4>
        </div>

        <div className="bg-white text-slate-950 p-8 md:p-10 flex flex-col justify-between min-h-[200px] md:min-h-[250px] rounded-[2rem] md:rounded-[2.5rem]">
          <ShieldCheck size={32} className="text-sky-600 mb-6 md:mb-0" />
          <div>
            <h4 className="font-black uppercase italic tracking-tighter text-xl md:text-2xl leading-none mb-2">Prywatność<br />100%</h4>
            <p className="text-[8px] font-black uppercase leading-tight opacity-70">Obraz z kamery przetwarzany jest tylko u Ciebie. Nigdy nie nagrywamy Twojego wizerunku na serwery.</p>
          </div>
        </div>

      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="text-slate-500 py-16 md:py-24 border-t border-slate-900">
    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between gap-12 md:gap-16">
      <div className="space-y-4 md:space-y-6 text-white text-center md:text-left">
        <div className="font-black italic text-2xl md:text-3xl tracking-tighter uppercase underline decoration-sky-500 decoration-4 underline-offset-8">FORMCHECKAI</div>
        <p className="font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-slate-600">Twój osobisty asystent treningu siłowego.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-16 font-black text-[10px] uppercase tracking-[0.3em] text-center sm:text-left">
        <div className="space-y-4 md:space-y-6">
          <div className="text-white font-black italic uppercase">Jak to działa</div>
          <div className="hover:text-sky-400 cursor-pointer transition-colors uppercase">Bezpieczeństwo</div>
        </div>
        <div className="space-y-4 md:space-y-6">
          <div className="text-white font-black italic uppercase">Zacznij</div>
          <div className="hover:text-sky-400 cursor-pointer transition-colors uppercase">Uruchom Demo</div>
        </div>
        <div className="space-y-4 md:space-y-6">
          <div className="text-white font-black italic uppercase">System</div>
          <div className="hover:text-sky-400 cursor-pointer transition-colors uppercase">Prywatność</div>
        </div>
      </div>
    </div>
  </footer>
);

// --- Główny Komponent ---

const LandingPage = ({ onLaunch, onDemo, session }) => {
  return (
    <div className="bg-slate-950 text-white selection:bg-sky-500 selection:text-slate-950 font-sans antialiased scroll-smooth">
      <Nav onLaunch={onLaunch} onDemo={onDemo} session={session} />
      <Hero onDemo={onDemo} session={session} onLaunch={onLaunch} />
      <DemoSection />
      <BentoGrid />
      <Disclaimer />
      <Footer />
    </div>
  );
};

export default LandingPage;