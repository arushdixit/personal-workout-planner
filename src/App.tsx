import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import { UserProvider, useUser } from "./context/UserContext";
import Onboarding from "./components/Onboarding";
import ProfilePicker from "./components/ProfilePicker";
import { useState } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  const { currentUser, allUsers, loading, switchUser, refreshUsers } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="gradient-red w-12 h-12 rounded-full animate-pulse-glow" />
      </div>
    );
  }

  if (showOnboarding || allUsers.length === 0) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          await refreshUsers();
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <ProfilePicker
        users={allUsers}
        onSelect={switchUser}
        onNew={() => setShowOnboarding(true)}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
