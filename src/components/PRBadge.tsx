import { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ExerciseProgressData, PersonalRecord } from '@/lib/progressUtils';

interface PRBadgeProps {
    records: {
        maxWeight: PersonalRecord | null;
        max1RM: PersonalRecord | null;
        maxVolume: PersonalRecord | null;
    };
    exerciseName: string;
    unit: 'kg' | 'lbs';
}

interface PRNotification {
    id: string;
    type: 'weight' | '1rm' | 'volume';
    value: number;
    exerciseName: string;
    date: string;
}

const PRBadge = ({ records, exerciseName, unit }: PRBadgeProps) => {
    const [showNotification, setShowNotification] = useState(false);
    const [currentPR, setCurrentPR] = useState<PRNotification | null>(null);

    // Check for new PRs (you would typically store last viewed PRs in localStorage)
    useEffect(() => {
        const checkForNewPRs = () => {
            const lastViewedPRs = localStorage.getItem('lastViewedPRs');
            const parsedPRs = lastViewedPRs ? JSON.parse(lastViewedPRs) : {};

            // Check each PR type
            if (records.maxWeight) {
                const key = `${exerciseName}-weight`;
                if (!parsedPRs[key] || parsedPRs[key] < records.maxWeight.value) {
                    setCurrentPR({
                        id: key,
                        type: 'weight',
                        value: records.maxWeight.value,
                        exerciseName,
                        date: records.maxWeight.date,
                    });
                    setShowNotification(true);

                    // Trigger confetti
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#ef4444', '#f97316', '#fbbf24'],
                    });

                    // Update last viewed
                    parsedPRs[key] = records.maxWeight.value;
                    localStorage.setItem('lastViewedPRs', JSON.stringify(parsedPRs));

                    // Auto-hide after 5 seconds
                    setTimeout(() => setShowNotification(false), 5000);
                }
            }
        };

        if (records.maxWeight || records.max1RM || records.maxVolume) {
            checkForNewPRs();
        }
    }, [records, exerciseName]);

    const getPRIcon = (type: string) => {
        switch (type) {
            case 'weight': return <Trophy className="w-5 h-5" />;
            case '1rm': return <Star className="w-5 h-5" />;
            case 'volume': return <TrendingUp className="w-5 h-5" />;
            default: return <Sparkles className="w-5 h-5" />;
        }
    };

    const getPRLabel = (type: string) => {
        switch (type) {
            case 'weight': return 'Max Weight PR';
            case '1rm': return '1RM PR';
            case 'volume': return 'Volume PR';
            default: return 'Personal Record';
        }
    };

    // Render PR badges for existing records
    const renderPRBadges = () => {
        const badges = [];
        if (records.maxWeight) badges.push({ type: 'weight', record: records.maxWeight });
        if (records.max1RM) badges.push({ type: '1rm', record: records.max1RM });
        if (records.maxVolume) badges.push({ type: 'volume', record: records.maxVolume });

        if (badges.length === 0) return null;

        return (
            <div className="flex gap-2 flex-wrap">
                {badges.map(({ type, record }) => (
                    <div
                        key={type}
                        className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30"
                    >
                        {getPRIcon(type)}
                        <span className="text-xs font-black text-amber-400">
                            {record.value} {unit}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            {renderPRBadges()}

            {/* PR Notification Toast */}
            <AnimatePresence>
                {showNotification && currentPR && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.8 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-80"
                    >
                        <div className="glass-card p-4 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 shadow-2xl">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-white uppercase tracking-wider text-sm">
                                            🎉 New PR!
                                        </h4>
                                    </div>
                                    <p className="text-2xl font-black text-amber-400 tabular-nums mb-1">
                                        {currentPR.value} {unit}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {getPRLabel(currentPR.type)} • {exerciseName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="text-muted-foreground hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PRBadge;
