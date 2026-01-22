import { useState, useEffect } from 'react';
import { X, Smartphone, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const IOS_INSTALL_KEY = 'pro-lifts-ios-install-shown';

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

      if (isIOS && !isStandalone && !isPWA && !hasSeenPrompt) {
        setIsVisible(true);
      }
    };

    const timer = setTimeout(checkIOS, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(IOS_INSTALL_KEY, 'true');
  };

  const handleRemindLater = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 px-4 pointer-events-none">
      <div
        className={cn(
          "glass gradient-radial border border-white/10 rounded-2xl p-6 max-w-sm w-full",
          "pointer-events-auto animate-in slide-in-from-bottom-4 duration-300"
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
            Already Installed
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
