import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import WorkoutHero from '@/components/WorkoutHero';
import ExercisePreviewCard from '@/components/ExercisePreviewCard';
import ProgressChart from '@/components/ProgressChart';
import Library from '@/pages/Library';
import Routines from '@/pages/Routines';
import { User, Trophy, Target, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import { db, Exercise } from '@/lib/db';

const SPLITS: Record<string, string[]> = {
  PPL: ['Push', 'Pull', 'Legs'],
  UpperLower: ['Upper', 'Lower'],
  FullBody: ['Full Body'],
};

const MUSCLE_MAPPING: Record<string, string[]> = {
  Push: ['chest', 'shoulders', 'triceps'],
  Pull: ['back', 'lats', 'biceps', 'rear_delts', 'traps'],
  Legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  Upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  Lower: ['quads', 'hamstrings', 'glutes', 'calves'],
  'Full Body': ['chest', 'back', 'shoulders', 'quads', 'core'],
};

const Index = () => {
  const { currentUser, allUsers, switchUser, logout } = useUser();
  const [activeTab, setActiveTab] = useState('today');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const splitDays = SPLITS[currentUser?.activeSplit || 'PPL'];
  const todayIndex = new Date().getDay() % splitDays.length;
  const todayType = splitDays[todayIndex];

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      try {
        const all = await db.exercises.toArray();
        const targetMuscles = MUSCLE_MAPPING[todayType] || [];
        const filtered = all.filter(ex =>
          ex.primaryMuscles.some(m => targetMuscles.includes(m))
        );
        setExercises(filtered.slice(0, 6)); // Limit to 6 for today
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, [todayType, currentUser?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="dark min-h-[100dvh] bg-background flex flex-col overflow-hidden">

      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6 pb-32 space-y-6">
        {activeTab === 'today' && (
          <>
            <WorkoutHero
              greeting={getGreeting()}
              workoutName={`${todayType} Day`}
              exercises={exercises.length}
              estimatedTime={exercises.length * 8}
              onStart={() => console.log('Start workout')}
            />

            <div className="space-y-3">
              <h2 className="text-lg font-semibold animate-slide-up">Today's Exercises</h2>
              {exercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.05}s` }}
                >
                  <ExercisePreviewCard
                    name={ex.name}
                    sets={3}
                    reps="8-12"
                    primaryMuscle={ex.primaryMuscles[0] || 'Muscle'}
                    isNext={index === 0}
                  />
                </div>
              ))}
              {exercises.length === 0 && (
                <p className="text-center py-10 text-muted-foreground italic">
                  No exercises found for {todayType}. Complete onboarding to seed the library!
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === 'library' && <Library />}

        {activeTab === 'routines' && <Routines />}

        {activeTab === 'progress' && (
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

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-slide-up">
            <div className="glass-card p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-red flex items-center justify-center glow-red">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold">{currentUser?.name}</h2>
              <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest">
                {currentUser?.activeSplit} Athlete
              </p>
            </div>

            <div className="space-y-3 pb-24">
              <Label className="text-xs uppercase text-muted-foreground px-1">Switch Profile</Label>
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (u.id) {
                      switchUser(u.id);
                      setActiveTab('today');
                    }
                  }}
                  className={`w-full glass-card p-4 flex items-center gap-4 ${u.id === currentUser?.id ? 'border-primary/30' : ''}`}
                >
                  <UserCircle className={`w-5 h-5 ${u.id === currentUser?.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium">{u.name} {u.id === currentUser?.id && '(Active)'}</span>
                </button>
              ))}
              <Button
                variant="destructive"
                className="w-full bg-red-900/20 text-red-500 border-red-900/50"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout Session
              </Button>
            </div>
          </div>
        )}
      </main>

      <div className="flex-shrink-0">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
