import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import WorkoutHero from "@/components/WorkoutHero";
import ExercisePreviewCard from "@/components/ExercisePreviewCard";
import ActiveExercise from "@/components/ActiveExercise";
import ProgressChart from "@/components/ProgressChart";
import { User, Settings, Trophy, Target, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { exercisesDb, workoutsDb, Workout, Exercise, WorkoutExercise } from "@/lib/db";
import { getNextWorkoutType, getExercisesForType } from "@/lib/workout-logic";

const Index = () => {
  const { currentUser, allUsers, switchUser, logout } = useUser();
  const [activeTab, setActiveTab] = useState("today");
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [todayWorkout, setTodayWorkout] = useState<Partial<Workout> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodayWorkout = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // Find last workout to determine next
        const lastWorkouts = await workoutsDb.find({
          selector: { userId: currentUser._id },
          sort: [{ date: 'desc' }],
          limit: 1
        });

        const lastWorkout = lastWorkouts.docs[0] as Workout | undefined;
        const nextType = getNextWorkoutType(lastWorkout?.splitType, currentUser.activeSplit || 'PPL');

        const allExercisesResult = await exercisesDb.allDocs({ include_docs: true });
        const allExercises = allExercisesResult.rows.map(r => r.doc as Exercise);

        const filteredExercises = getExercisesForType(allExercises, nextType);

        setTodayWorkout({
          userId: currentUser._id,
          date: new Date().toISOString(),
          splitType: nextType,
          exercises: filteredExercises.map(ex => ({
            exerciseId: ex._id,
            name: ex.name,
            sets: [
              { reps: 10, weight: 0, unit: 'kg', completed: false },
              { reps: 10, weight: 0, unit: 'kg', completed: false },
              { reps: 10, weight: 0, unit: 'kg', completed: false },
            ]
          }))
        });
      } catch (err) {
        console.error("Failed to load workout:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTodayWorkout();
  }, [currentUser]);

  const handleSetComplete = (exerciseId: string, setId: number, weight: number, reps: number) => {
    if (!todayWorkout) return;

    const updatedExercises = todayWorkout.exercises?.map(ex => {
      if (ex.exerciseId === exerciseId) {
        const updatedSets = [...ex.sets];
        updatedSets[setId] = { ...updatedSets[setId], weight, reps, completed: true };
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    setTodayWorkout({ ...todayWorkout, exercises: updatedExercises });
  };

  const saveWorkout = async () => {
    if (!todayWorkout) return;
    try {
      await workoutsDb.post({
        ...todayWorkout,
        _id: `workout_${Date.now()}`,
        completed: true,
        duration: 45, // Mock duration for now
      } as Workout);
      setIsWorkoutActive(false);
      // Refresh logic or redirect
    } catch (err) {
      console.error("Failed to save workout:", err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" /></div>;

  if (isWorkoutActive && todayWorkout?.exercises) {
    const currentEx = todayWorkout.exercises[currentExerciseIndex];
    // Need to fetch full exercise details for anatomy diagram
    // For now mocking or fetching on the fly
    return (
      <div className="dark">
        <ActiveExercise
          exercise={{
            id: currentEx.exerciseId,
            name: currentEx.name,
            primaryMuscles: [], // Should fetch from library
            secondaryMuscles: [],
            sets: currentEx.sets.map((s, i) => ({ id: i, ...s }))
          }}
          currentIndex={currentExerciseIndex}
          totalExercises={todayWorkout.exercises.length}
          onPrevious={() => setCurrentExerciseIndex((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentExerciseIndex((prev) => Math.min(todayWorkout.exercises!.length - 1, prev + 1))}
          onSetComplete={handleSetComplete}
        />
        <div className="fixed bottom-6 left-4 right-4 z-50 flex gap-3">
          <Button variant="glass" className="flex-1" onClick={() => setIsWorkoutActive(false)}>Cancel</Button>
          <Button variant="gradient" className="flex-1" onClick={saveWorkout}>Finish Workout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold gradient-red-text tracking-tighter">PRO-LIFTS</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground bg-white/5 px-2 py-1 rounded-full uppercase tracking-wider">
              {currentUser?.name}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setActiveTab("profile")}>
              <UserCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {activeTab === "today" && (
          <>
            <WorkoutHero
              greeting={getGreeting()}
              workoutName={todayWorkout?.splitType || "Rest Day"}
              exercises={todayWorkout?.exercises?.length || 0}
              estimatedTime={todayWorkout?.exercises?.length ? todayWorkout.exercises.length * 10 : 0}
              onStart={() => setIsWorkoutActive(true)}
            />

            <div className="space-y-3">
              <h2 className="text-lg font-semibold animate-slide-up">Today's Exercises</h2>
              {todayWorkout?.exercises?.map((exercise, index) => (
                <div key={exercise.exerciseId} className="animate-slide-up" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
                  <ExercisePreviewCard
                    name={exercise.name}
                    sets={exercise.sets.length}
                    reps="10" // Default for now
                    primaryMuscle="Target"
                    isNext={index === 0}
                  />
                </div>
              ))}
              {!todayWorkout?.exercises?.length && (
                <p className="text-center py-10 text-muted-foreground italic">No exercises found for this split. Add some to your library!</p>
              )}
            </div>
          </>
        )}

        {activeTab === "plans" && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold">Training Splits</h2>
            <div className="grid gap-4">
              {['PPL', 'UpperLower', 'FullBody'].map((split) => (
                <Card key={split} className={`glass p-5 border-white/10 ${currentUser?.activeSplit === split ? 'border-primary/50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{split}</h3>
                      <p className="text-sm text-muted-foreground">Select this as your active rotation</p>
                    </div>
                    {currentUser?.activeSplit === split ? (
                      <span className="text-xs font-bold text-primary uppercase">Active</span>
                    ) : (
                      <Button variant="glass" size="sm">Select</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold">Progress & Insights</h2>
            <ProgressChart data={[]} title="Recent Performance" unit="kg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">Personal Best</p>
              </div>
              <div className="glass-card p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">0</p>
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
              <h2 className="text-xl font-bold">{currentUser?.name}</h2>
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">{currentUser?.activeSplit} Athlete</p>
            </div>

            <div className="space-y-3">
              <div className="grid gap-2">
                <Label className="text-xs uppercase text-muted-foreground px-1">Switch Profile</Label>
                {allUsers.map(u => (
                  <button key={u._id} onClick={() => switchUser(u._id)} className={`w-full glass-card p-4 flex items-center gap-4 ${u._id === currentUser?._id ? 'border-primary/30' : ''}`}>
                    <UserCircle className={`w-5 h-5 ${u._id === currentUser?._id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">{u.name} {u._id === currentUser?._id && '(Active)'}</span>
                  </button>
                ))}
              </div>
              <Button variant="destructive" className="w-full bg-red-900/20 text-red-500 border-red-900/50" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout Session
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
