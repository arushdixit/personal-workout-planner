import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { usersDb, UserProfile, exercisesDb } from '@/lib/db';
import { starterExercises } from '@/lib/starter-exercises';

interface OnboardingProps {
    onComplete: (user: UserProfile) => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        name: '',
        gender: 'male',
        age: 25,
        height: 175,
        weight: 75,
        activeSplit: 'PPL',
    });

    const handleNext = () => setStep((s) => s + 1);
    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const newUser: UserProfile = {
                _id: `user_${Date.now()}`,
                ...(formData as Omit<UserProfile, '_id' | 'onboarded' | 'createdAt'>),
                onboarded: true,
                createdAt: new Date().toISOString(),
            };

            await usersDb.put(newUser);

            // Optionally seed starter library if empty
            const existingExercises = await exercisesDb.allDocs({ limit: 1 });
            if (existingExercises.total_rows === 0) {
                await exercisesDb.bulkDocs(starterExercises);
            }

            onComplete(newUser);
        } catch (error) {
            console.error('Error during onboarding:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6 animate-scale-in">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black gradient-red-text tracking-tighter">PRO-LIFTS</h1>
                    <p className="text-muted-foreground">Level up your fitness journey</p>
                </div>

                <Card className="glass shadow-2xl border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center justify-between">
                            <span>Step {step} of 5</span>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i <= step ? 'gradient-red' : 'bg-muted'
                                            }`}
                                    />
                                ))}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 py-6">
                        {step === 1 && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="space-y-2">
                                    <Label htmlFor="name">What's your name?</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <RadioGroup
                                        value={formData.gender}
                                        onValueChange={(val) => setFormData({ ...formData, gender: val as 'male' | 'female' })}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div>
                                            <RadioGroupItem value="male" id="male" className="peer sr-only" />
                                            <Label
                                                htmlFor="male"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                            >
                                                <span className="text-sm font-medium">Male</span>
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="female" id="female" className="peer sr-only" />
                                            <Label
                                                htmlFor="female"
                                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                            >
                                                <span className="text-sm font-medium">Female</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="space-y-2">
                                    <Label htmlFor="height">Height (cm)</Label>
                                    <Input
                                        id="height"
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="weight">Weight (kg)</Label>
                                    <Input
                                        id="weight"
                                        type="number"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                                        className="bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4 animate-slide-up">
                                <Label>Select Training Split</Label>
                                <RadioGroup
                                    value={formData.activeSplit}
                                    onValueChange={(val) => setFormData({ ...formData, activeSplit: val as 'PPL' | 'UpperLower' | 'FullBody' })}
                                    className="space-y-3"
                                >
                                    {[
                                        { id: 'PPL', name: 'Push-Pull-Legs', desc: '3-6 days/week, muscle-specific focus' },
                                        { id: 'UpperLower', name: 'Upper-Lower', desc: '4 days/week, frequency balanced' },
                                        { id: 'FullBody', name: 'Full Body', desc: '2-3 days/week, maximum efficiency' }
                                    ].map((split) => (
                                        <div key={split.id}>
                                            <RadioGroupItem value={split.id} id={split.id} className="peer sr-only" />
                                            <Label
                                                htmlFor={split.id}
                                                className="flex flex-col rounded-xl border-2 border-muted bg-white/5 p-4 hover:bg-white/10 peer-data-[state=checked]:border-primary"
                                            >
                                                <span className="font-bold">{split.name}</span>
                                                <span className="text-xs text-muted-foreground">{split.desc}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-4 text-center animate-slide-up">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold">You're Ready!</h3>
                                <p className="text-sm text-muted-foreground">
                                    We've set up your profile and imported 30 science-based exercises into your library.
                                    Remember the 2-Week rule: keep your reps consistent for 2 weeks before moving up!
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            {step > 1 && (
                                <Button variant="glass" className="flex-1" onClick={handleBack} disabled={loading}>
                                    <ChevronLeft className="mr-2 w-4 h-4" /> Back
                                </Button>
                            )}
                            {step < 5 ? (
                                <Button
                                    className="flex-1 gradient-red glow-red border-none"
                                    onClick={handleNext}
                                    disabled={!formData.name && step === 1}
                                >
                                    Next <ChevronRight className="ml-2 w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 gradient-red glow-red border-none"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? 'Setting up...' : 'Get Started'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Onboarding;
