import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TodayPage from '@/pages/Today';
import WorkoutSession from '@/components/WorkoutSession';
import WorkoutCountdown from '@/components/WorkoutCountdown';
import { MinimizedRestTimer } from '@/components/RestTimer';
import GlobalAICoach from '@/components/GlobalAICoach';
import { useUser } from '@/context/UserContext';
import { useWorkout } from '@/context/WorkoutContext';
import { cn } from '@/lib/utils';

// Lazy load non-critical tabs
const Library = lazy(() => import('@/pages/Library'));
const Routines = lazy(() => import('@/pages/Routines'));
const Progress = lazy(() => import('@/pages/Progress'));
const Profile = lazy(() => import('@/components/Profile'));

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
      <main className={cn(
        "flex-1 overflow-y-auto custom-scrollbar",
        (activeTab === 'routines' && showBuilder) || activeTab === 'workout' ? "" : "px-4 pt-6 space-y-6"
      )}>
        {activeTab === 'today' && (
          <TodayPage
            onStartWorkout={handleStartWorkout}
            onViewExercise={handleViewExercise}
            onNavigateToRoutines={handleNavigateToRoutines}
          />
        )}
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 gradient-red rounded-full animate-pulse-glow" />
          </div>
        }>
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
              onOpenBuilder={handleNavigateToRoutines}
              onCloseEditor={handleCloseRoutineEditor}
            />
          )}

          {activeTab === 'progress' && <Progress />}

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
        </Suspense>
      </main>
      {activeTab !== 'workout' && (
        <div className="relative flex-shrink-0 border-t border-white/10 bg-background/80 backdrop-blur-xl z-[60]">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      )}

      <MinimizedRestTimer />
      <GlobalAICoach />

      {showCountdown && (
        <WorkoutCountdown onComplete={handleCountdownComplete} />
      )}
    </div>
  );
};

export default Index;
