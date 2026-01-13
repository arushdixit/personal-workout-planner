import { useState } from 'react';
import { MuscleGroup } from '@/lib/db';
import { cn } from '@/lib/utils';
import { bodyFront } from './anatomy/bodyFront';
import { bodyBack } from './anatomy/bodyBack';
import { bodyFemaleFront } from './anatomy/bodyFemaleFront';
import { bodyFemaleBack } from './anatomy/bodyFemaleBack';

interface AnatomyDiagramProps {
  selectedPrimary?: string[];
  selectedSecondary?: string[];
  primaryMuscles?: string[]; // Alternative name
  secondaryMuscles?: string[]; // Alternative name
  onTogglePrimary?: (muscle: string) => void;
  onToggleSecondary?: (muscle: string) => void;
  mode?: 'primary' | 'secondary' | 'read-only';
  gender?: 'male' | 'female';
  view?: 'front' | 'back';
}

const AnatomyDiagram = ({
  selectedPrimary = [],
  selectedSecondary = [],
  primaryMuscles = [],
  secondaryMuscles = [],
  onTogglePrimary,
  onToggleSecondary,
  mode = 'read-only',
  gender = 'male',
  view: initialView = 'front',
}: AnatomyDiagramProps) => {
  const [view, setView] = useState<'front' | 'back'>(initialView);

  // Combine prop names for flexibility
  const activePrimary = [...selectedPrimary, ...primaryMuscles];
  const activeSecondary = [...selectedSecondary, ...secondaryMuscles];

  const dataSource = view === 'front'
    ? (gender === 'female' ? bodyFemaleFront : bodyFront)
    : (gender === 'female' ? bodyFemaleBack : bodyBack);

  const getMuscleColor = (muscle: string) => {
    if (activePrimary.includes(muscle)) return '#ec4899'; // Pink-500
    if (activeSecondary.includes(muscle)) return '#f97316'; // Orange-500
    return '#3f3f3f'; // Muted dark gray
  };

  const getMuscleOpacity = (muscle: string) => {
    if (activePrimary.includes(muscle)) return 1;
    if (activeSecondary.includes(muscle)) return 1;
    return 0.5;
  };

  const handleClick = (muscle: string) => {
    if (mode === 'primary' && onTogglePrimary) {
      onTogglePrimary(muscle);
    } else if (mode === 'secondary' && onToggleSecondary) {
      onToggleSecondary(muscle);
    }
  };

  const renderPath = (path: string, muscle: string, side?: 'left' | 'right') => (
    <path
      key={`${muscle}-${side || 'common'}-${path.substring(0, 10)}`}
      d={path}
      fill={getMuscleColor(muscle)}
      opacity={getMuscleOpacity(muscle)}
      className="cursor-pointer transition-all duration-200 hover:brightness-125"
      onClick={() => handleClick(muscle)}
    />
  );

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setView('front')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            view === 'front' ? 'gradient-red text-white' : 'glass text-muted-foreground'
          )}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            view === 'back' ? 'gradient-red text-white' : 'glass text-muted-foreground'
          )}
        >
          Back
        </button>
      </div>

      {/* Mode Indicator */}
      {mode !== 'read-only' && (
        <p className="text-center text-sm text-muted-foreground">
          Selecting: <span className={mode === 'primary' ? 'text-pink-400 font-bold' : 'text-orange-400 font-bold'}>
            {mode === 'primary' ? 'Primary Muscles' : 'Secondary Muscles'}
          </span>
        </p>
      )}

      {/* Anatomy Container */}
      <div className="relative w-full aspect-[1/2] max-w-[280px] mx-auto bg-slate-950/50 rounded-3xl overflow-hidden p-4 border border-white/5">
        <svg
          viewBox={view === 'front' ? "0 0 724 1448" : "724 0 724 1448"}
          className="w-full h-full"
        >
          {/* Base Body Outline (Simplified background) */}
          <g fill="#1a1a1a" stroke="#ffffff10" strokeWidth="2">
            {/* The library doesn't provide a clean outline as a single path in the assets, 
                so we render all muscles with the base color first to form the silhouette */}
            {dataSource.map((part: any) => (
              <g key={`base-${part.slug}`}>
                {part.path.common?.map((p: string) => <path key={p} d={p} />)}
                {part.path.left?.map((p: string) => <path key={p} d={p} />)}
                {part.path.right?.map((p: string) => <path key={p} d={p} />)}
              </g>
            ))}
          </g>

          {/* Active Muscle Paths */}
          {dataSource.map((part: any) => (
            <g key={`active-${part.slug}`}>
              {part.path.common?.map((p: string) => renderPath(p, part.slug))}
              {part.path.left?.map((p: string) => renderPath(p, part.slug, 'left'))}
              {part.path.right?.map((p: string) => renderPath(p, part.slug, 'right'))}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs bg-white/5 p-3 rounded-2xl border border-white/5 max-w-[280px] mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span className="text-muted-foreground">Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">Secondary</span>
        </div>
      </div>
    </div>
  );
};

export default AnatomyDiagram;
