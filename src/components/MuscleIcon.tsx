import { cn } from '@/lib/utils';

interface MuscleIconProps {
    muscleName: string;
    isPrimary: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
};

const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
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
    'hamstrings': '🦵',
    'glutes': '🍑',
    'calves': '🦵',
    'lats': '🔙',
    'traps': '🏔️',
    'lower-back': '🔙',
    'adductors': '🦵',
    'neck': '🧠',
    'tibialis': '🦵',
};

export const MuscleIcon = ({ muscleName, isPrimary, size = 'md' }: MuscleIconProps) => {
    const muscleSlug = muscleName.toLowerCase().replace(/\s+/g, '-');
    const emoji = muscleEmojis[muscleSlug] || '💪';

    return (
        <div
            className={cn(
                sizeClasses[size],
                "rounded-full flex items-center justify-center overflow-hidden relative",
                isPrimary
                    ? "bg-rose-600/20 border border-rose-600/30"
                    : "bg-orange-400/20 border border-orange-400/30"
            )}
        >
            {/* Try to load image first */}
            <img
                src={`/images/muscles/${muscleSlug}.png`}
                alt={muscleName}
                className={cn(iconSizes[size], "object-contain filter brightness-0 invert opacity-80")}
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
            <span className="emoji-fallback text-2xl" style={{ display: 'none' }}>
                {emoji}
            </span>
        </div>
    );
};

export default MuscleIcon;
