import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkoutCountdownProps {
    onComplete: () => void;
}

const WorkoutCountdown = ({ onComplete }: WorkoutCountdownProps) => {
    const [count, setCount] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Give a small delay after '1' so it's actually visible before ending
                    setTimeout(onComplete, 800);
                    return prev;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[250] bg-black flex items-center justify-center overflow-hidden isolation-auto">
            {/* High-energy background effects - GPU Accelerated */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.15, 0.3, 0.15],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{ willChange: 'transform, opacity, filter' }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] transform-gpu"
                />
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={count}
                        initial={{
                            scale: 0.5,
                            opacity: 0,
                            filter: "blur(10px)",
                            translateZ: 0
                        }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            filter: "blur(0px)",
                            translateZ: 0
                        }}
                        exit={{
                            scale: 2,
                            opacity: 0,
                            filter: "blur(20px)",
                            translateZ: 0
                        }}
                        transition={{
                            duration: 0.5,
                            ease: [0.34, 1.56, 0.64, 1] // Bouncy spring feel
                        }}
                        style={{ willChange: 'transform, opacity, filter' }}
                        className="absolute flex items-center justify-center transform-gpu"
                    >
                        <h1 className="text-[18rem] font-black italic leading-none text-white drop-shadow-[0_0_60px_rgba(239,68,68,0.5)] select-none">
                            {count}
                        </h1>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(2)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.75,
                            ease: "easeOut"
                        }}
                        style={{ translateZ: 0 }}
                        className="absolute w-64 h-64 border border-primary/20 rounded-full transform-gpu"
                    />
                ))}
            </div>
        </div>
    );
};

export default WorkoutCountdown;
