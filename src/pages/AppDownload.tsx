import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Apple, Download, CloudOff, Zap, Shield, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const GITHUB_REPO = "aby-developer/neldrive-78526942";
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

const AppDownload = () => {
  const platforms = [
    {
      name: "Windows",
      icon: Monitor,
      description: "Windows 10/11 (64-bit)",
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/NelDrive-Setup.exe`,
      fileName: "NelDrive-Setup.exe",
    },
    {
      name: "macOS",
      icon: Apple,
      description: "macOS 10.15+ (Intel & Apple Silicon)",
      downloadUrl: `https://github.com/${GITHUB_REPO}/releases/latest/download/NelDrive.dmg`,
      fileName: "NelDrive.dmg",
    },
    {
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
    // Open download link in new tab
    window.open(platform.downloadUrl, "_blank");
    toast.success(`Downloading ${platform.fileName}...`);
  };

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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Download NelDrive Desktop
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Get the full desktop experience with offline access, faster uploads, and native system integration.
        </p>
      </section>

      {/* Download Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {platforms.map((platform) => (
            <Card key={platform.name} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <platform.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{platform.name}</CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={() => handleDownload(platform)}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <p className="text-xs text-muted-foreground mt-3">{platform.fileName}</p>
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
