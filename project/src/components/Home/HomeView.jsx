import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PresentationControls, Stage, Html, Float } from '@react-three/drei';
import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { ChevronRight } from 'lucide-react';

function Model({ onPartClick }) {
  const { nodes } = useGLTF('/human_model.glb');
  const [hovered, setHovered] = React.useState(null);

  const nameMap = {
    "Klata": "Klatka",
    "Uda": "Nogi",
    "Barki":"Barki",
    "lydki": "Nogi",
    "Biceps": "Biceps",
    "Przedramie": "Przedramie",
    "Triceps": "Triceps",
    "Góra_pleców": "Plecy",
    "Mięsień_najszerszy_grzbietu": "Plecy",
    "Boki_brzucha": "Core",
    "Brzuch": "Core"
  };

  if (!nodes) return null;

  return (
    <group dispose={null} rotation={[-Math.PI / 2, 0, 0]}>
      {Object.keys(nodes).map((name) => {
        const obj = nodes[name];
        if (obj.type !== 'Mesh') return null;

        const mappedCategory = nameMap[name];
        const isSelectable = !!mappedCategory;
        const isHovered = hovered === name;

        return (
          <mesh
            key={name}
            geometry={obj.geometry}
            onPointerOver={(e) => { e.stopPropagation(); if(isSelectable) setHovered(name); }}
            onPointerOut={() => setHovered(null)}
            onClick={(e) => {
              e.stopPropagation(); 
              if (isSelectable) {
                onPartClick(mappedCategory); 
              }
            }}
          >
            <meshStandardMaterial 
              color={isHovered ? "#38bdf8" : "#1f2937"}
              emissive={isHovered ? "#0ea5e9" : "#000000"}
              emissiveIntensity={isHovered ? 0.5 : 0}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

const Hotspot = ({ position, label, onClick }) => (
  <Html position={position} center distanceFactor={10}>
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
      <button 
        onClick={onClick}
        className="group flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-sky-500/20 px-5 py-2.5 rounded-full hover:bg-sky-500 hover:border-sky-400 transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-sky-500/40"
      >
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-sky-500 group-hover:bg-black transition-colors" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-sky-400 animate-ping opacity-75" />
        </div>
        <span className="text-[12px] font-black uppercase text-sky-400 group-hover:text-black tracking-[0.2em] whitespace-nowrap">
          {label}
        </span>
        <ChevronRight size={16} className="text-sky-500/50 group-hover:text-black transition-colors" />
      </button>
    </Float>
  </Html>
);

const HomeView = ({ onSelectCategory }) => {
  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-[800px] h-[800px] bg-sky-600/5 blur-[180px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-[800px] h-[800px] bg-indigo-600/5 blur-[180px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Top Left: Witaj */}
      <div className="absolute top-12 left-12 z-[60] pointer-events-none opacity-0 animate-fade-in-left" style={{ animationFillMode: 'forwards' }}>
        <h1 className="text-6xl md:text-9xl font-black text-slate-400 uppercase italic tracking-tighter leading-none">
          Witaj
        </h1>
      </div>

      {/* Middle Right: Co dzisiaj Trenujemy? */}
      <div className="absolute top-1/2 -translate-y-1/2 right-12 z-[60] text-right pointer-events-none opacity-0 animate-fade-in-right" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
        <p className="text-xl md:text-3xl text-slate-500 font-black uppercase tracking-[0.3em] italic leading-none mb-4">
          Co dzisiaj
        </p>
        <p className="text-4xl md:text-7xl text-slate-400 font-black uppercase tracking-tight italic leading-none">
          Trenujemy?
        </p>
      </div>

      {/* Bottom Left: Kliknij na mięśnie */}
      <div className="absolute bottom-12 left-12 z-[60] pointer-events-none opacity-0 animate-fade-in-left" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-16 bg-gradient-to-b from-sky-500 to-transparent rounded-full" />
          <p className="text-base md:text-lg text-slate-500 uppercase font-black tracking-[0.2em] leading-relaxed">
            Kliknij na <br />
            <span className="text-slate-400 text-xl md:text-2xl">mięśnie</span>
          </p>
        </div>
      </div>

      {/* Fullscreen 3D Model */}
      <div className="absolute inset-0 z-[55] opacity-0 animate-fade-in-slow" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
        <Canvas 
          dpr={[1, 2]} 
          camera={{ fov: 35, position: [0, 0, 5] }}
          style={{ touchAction: 'none' }}
        >
          <color attach="background" args={['#000000']} />
          
          <Suspense fallback={<Html center className="text-sky-500 font-mono text-xs tracking-[0.5em] uppercase animate-pulse">Inicjalizacja Systemu...</Html>}>
            <ambientLight intensity={0.8} /> 
            <pointLight position={[10, 10, 10]} intensity={3} color="#ffffff" />
            <pointLight position={[-10, 5, 10]} intensity={2} color="#38bdf8" />
            <pointLight position={[0, -10, 5]} intensity={1.5} color="#6366f1" />
            <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={4} castShadow />
            <directionalLight position={[0, 5, 5]} intensity={2} />
            
            <PresentationControls 
              speed={1.5} 
              global 
              zoom={1.2}
              polar={[-0.1, Math.PI / 4]}
              config={{ mass: 1, tension: 170, friction: 26 }} 
            >
              <Stage environment="city" intensity={0.6} contactShadow={false} adjustCamera={true}>
                <Model onPartClick={onSelectCategory} />
                
                {/* Muscle Hotspots */}
                <Hotspot position={[0.5, 0.9, 0.3]} label="Klatka" onClick={() => onSelectCategory('Klatka')} />
                <Hotspot position={[0, 0.4, -0.5]} label="Plecy" onClick={() => onSelectCategory('Plecy')} />
                <Hotspot position={[0.5, -0.8, 0.3]} label="Nogi" onClick={() => onSelectCategory('Nogi')} />
                <Hotspot position={[0.8, 0.7, 0.2]} label="Barki" onClick={() => onSelectCategory('Barki')} />
                <Hotspot position={[0.3, 0.2, 0.3]} label="Core" onClick={() => onSelectCategory('Core')} />
                <Hotspot position={[0.9, 0.2, 0.2]} label="Ramiona" onClick={() => onSelectCategory('Biceps')} />
              </Stage>
            </PresentationControls>
          </Suspense>
        </Canvas>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-left {
          animation: fade-in-left 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in-right {
          animation: fade-in-right 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in-slow {
          animation: fade-in 5s ease-out;
        }
      `}} />
    </div>
  );
};

export default HomeView;
