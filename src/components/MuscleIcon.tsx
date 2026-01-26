import { cn } from '@/lib/utils';

interface MuscleIconProps {
    muscleName: string;
    isPrimary: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
};

const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
};

// Fallback emoji mapping (used if images fail to load)
const muscleEmojis: Record<string, string> = {
    'chest': '💪',
    'back': '🔙',
    'shoulders': '🏋️',
    'deltoids': '🏋️',
    'biceps': '💪',
    'triceps': '💪',
    'forearm': '🤜',
    'abs': '🎯',
    'obliques': '🎯',
    'quadriceps': '🦵',
    'quads': '🦵',
    'hamstrings': '🦵',
    'hamstring': '🦵',
    'glutes': '🍑',
    'gluteal': '🍑',
    'calves': '🦵',
    'lats': '🔙',
    'traps': '🏔️',
    'trapezius': '🏔️',
    'lower-back': '🔙',
    'adductors': '🦵',
    'neck': '🧠',
    'tibialis': '🦵',
};

// Map of common names to actual filenames in /public/muscles
const muscleFileMap: Record<string, string> = {
    'glutes': 'gluteal',
    'hamstrings': 'hamstring',
    'traps': 'trapezius',
    'shoulders': 'deltoids',
    'quads': 'quadriceps',
    'forearms': 'forearm',
    'lower back': 'lower-back',
    'middle back': 'upper-back',
    'upper back': 'upper-back',
    'back': 'upper-back', // Fallback for general 'back'
};

export const MuscleIcon = ({ muscleName, isPrimary, size = 'md' }: MuscleIconProps) => {
    const rawSlug = muscleName.toLowerCase().trim();
    const normalizedSlug = muscleFileMap[rawSlug] || rawSlug.replace(/\s+/g, '-');

    // Determine the exact filename based on primary/secondary
    const fileName = isPrimary ? normalizedSlug : `${normalizedSlug}-secondary`;
    const emoji = muscleEmojis[normalizedSlug] || muscleEmojis[rawSlug] || '💪';

    return (
        <div
            className={cn(
                sizeClasses[size],
                "rounded-3xl flex items-center justify-center overflow-hidden relative transition-all duration-500 group hover:scale-105",
                isPrimary
                    ? "bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/30 shadow-[0_0_20px_-5px_rgba(225,29,72,0.4)]"
                    : "bg-gradient-to-br from-orange-400/20 to-orange-500/10 border border-orange-400/30 shadow-[0_0_20px_-5px_rgba(251,146,60,0.4)]"
            )}
        >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Try to load image first */}
            <img
                src={`/muscles/${fileName}.png`}
                alt={muscleName}
                className={cn(
                    iconSizes[size],
                    "object-contain filter brightness-110 contrast-125 opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all duration-500"
                )}
                onError={(e) => {
                    // Hide image and show emoji fallback
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                        const fallback = parent.querySelector('.emoji-fallback') as HTMLElement;
                        if (fallback) {
                            fallback.style.display = 'block';
                        }
                    }
                }}
            />
            {/* Emoji fallback (hidden by default) */}
            <span
                className="emoji-fallback text-xl sm:text-2xl animate-in fade-in zoom-in duration-300"
                style={{ display: 'none' }}
            >
                {emoji}
            </span>
        </div>
    );
};

export default MuscleIcon;
