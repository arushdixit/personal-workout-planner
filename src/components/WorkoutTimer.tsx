import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface WorkoutTimerProps {
    startTime: string;
}

const WorkoutTimer = ({ startTime }: WorkoutTimerProps) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();
        if (isNaN(start)) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
        };

        updateTimer(); // Initial call
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Timer className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-mono text-lg font-bold gradient-red-text">
                {formatTime(elapsed)}
            </span>
        </div>
    );
};

export default WorkoutTimer;
