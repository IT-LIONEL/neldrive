import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, X, Terminal } from "lucide-react";
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
      navigate("/install");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <Alert className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl font-mono">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <AlertDescription className="text-foreground text-sm">
            <span className="text-primary font-semibold">$ install NelTech</span>
            <span className="text-muted-foreground"> // better experience on all devices</span>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleInstallClick}
            className="bg-primary hover:bg-primary/90 shadow-glow font-mono"
          >
            <Download className="mr-2 h-4 w-4" />
            install --now
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDismiss}
            className="h-8 w-8 hover:bg-muted/50 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};
