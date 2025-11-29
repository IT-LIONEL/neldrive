import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Apple, Download, CloudOff, Zap, Shield, Github, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const GITHUB_REPO = "aby-developer/neldrive-78526942";
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

type Platform = "windows" | "macos" | "linux" | "unknown";

const detectOS = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";
  
  if (userAgent.includes("win") || platform.includes("win")) {
    return "windows";
  }
  if (userAgent.includes("mac") || platform.includes("mac")) {
    return "macos";
  }
  if (userAgent.includes("linux") || platform.includes("linux")) {
    return "linux";
  }
  return "unknown";
};

const AppDownload = () => {
  const [detectedOS, setDetectedOS] = useState<Platform>("unknown");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const platforms = [
    {
      id: "windows" as Platform,
      name: "Windows",
      icon: Monitor,
      description: "Windows 10/11 (64-bit)",
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/NelDrive-Setup.exe`,
      fileName: "NelDrive-Setup.exe",
    },
    {
      id: "macos" as Platform,
      name: "macOS",
      icon: Apple,
      description: "macOS 10.15+ (Intel & Apple Silicon)",
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/NelDrive.dmg`,
      fileName: "NelDrive.dmg",
    },
    {
      id: "linux" as Platform,
      name: "Linux",
      icon: Monitor,
      description: "Ubuntu, Debian, Fedora",
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/NelDrive.AppImage`,
      fileName: "NelDrive.AppImage",
    },
  ];

  const features = [
    {
      icon: CloudOff,
      title: "Work Offline",
      description: "Access your files even without internet connection",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Native performance with instant file access",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your files are encrypted and stored safely",
    },
  ];

  const handleDownload = (platform: typeof platforms[0]) => {
    setDownloading(true);
    window.open(platform.downloadUrl, "_blank");
    toast.success(`Downloading ${platform.fileName}...`);
    setTimeout(() => setDownloading(false), 2000);
  };

  const currentPlatform = platforms.find(p => p.id === detectedOS) || platforms[0];
  const otherPlatforms = platforms.filter(p => p.id !== detectedOS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-lg">NelDrive</span>
          </Link>
          <div className="flex items-center gap-2">
            <a 
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon">
                <Github className="w-5 h-5" />
              </Button>
            </a>
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Auto-detected Download */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Download NelDrive Desktop
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Get the full desktop experience with offline access, faster uploads, and native system integration.
        </p>

        {/* Main Download Button for Detected OS */}
        <Card className="max-w-md mx-auto mb-8 border-primary/50 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Detected: {currentPlatform.name}</span>
            </div>
            <Button 
              size="lg" 
              className="w-full gap-2 text-lg py-6"
              onClick={() => handleDownload(currentPlatform)}
              disabled={downloading}
            >
              <Download className="w-5 h-5" />
              {downloading ? "Starting download..." : `Download for ${currentPlatform.name}`}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">{currentPlatform.fileName}</p>
          </CardContent>
        </Card>
      </section>

      {/* Other Platforms */}
      <section className="container mx-auto px-4 pb-16">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Not on {currentPlatform.name}? Download for other platforms:
        </p>
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {otherPlatforms.map((platform) => (
            <Card key={platform.name} className="relative overflow-hidden group hover:shadow-md transition-all duration-300 hover:border-primary/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <platform.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDownload(platform)}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* All releases link */}
        <div className="text-center mt-8">
          <a 
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View all releases on GitHub →
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-semibold text-center mb-8">Why use the desktop app?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Web App CTA */}
      <section className="container mx-auto px-4 pb-16 text-center">
        <Card className="max-w-xl mx-auto bg-muted/30">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Don't want to install? Use NelDrive directly in your browser.
            </p>
            <Link to="/auth">
              <Button variant="outline">Open Web App</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NelDrive. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default AppDownload;
