import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { UserProvider, useUser } from "./context/UserContext";
import { WorkoutProvider } from "./context/WorkoutContext";
import AuthScreen from "./components/auth/AuthScreen";
import { IOSInstallPrompt } from "./components/iOSInstallPrompt";

const queryClient = new QueryClient();

const AppContent = () => {
  const { currentUser, allUsers, loading, switchUser, refreshUsers, isAuthenticated } = useUser();

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="gradient-red w-12 h-12 rounded-full animate-pulse-glow" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <AuthScreen />;
  }

  return (
    <WorkoutProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WorkoutProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <UserProvider>
          <Toaster />
          <Sonner />
          <IOSInstallPrompt />
          <AppContent />
        </UserProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
