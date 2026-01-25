import { useState, useEffect } from 'react';
import { X, Smartphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const IOS_INSTALL_KEY = 'pro-lifts-ios-install-shown';
const IOS_INSTALL_REMIND_KEY = 'pro-lifts-ios-install-remind-later';
const REMIND_LATER_DAYS = 7; // Show again after 7 days if reminded later

export function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
      const isStandalone = navigatorWithStandalone.standalone === true;
      const hasSeenPrompt = localStorage.getItem(IOS_INSTALL_KEY) === 'true';
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;

      // Check if user clicked "Remind Me Later" and if enough time has passed
      const remindLaterTimestamp = localStorage.getItem(IOS_INSTALL_REMIND_KEY);
      let shouldShowAfterReminder = true;

      if (remindLaterTimestamp) {
        const daysSinceReminder = (Date.now() - parseInt(remindLaterTimestamp)) / (1000 * 60 * 60 * 24);
        shouldShowAfterReminder = daysSinceReminder >= REMIND_LATER_DAYS;
      }

      // Only show if: iOS, not standalone, not PWA, hasn't permanently dismissed, and enough time passed since remind-later
      if (isIOS && !isStandalone && !isPWA && !hasSeenPrompt && shouldShowAfterReminder) {
        setIsVisible(true);
      }
    };

    // Show after 3 seconds to avoid overwhelming on first load
    const timer = setTimeout(checkIOS, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Mark as permanently dismissed
    localStorage.setItem(IOS_INSTALL_KEY, 'true');
    // Clear any remind-later timestamp
    localStorage.removeItem(IOS_INSTALL_REMIND_KEY);
  };

  const handleRemindLater = () => {
    setIsVisible(false);
    // Store current timestamp for remind-later
    localStorage.setItem(IOS_INSTALL_REMIND_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={handleRemindLater}
      />

      {/* Prompt Card */}
      <div
        className={cn(
          "glass gradient-radial border border-white/10 rounded-2xl p-6 max-w-sm w-full",
          "pointer-events-auto animate-in zoom-in-95 duration-300 relative"
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-red flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Install Pro-Lifts</h3>
              <p className="text-white/60 text-sm">Add to Home Screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">1</div>
            <span>Tap the Share button</span>
            <Share2 className="w-4 h-4 ml-auto text-white/40" />
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">2</div>
            <span>Select "Add to Home Screen"</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition-colors"
          >
            Don't Show Again
          </button>
          <button
            onClick={handleRemindLater}
            className="flex-1 py-2.5 rounded-xl gradient-red text-white text-sm font-medium transition-opacity hover:opacity-90"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
