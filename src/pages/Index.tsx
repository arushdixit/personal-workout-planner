import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import Library from '@/pages/Library';
import Routines from '@/pages/Routines';
import TodayPage from '@/pages/Today';
import ProgressChart from '@/components/ProgressChart';
import WorkoutSession from '@/components/WorkoutSession';
import WorkoutCountdown from '@/components/WorkoutCountdown';
import Profile from '@/components/Profile';
import { MinimizedRestTimer } from '@/components/RestTimer';
import { User, Trophy, Target, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { useWorkout } from '@/context/WorkoutContext';
import { cn } from '@/lib/utils';

const Index = () => {
  const { currentUser, allUsers, switchUser, logout } = useUser();
  const { activeSession } = useWorkout();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    searchParams.get('tab') || 'today'
  );
  const [showCountdown, setShowCountdown] = useState(false);
  const workoutId = searchParams.get('workoutId');
  const exerciseId = searchParams.get('exerciseId');
  const showBuilder = searchParams.get('builder') === 'true';

  // Only sync URL changes (browser back/forward) to activeTab state
  useEffect(() => {
    const tabFromURL = searchParams.get('tab') || 'today';
    setActiveTab(tabFromURL);
  }, [searchParams]);

  // Ensure exercise data is present even if user skips Library/Onboarding
  useEffect(() => {
    import('@/lib/exercemus').then(m => m.importExercemusData()).catch(console.error);
  }, []);

  // Update URL when activeTab changes from user interaction
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const tabFromURL = currentParams.get('tab');

    // Only update URL if activeTab differs from URL
    if (tabFromURL !== activeTab) {
      currentParams.set('tab', activeTab);

      // Clear tab-specific parameters when switching tabs
      if (activeTab !== 'workout') {
        currentParams.delete('workoutId');
      }
      if (activeTab !== 'library') {
        currentParams.delete('exerciseId');
        currentParams.delete('returnTab');
      }
      if (activeTab !== 'routines') {
        currentParams.delete('builder');
        currentParams.delete('routineId');
      }

      setSearchParams(currentParams);
    }
  }, [activeTab]);

  const handleStartWorkout = () => {
    setShowCountdown(true);
  };

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    const routineId = activeSession?.routineId || 'today';
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('tab', 'workout');
    currentParams.set('workoutId', routineId);
    setSearchParams(currentParams);
    setActiveTab('workout');
  }, [activeSession, searchParams, setSearchParams]);

  const handleViewExercise = (exerciseId: number, fromTab?: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    // Store the origin tab to restore on close
    if (fromTab) {
      currentParams.set('returnTab', fromTab);
    } else {
      currentParams.delete('returnTab');
    }
    currentParams.set('tab', 'library');
    currentParams.set('exerciseId', exerciseId.toString());
    setSearchParams(currentParams);
    setActiveTab('library');
  };

  const handleCloseWorkout = useCallback(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('tab', 'today');
    currentParams.delete('workoutId');
    setSearchParams(currentParams);
    setActiveTab('today');
  }, [searchParams, setSearchParams]);

  const handleNavigateToRoutines = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('tab', 'routines');
    currentParams.set('builder', 'true');
    setSearchParams(currentParams);
    setActiveTab('routines');
  };

  const handleViewRoutine = (routineId: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('tab', 'routines');
    currentParams.set('routineId', routineId);
    currentParams.set('builder', 'true');
    setSearchParams(currentParams);
    setActiveTab('routines');
  };

  const handleCloseRoutineEditor = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('routineId');
    currentParams.delete('builder');
    currentParams.set('tab', 'routines');
    setSearchParams(currentParams);
  };

  // Reset showRoutineBuilder when switching away from routines tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Tab change is handled by useEffect above
  };

  return (
    <div className="dark h-[100dvh] bg-background flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-6 space-y-6">
        {activeTab === 'today' && (
          <TodayPage
            onStartWorkout={handleStartWorkout}
            onViewExercise={handleViewExercise}
            onNavigateToRoutines={handleNavigateToRoutines}
          />
        )}

        {activeTab === 'library' && (
          <Library
            selectedExerciseId={exerciseId}
            onOpenExercise={(id: number) => {
              const currentParams = new URLSearchParams(searchParams.toString());
              currentParams.set('tab', 'library');
              currentParams.set('exerciseId', id.toString());
              setSearchParams(currentParams);
            }}
            onCloseExercise={() => {
              const currentParams = new URLSearchParams(searchParams.toString());
              const returnTab = currentParams.get('returnTab');
              currentParams.delete('exerciseId');
              currentParams.delete('returnTab');

              // Use requestAnimationFrame to defer navigation slightly
              // This allows the modal close animation to start before tab changes
              requestAnimationFrame(() => {
                // Immediately update activeTab to prevent flickering
                if (returnTab) {
                  setActiveTab(returnTab);
                  currentParams.set('tab', returnTab);
                } else {
                  // If no returnTab, stay on library but close the detail
                  currentParams.set('tab', 'library');
                }

                setSearchParams(currentParams);
              });
            }}
          />
        )}

        {activeTab === 'routines' && (
          <Routines
            showBuilderOnLoad={showBuilder}
            selectedRoutineId={searchParams.get('routineId')}
            onViewRoutine={handleViewRoutine}
            onCloseEditor={handleCloseRoutineEditor}
          />
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6 animate-slide-up">
            <h2 className="text-xl font-bold">Progress & Insights</h2>
            <ProgressChart data={[]} title="Recent Performance" unit={currentUser?.unitPreference || 'kg'} />
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

        {activeTab === 'workout' && workoutId && (
          <div className="min-h-[100dvh] flex flex-col">
            <WorkoutSession
              key="active-workout-session"
              routineId={workoutId}
              onClose={handleCloseWorkout}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <Profile currentUser={currentUser} />
        )}
      </main>
      {activeTab !== 'workout' && (
        <div className="relative flex-shrink-0 border-t border-white/10 bg-background/80 backdrop-blur-xl z-[60]">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}

      <MinimizedRestTimer />

      {showCountdown && (
        <WorkoutCountdown onComplete={handleCountdownComplete} />
      )}
    </div>
  );
};

export default Index;
