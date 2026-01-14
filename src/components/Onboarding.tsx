import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { ChevronLeft, ChevronRight, Dumbbell, User } from 'lucide-react';
import { db, UserProfile } from '@/lib/db';
import { starterExercises } from '@/lib/starter-exercises';
import { importExercemusData } from '@/lib/exercemus';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        gender: 'male' as 'male' | 'female',
        age: 25,
        height: 175,
        weight: 70,
        activeSplit: 'PPL' as 'PPL' | 'UpperLower' | 'FullBody',
    });

    const handleNext = () => setStep(s => Math.min(s + 1, 5));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const newUser: Omit<UserProfile, 'id'> = {
                ...formData,
                onboarded: true,
                createdAt: new Date().toISOString(),
            };

            const userId = await db.users.add(newUser);
            localStorage.setItem('prolifts_active_user', String(userId));

            // Seed exercises if empty
            const count = await db.exercises.count();
            if (count === 0) {
                await db.exercises.bulkAdd(starterExercises);
            }

            // Always try to import Exercemus data (it will check if already done)
            await importExercemusData();

            onComplete();
        } catch (err) {
            console.error('Onboarding failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-scale-in">
                <div className="text-center">
                    <h1 className="text-4xl font-black gradient-red-text tracking-tighter mb-2">PRO-LIFTS</h1>
                    <p className="text-muted-foreground text-sm">Step {step} of 5</p>
                </div>

                <div className="glass-card p-6 space-y-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <Label htmlFor="name">What's your name?</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <RadioGroup
                                    value={formData.gender}
                                    onValueChange={v => setFormData({ ...formData, gender: v as 'male' | 'female' })}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {['male', 'female'].map(g => (
                                        <div key={g}>
                                            <RadioGroupItem value={g} id={g} className="peer sr-only" />
                                            <Label
                                                htmlFor={g}
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                            >
                                                <span className="text-sm font-medium capitalize">{g}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Label>Height: {formData.height} cm</Label>
                                <Slider
                                    value={[formData.height]}
                                    onValueChange={v => setFormData({ ...formData, height: v[0] })}
                                    min={120}
                                    max={200}
                                    step={1}
                                />
                            </div>
                            <div className="space-y-4">
                                <Label>Weight: {formData.weight} kg</Label>
                                <Slider
                                    value={[formData.weight]}
                                    onValueChange={v => setFormData({ ...formData, weight: v[0] })}
                                    min={30}
                                    max={100}
                                    step={1}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <Label>Training Split</Label>
                            <RadioGroup
                                value={formData.activeSplit}
                                onValueChange={v => setFormData({ ...formData, activeSplit: v as 'PPL' | 'UpperLower' | 'FullBody' })}
                                className="space-y-3"
                            >
                                {[
                                    { value: 'PPL', label: 'Push-Pull-Legs', desc: '6 days/week' },
                                    { value: 'UpperLower', label: 'Upper/Lower', desc: '4 days/week' },
                                    { value: 'FullBody', label: 'Full Body', desc: '3 days/week' },
                                ].map(s => (
                                    <div key={s.value}>
                                        <RadioGroupItem value={s.value} id={s.value} className="peer sr-only" />
                                        <Label
                                            htmlFor={s.value}
                                            className="flex items-center justify-between rounded-xl border-2 border-muted bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <div>
                                                <p className="font-semibold">{s.label}</p>
                                                <p className="text-xs text-muted-foreground">{s.desc}</p>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="text-center space-y-4 py-6">
                            <div className="w-20 h-20 mx-auto rounded-full gradient-red flex items-center justify-center glow-red">
                                <Dumbbell className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold">You're Ready!</h2>
                            <p className="text-muted-foreground">
                                Welcome, {formData.name}. Let's start lifting.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        {step > 1 && (
                            <Button variant="glass" onClick={handleBack} className="flex-1">
                                <ChevronLeft className="mr-2 w-4 h-4" /> Back
                            </Button>
                        )}
                        {step < 5 ? (
                            <Button
                                variant="default"
                                onClick={handleNext}
                                disabled={step === 1 && !formData.name.trim()}
                                className="flex-1 gradient-red glow-red border-none"
                            >
                                Next <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 gradient-red glow-red border-none"
                            >
                                {loading ? 'Setting up...' : 'Get Started'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
