import { useState } from 'react';
import { MuscleGroup } from '@/lib/db';
import { cn } from '@/lib/utils';

interface AnatomyDiagramProps {
  selectedPrimary: string[];
  selectedSecondary: string[];
  onTogglePrimary: (muscle: string) => void;
  onToggleSecondary: (muscle: string) => void;
  mode: 'primary' | 'secondary';
}

// Muscle positions for front and back views (percentage-based for responsiveness)
const FRONT_MUSCLES: Record<string, { x: number; y: number; w: number; h: number }> = {
  chest: { x: 35, y: 22, w: 30, h: 12 },
  shoulders: { x: 22, y: 18, w: 56, h: 8 },
  biceps: { x: 18, y: 30, w: 12, h: 14 },
  triceps: { x: 70, y: 30, w: 12, h: 14 },
  forearms: { x: 14, y: 46, w: 10, h: 14 },
  abs: { x: 40, y: 36, w: 20, h: 18 },
  obliques: { x: 30, y: 40, w: 8, h: 12 },
  quads: { x: 30, y: 58, w: 40, h: 22 },
  calves: { x: 32, y: 82, w: 36, h: 14 },
};

const BACK_MUSCLES: Record<string, { x: number; y: number; w: number; h: number }> = {
  traps: { x: 35, y: 12, w: 30, h: 10 },
  rear_delts: { x: 22, y: 18, w: 56, h: 6 },
  lats: { x: 28, y: 26, w: 44, h: 16 },
  rhomboids: { x: 38, y: 22, w: 24, h: 10 },
  lower_back: { x: 38, y: 44, w: 24, h: 10 },
  glutes: { x: 32, y: 54, w: 36, h: 12 },
  hamstrings: { x: 30, y: 68, w: 40, h: 16 },
};

const AnatomyDiagram = ({
  selectedPrimary,
  selectedSecondary,
  onTogglePrimary,
  onToggleSecondary,
  mode,
}: AnatomyDiagramProps) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const muscles = view === 'front' ? FRONT_MUSCLES : BACK_MUSCLES;

  const getMuscleColor = (muscle: string) => {
    if (selectedPrimary.includes(muscle)) return 'bg-red-500/80 border-red-400';
    if (selectedSecondary.includes(muscle)) return 'bg-orange-400/60 border-orange-300';
    return 'bg-white/10 border-white/20 hover:bg-white/20';
  };

  const handleClick = (muscle: string) => {
    if (mode === 'primary') {
      onTogglePrimary(muscle);
    } else {
      onToggleSecondary(muscle);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setView('front')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            view === 'front' ? 'gradient-red text-white' : 'glass text-muted-foreground'
          )}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            view === 'back' ? 'gradient-red text-white' : 'glass text-muted-foreground'
          )}
        >
          Back
        </button>
      </div>

      {/* Mode Indicator */}
      <p className="text-center text-sm text-muted-foreground">
        Selecting: <span className={mode === 'primary' ? 'text-red-400 font-bold' : 'text-orange-400 font-bold'}>
          {mode === 'primary' ? 'Primary Muscles' : 'Secondary Muscles'}
        </span>
      </p>

      {/* Anatomy Container */}
      <div className="relative w-full aspect-[3/4] max-w-xs mx-auto bg-white/5 rounded-2xl overflow-hidden">
        {/* Body Outline (simplified) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 100 130" className="w-full h-full opacity-20">
            {/* Head */}
            <circle cx="50" cy="10" r="8" fill="currentColor" />
            {/* Torso */}
            <rect x="30" y="20" width="40" height="40" rx="5" fill="currentColor" />
            {/* Arms */}
            <rect x="15" y="22" width="12" height="35" rx="4" fill="currentColor" />
            <rect x="73" y="22" width="12" height="35" rx="4" fill="currentColor" />
            {/* Legs */}
            <rect x="32" y="62" width="15" height="45" rx="5" fill="currentColor" />
            <rect x="53" y="62" width="15" height="45" rx="5" fill="currentColor" />
          </svg>
        </div>

        {/* Clickable Muscle Regions */}
        {Object.entries(muscles).map(([muscle, pos]) => (
          <button
            key={muscle}
            onClick={() => handleClick(muscle)}
            className={cn(
              'absolute rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-xs font-bold capitalize',
              getMuscleColor(muscle)
            )}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${pos.w}%`,
              height: `${pos.h}%`,
            }}
          >
            {muscle.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/80 border border-red-400" />
          <span>Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-400/60 border border-orange-300" />
          <span>Secondary</span>
        </div>
      </div>
    </div>
  );
};

export default AnatomyDiagram;
