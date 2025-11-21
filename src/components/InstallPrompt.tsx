import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    const isDismissed = localStorage.getItem("installPromptDismissed");

    if (isInstalled || isDismissed) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt anyway for manual installation instructions
    setTimeout(() => {
      if (!isInstalled && !isDismissed) {
        setShowPrompt(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } else {
      // Navigate to install page with instructions
      navigate("/install");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <AlertDescription className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <span>
              <strong>Install NelTech</strong> for a better experience! Works on phones, tablets, and computers.
            </span>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleInstallClick}>
            Install
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};
