import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Download, Smartphone, Monitor, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-primary rounded-2xl flex items-center justify-center">
              <Cloud className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Install NelDrive</CardTitle>
            <CardDescription className="text-base mt-2">
              Get the full app experience on your device
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">App Installed!</h3>
                <p className="text-muted-foreground">
                  NelDrive is now installed on your device. You can access it anytime from your home screen.
                </p>
              </div>
              <Button onClick={() => navigate("/dashboard")} size="lg" className="w-full">
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center space-y-3">
                    <Smartphone className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="font-semibold">Mobile Install</h3>
                    <p className="text-sm text-muted-foreground">
                      Works on iPhone and Android. Install directly from your browser.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center space-y-3">
                    <Monitor className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="font-semibold">Desktop Install</h3>
                    <p className="text-sm text-muted-foreground">
                      Install on Windows, Mac, or Linux. Works like a native app.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Features:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Works offline - access your files anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Fast loading - opens instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Native app experience - no browser clutter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Auto-updates - always get the latest features</span>
                  </li>
                </ul>
              </div>

              {deferredPrompt ? (
                <Button onClick={handleInstallClick} size="lg" className="w-full">
                  <Download className="mr-2 h-5 w-5" />
                  Install App Now
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <h4 className="font-semibold mb-2">How to Install:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>iPhone/iPad:</strong> Tap the Share button → "Add to Home Screen"</p>
                      <p><strong>Android:</strong> Tap browser menu → "Add to Home Screen" or "Install App"</p>
                      <p><strong>Desktop:</strong> Look for the install icon in your browser's address bar</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard")} variant="outline" size="lg" className="w-full">
                    Continue in Browser
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
