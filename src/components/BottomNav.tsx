import { Home, Dumbbell, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 py-2 px-4 transition-all duration-300 relative",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {active && (
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full gradient-red" />
    )}
    <Icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: "today", icon: Home, label: "Today" },
    { id: "library", icon: Dumbbell, label: "Library" },
    { id: "progress", icon: TrendingUp, label: "Progress" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
      {/* Safe area padding for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
