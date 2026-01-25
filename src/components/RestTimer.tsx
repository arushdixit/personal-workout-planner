import { useEffect, useState } from "react";
import { SkipForward, Minus, Plus, Minimize2, Maximize2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { useWorkout } from "@/context/WorkoutContext";
import { cn } from "@/lib/utils";

const RestTimer = () => {
  const {
    isRestTimerActive,
    restTimeLeft,
    isRestTimerMinimized,
    setMinimizedRest,
    adjustRestTime,
    skipRest
  } = useWorkout();

  if (!isRestTimerActive || isRestTimerActive && isRestTimerMinimized) return null;

  const minutes = Math.floor(restTimeLeft / 60);
  const seconds = restTimeLeft % 60;

  // Progress calculation - default 90s if not otherwise specified
  const progress = (restTimeLeft / 90) * 100;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background/95 border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl relative overflow-hidden group">
        {/* Background Decorative Rings */}
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

        <div className="text-center relative">
          <div className="flex items-center justify-between mb-6">
            <div className="w-10" /> {/* Spacer */}
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em]">Rest Period</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMinimizedRest(true)}
              className="w-10 h-10 rounded-full hover:bg-white/5"
            >
              <Minimize2 className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

          <div className="relative w-56 h-56 mx-auto mb-8">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/10"
              />
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="url(#rest-gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 104}`}
                strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress / 100)}`}
                className="transition-all duration-1000 ease-linear drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              />
              <defs>
                <linearGradient id="rest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
              </defs>
            </svg>

            {/* Timer text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black tabular-nums gradient-red-text tracking-tighter">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant="glass"
              size="lg"
              onClick={() => adjustRestTime(-10)}
              className="flex-1 h-14 bg-white/5 border-white/5 font-bold rounded-2xl"
            >
              <Minus className="w-4 h-4 mr-1" />
              10s
            </Button>
            <Button
              variant="gradient"
              size="lg"
              onClick={skipRest}
              className="flex-[1.5] h-14 font-black text-lg shadow-xl shadow-primary/20 rounded-2xl"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              SKIP
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => adjustRestTime(10)}
              className="flex-1 h-14 bg-white/5 border-white/5 font-bold rounded-2xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              10s
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export const MinimizedRestTimer = () => {
  const { isRestTimerActive, restTimeLeft, isRestTimerMinimized, setMinimizedRest, skipRest } = useWorkout();

  if (!isRestTimerActive || !isRestTimerMinimized) return null;

  const minutes = Math.floor(restTimeLeft / 60);
  const seconds = restTimeLeft % 60;

  return (
    <div
      onClick={() => setMinimizedRest(false)}
      className="fixed bottom-24 right-4 z-[100] flex items-center gap-3 bg-red-600 px-4 py-3 rounded-2xl shadow-lg shadow-red-600/20 animate-in slide-in-from-right duration-300 active:scale-95 transition-transform"
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Timer className="w-5 h-5 text-white animate-pulse" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-white/70 uppercase leading-none mb-1">Resting</span>
        <span className="text-xl font-black text-white tabular-nums leading-none tracking-tight">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          skipRest();
        }}
        className="w-8 h-8 rounded-full hover:bg-white/10 ml-1 text-white"
      >
        <SkipForward className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default RestTimer;
