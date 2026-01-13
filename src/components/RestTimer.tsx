import { useEffect, useState } from "react";
import { SkipForward, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RestTimerProps {
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
}

const RestTimer = ({ duration, onComplete, onSkip }: RestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentDuration, setCurrentDuration] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const adjustTime = (delta: number) => {
    setTimeLeft((prev) => Math.max(0, prev + delta));
    setCurrentDuration((prev) => Math.max(15, prev + delta));
  };
  
  const progress = ((currentDuration - timeLeft) / currentDuration) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl animate-scale-in">
      <div className="text-center">
        <p className="text-muted-foreground text-lg mb-8 font-medium">Rest Time</p>
        
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear drop-shadow-[0_0_10px_hsl(var(--primary))]"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Timer text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold tabular-nums gradient-red-text">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <Button variant="glass" size="lg" onClick={() => adjustTime(-15)} className="px-4">
            <Minus className="w-4 h-4 mr-1" />
            15s
          </Button>
          <Button variant="glass" size="lg" onClick={onSkip}>
            <SkipForward className="w-5 h-5 mr-2" />
            Skip
          </Button>
          <Button variant="glass" size="lg" onClick={() => adjustTime(15)} className="px-4">
            <Plus className="w-4 h-4 mr-1" />
            15s
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RestTimer;
