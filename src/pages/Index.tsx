import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import WorkoutHero from "@/components/WorkoutHero";
import ExercisePreviewCard from "@/components/ExercisePreviewCard";
import ActiveExercise from "@/components/ActiveExercise";
import ProgressChart from "@/components/ProgressChart";
import { User, Settings, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data
const todayExercises = [
  { id: "1", name: "Bench Press", sets: 4, reps: "8-10", primaryMuscle: "Chest" },
  { id: "2", name: "Incline Dumbbell Press", sets: 3, reps: "10-12", primaryMuscle: "Upper Chest" },
  { id: "3", name: "Cable Flyes", sets: 3, reps: "12-15", primaryMuscle: "Chest" },
  { id: "4", name: "Overhead Press", sets: 4, reps: "8-10", primaryMuscle: "Shoulders" },
  { id: "5", name: "Lateral Raises", sets: 3, reps: "12-15", primaryMuscle: "Side Delts" },
];

const activeExerciseData = {
  id: "1",
  name: "Bench Press",
  primaryMuscles: ["chest_left", "chest_right"],
  secondaryMuscles: ["shoulder_left", "shoulder_right", "tricep_left", "tricep_right"],
  sets: [
    { id: 1, weight: 80, reps: 10, completed: false },
    { id: 2, weight: 85, reps: 8, completed: false },
    { id: 3, weight: 85, reps: 8, completed: false },
    { id: 4, weight: 80, reps: 10, completed: false },
  ],
  warning: "Felt slight shoulder discomfort on last set",
};

const progressData = [
  { date: "Mon", value: 75, note: "Good form" },
  { date: "Wed", value: 77.5 },
  { date: "Fri", value: 80, note: "PR!" },
  { date: "Mon", value: 80 },
  { date: "Wed", value: 82.5, note: "Easy reps" },
  { date: "Fri", value: 85 },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercise, setExercise] = useState(activeExerciseData);

  const handleSetComplete = (exerciseId: string, setId: number, weight: number, reps: number) => {
    setExercise((prev) => ({
      ...prev,
      sets: prev.sets.map((s) =>
        s.id === setId ? { ...s, weight, reps, completed: true } : s
      ),
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isWorkoutActive) {
    return (
      <div className="dark">
        <ActiveExercise
          exercise={exercise}
          currentIndex={currentExerciseIndex}
          totalExercises={todayExercises.length}
          onPrevious={() => setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentExerciseIndex((prev) => Math.min(todayExercises.length - 1, prev + 1))}
          onSetComplete={handleSetComplete}
        />
        <div className="fixed bottom-6 left-4 right-4 z-50">
          <Button
            variant="glass"
            className="w-full"
            onClick={() => setIsWorkoutActive(false)}
          >
            End Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold gradient-red-text">PRO-LIFTS</h1>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {activeTab === "today" && (
          <>
            <WorkoutHero
              greeting={getGreeting()}
              workoutName="Push Day"
              exercises={todayExercises.length}
              estimatedTime={55}
              onStart={() => setIsWorkoutActive(true)}
            />

            <div className="space-y-3" style={{ animationDelay: "0.1s" }}>
              <h2 className="text-lg font-semibold animate-slide-up">Today's Exercises</h2>
              {todayExercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <ExercisePreviewCard
                    name={exercise.name}
                    sets={exercise.sets}
                    reps={exercise.reps}
                    primaryMuscle={exercise.primaryMuscle}
                    isNext={index === 0}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold">Workout Plans</h2>
            
            <div className="grid gap-4">
              {["Push", "Pull", "Legs", "Upper", "Lower"].map((day, i) => (
                <div
                  key={day}
                  className="glass-card p-5 flex items-center justify-between"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{day} Day</h3>
                    <p className="text-sm text-muted-foreground">
                      {4 + i} exercises · ~{45 + i * 5} min
                    </p>
                  </div>
                  <Button variant="gradient" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold">Progress & Insights</h2>
            
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {["Daily", "Weekly", "Monthly", "Custom"].map((filter) => (
                <Button
                  key={filter}
                  variant={filter === "Weekly" ? "gradient" : "glass"}
                  size="sm"
                >
                  {filter}
                </Button>
              ))}
            </div>
            
            <ProgressChart
              data={progressData}
              title="Bench Press Progression"
              unit="kg"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">85kg</p>
                <p className="text-xs text-muted-foreground">Personal Best</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Workouts This Month</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass-card p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-red flex items-center justify-center glow-red">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold">Athlete</h2>
              <p className="text-muted-foreground">Pro-Lifts Member</p>
            </div>
            
            <div className="space-y-3">
              {[
                { label: "Account Settings", icon: Settings },
                { label: "Workout History", icon: Trophy },
                { label: "Goals & Targets", icon: Target },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full glass-card p-4 flex items-center gap-4 hover:bg-white/10 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
