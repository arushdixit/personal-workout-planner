import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Library from '@/pages/Library';
import Routines from '@/pages/Routines';
import TodayPage from '@/pages/Today';
import ProgressChart from '@/components/ProgressChart';
import WorkoutSession from '@/components/WorkoutSession';
import { User, Trophy, Target, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUser } from '@/context/UserContext';
import { useWorkout } from '@/context/WorkoutContext';

const Index = () => {
  const { currentUser, allUsers, switchUser, logout } = useUser();
  const { activeSession } = useWorkout();
  const [activeTab, setActiveTab] = useState('today');
  const [workoutRoutineId, setWorkoutRoutineId] = useState<string | null>(null);

  const handleStartWorkout = () => {
    setWorkoutRoutineId(activeSession?.routineId || 'today');
  };

  const handleViewExercise = (exerciseId: number) => {
    // This will open the exercise detail view
    // For now, just log it
    console.log('View exercise:', exerciseId);
  };

  const handleCloseWorkout = () => {
    setWorkoutRoutineId(null);
  };

  // Show workout session if active
  if (workoutRoutineId) {
    return (
      <WorkoutSession
        routineId={workoutRoutineId}
        onClose={handleCloseWorkout}
      />
    );
  }

  return (
    <div className="dark min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6 pb-32 space-y-6">
        {activeTab === 'today' && (
          <TodayPage
            onStartWorkout={handleStartWorkout}
            onViewExercise={handleViewExercise}
          />
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
