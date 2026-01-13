import { cn } from "@/lib/utils";

interface AnatomyDiagramProps {
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  className?: string;
  view?: "front" | "back";
}

const AnatomyDiagram = ({
  primaryMuscles = [],
  secondaryMuscles = [],
  className,
  view = "front",
}: AnatomyDiagramProps) => {
  const getMuscleColor = (muscleId: string) => {
    if (primaryMuscles.includes(muscleId)) {
      return "fill-primary drop-shadow-[0_0_8px_hsl(var(--primary))]";
    }
    if (secondaryMuscles.includes(muscleId)) {
      return "fill-salmon drop-shadow-[0_0_6px_hsl(var(--salmon))]";
    }
    return "fill-muted/30";
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 200 400"
        className="w-full h-full"
        style={{ maxHeight: "300px" }}
      >
        {/* Body outline */}
        <ellipse cx="100" cy="35" rx="25" ry="30" className="fill-muted/20 stroke-muted-foreground/30" strokeWidth="1" />
        
        {/* Neck */}
        <rect x="90" y="60" width="20" height="15" rx="5" className="fill-muted/20" />
        
        {view === "front" ? (
          <>
            {/* Chest */}
            <path
              id="chest_left"
              d="M55 85 Q45 100 50 130 Q60 135 75 125 Q85 110 85 95 Q80 80 55 85"
              className={cn("transition-all duration-300", getMuscleColor("chest_left"))}
            />
            <path
              id="chest_right"
              d="M145 85 Q155 100 150 130 Q140 135 125 125 Q115 110 115 95 Q120 80 145 85"
              className={cn("transition-all duration-300", getMuscleColor("chest_right"))}
            />
            
            {/* Shoulders */}
            <ellipse
              id="shoulder_left"
              cx="45" cy="95"
              rx="15" ry="20"
              className={cn("transition-all duration-300", getMuscleColor("shoulder_left"))}
            />
            <ellipse
              id="shoulder_right"
              cx="155" cy="95"
              rx="15" ry="20"
              className={cn("transition-all duration-300", getMuscleColor("shoulder_right"))}
            />
            
            {/* Biceps */}
            <ellipse
              id="bicep_left"
              cx="35" cy="135"
              rx="12" ry="25"
              className={cn("transition-all duration-300", getMuscleColor("bicep_left"))}
            />
            <ellipse
              id="bicep_right"
              cx="165" cy="135"
              rx="12" ry="25"
              className={cn("transition-all duration-300", getMuscleColor("bicep_right"))}
            />
            
            {/* Forearms */}
            <ellipse
              id="forearm_left"
              cx="30" cy="185"
              rx="10" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("forearm_left"))}
            />
            <ellipse
              id="forearm_right"
              cx="170" cy="185"
              rx="10" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("forearm_right"))}
            />
            
            {/* Abs */}
            <rect
              id="abs"
              x="75" y="130"
              width="50" height="70"
              rx="8"
              className={cn("transition-all duration-300", getMuscleColor("abs"))}
            />
            
            {/* Obliques */}
            <path
              id="oblique_left"
              d="M55 130 Q50 165 55 200 Q65 200 70 165 Q70 130 55 130"
              className={cn("transition-all duration-300", getMuscleColor("oblique_left"))}
            />
            <path
              id="oblique_right"
              d="M145 130 Q150 165 145 200 Q135 200 130 165 Q130 130 145 130"
              className={cn("transition-all duration-300", getMuscleColor("oblique_right"))}
            />
            
            {/* Quads */}
            <ellipse
              id="quad_left"
              cx="75" cy="260"
              rx="22" ry="50"
              className={cn("transition-all duration-300", getMuscleColor("quad_left"))}
            />
            <ellipse
              id="quad_right"
              cx="125" cy="260"
              rx="22" ry="50"
              className={cn("transition-all duration-300", getMuscleColor("quad_right"))}
            />
            
            {/* Calves */}
            <ellipse
              id="calf_left"
              cx="70" cy="355"
              rx="12" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("calf_left"))}
            />
            <ellipse
              id="calf_right"
              cx="130" cy="355"
              rx="12" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("calf_right"))}
            />
          </>
        ) : (
          <>
            {/* Back muscles */}
            <path
              id="trap"
              d="M70 75 Q100 65 130 75 Q125 95 100 100 Q75 95 70 75"
              className={cn("transition-all duration-300", getMuscleColor("trap"))}
            />
            
            {/* Lats */}
            <path
              id="lat_left"
              d="M55 100 Q45 140 50 180 Q70 175 80 130 Q75 100 55 100"
              className={cn("transition-all duration-300", getMuscleColor("lat_left"))}
            />
            <path
              id="lat_right"
              d="M145 100 Q155 140 150 180 Q130 175 120 130 Q125 100 145 100"
              className={cn("transition-all duration-300", getMuscleColor("lat_right"))}
            />
            
            {/* Triceps */}
            <ellipse
              id="tricep_left"
              cx="40" cy="130"
              rx="10" ry="25"
              className={cn("transition-all duration-300", getMuscleColor("tricep_left"))}
            />
            <ellipse
              id="tricep_right"
              cx="160" cy="130"
              rx="10" ry="25"
              className={cn("transition-all duration-300", getMuscleColor("tricep_right"))}
            />
            
            {/* Lower back */}
            <rect
              id="lower_back"
              x="80" y="140"
              width="40" height="50"
              rx="6"
              className={cn("transition-all duration-300", getMuscleColor("lower_back"))}
            />
            
            {/* Glutes */}
            <ellipse
              id="glute_left"
              cx="75" cy="215"
              rx="25" ry="20"
              className={cn("transition-all duration-300", getMuscleColor("glute_left"))}
            />
            <ellipse
              id="glute_right"
              cx="125" cy="215"
              rx="25" ry="20"
              className={cn("transition-all duration-300", getMuscleColor("glute_right"))}
            />
            
            {/* Hamstrings */}
            <ellipse
              id="hamstring_left"
              cx="75" cy="280"
              rx="18" ry="40"
              className={cn("transition-all duration-300", getMuscleColor("hamstring_left"))}
            />
            <ellipse
              id="hamstring_right"
              cx="125" cy="280"
              rx="18" ry="40"
              className={cn("transition-all duration-300", getMuscleColor("hamstring_right"))}
            />
            
            {/* Calves back */}
            <ellipse
              id="calf_back_left"
              cx="70" cy="355"
              rx="12" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("calf_back_left"))}
            />
            <ellipse
              id="calf_back_right"
              cx="130" cy="355"
              rx="12" ry="30"
              className={cn("transition-all duration-300", getMuscleColor("calf_back_right"))}
            />
          </>
        )}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full gradient-red" />
          <span className="text-muted-foreground">Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-salmon" />
          <span className="text-muted-foreground">Secondary</span>
        </div>
      </div>
    </div>
  );
};

export default AnatomyDiagram;
