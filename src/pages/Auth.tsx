import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Shield, Lock, Mail, Terminal, Zap, Cpu, Database } from "lucide-react";
const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPasswordChangePrompt, setShowPasswordChangePrompt] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.user?.user_metadata?.needs_password_change) {
        setShowPasswordChangePrompt(true);
        toast.success("Signed in successfully!");
      } else {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: newPassword,
        data: {
          needs_password_change: false
        }
      });
      if (error) throw error;
      toast.success("Password changed successfully!");
      setShowPasswordChangePrompt(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };
  const handleSkipPasswordChange = async () => {
    try {
      await supabase.auth.updateUser({
        data: {
          needs_password_change: false
        }
      });
      setShowPasswordChangePrompt(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to skip");
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };
  return <>
      <AlertDialog open={showPasswordChangePrompt} onOpenChange={setShowPasswordChangePrompt}>
        <AlertDialogContent className="border-primary/30 bg-card/95 font-mono backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary text-glow">
              <Lock className="h-5 w-5" />
              passwd --change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              // Update your generated password to something memorable
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs text-primary uppercase tracking-wider">New_Password</Label>
              <Input id="new-password" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} className="h-11 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow transition-all" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs text-primary uppercase tracking-wider">Confirm_Password</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} className="h-11 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow transition-all" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipPasswordChange} className="font-mono border-muted-foreground/30 hover:border-primary/50">
              skip --later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={changingPassword} className="font-mono bg-primary hover:shadow-glow transition-all">
              {changingPassword ? "Processing..." : "execute --change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
        {/* Animated cyber grid background */}
        <div className="absolute inset-0 cyber-grid opacity-30" />
        
        {/* Scanlines overlay */}
        <div className="absolute inset-0 scanline pointer-events-none" />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-[hsl(var(--cyber-pink))]/15 blur-3xl animate-float" style={{
          animationDelay: '-2s'
        }} />
          <div className="absolute top-1/2 left-1/3 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{
          animationDelay: '-4s'
        }} />
          <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-[hsl(var(--cyber-purple))]/10 blur-3xl animate-float" style={{
          animationDelay: '-3s'
        }} />
        </div>

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-primary/60 font-mono text-xs">
          <Cpu className="h-4 w-4 animate-pulse" />
          <span>SYS_ONLINE</span>
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2 text-[hsl(var(--cyber-pink))]/60 font-mono text-xs">
          <span>SECURE_MODE</span>
          <Zap className="h-4 w-4 animate-pulse" />
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-accent/60 font-mono text-xs">
          <Database className="h-4 w-4" />
          <span>DB_CONNECTED</span>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-primary blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse-glow" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-[hsl(var(--cyber-pink))] to-accent opacity-50 blur-lg" />
                <img src="/icon-192x192.png" alt="NelTech Logo" className="relative h-24 w-24 rounded-2xl shadow-glow border-2 border-primary/50 hover:scale-105 transition-transform" />
              </div>
            </div>
            <h1 className="text-4xl font-bold font-mono text-primary text-glow tracking-tight">
              NelTech
            </h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm flex items-center justify-center gap-2">
              <span className="text-[hsl(var(--cyber-pink))]">//</span>
              secure_cloud_storage
              <span className="text-accent">v2.0</span>
            </p>
          </div>

          <Card className="border-primary/30 shadow-glow backdrop-blur-xl bg-card/90 relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--cyber-pink))]/5" />
            
            <CardHeader className="text-center pb-2 relative">
              <CardTitle className="text-xl font-semibold font-mono text-primary flex items-center justify-center gap-2 text-glow">
                <Terminal className="h-5 w-5" />
                access_terminal
              </CardTitle>
              <CardDescription className="font-mono text-xs text-muted-foreground">
                <span className="text-accent">//</span> authenticate to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 relative">
              {showResetPassword ? <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-xs font-mono text-primary uppercase tracking-wider">Email_Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-colors group-focus-within:text-accent" />
                      <Input id="reset-email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-accent focus:shadow-glow-cyan transition-all" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-mono gradient-primary hover:shadow-glow transition-all text-primary-foreground font-semibold" disabled={isLoading}>
                    {isLoading ? "Sending..." : "send --reset-link"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full font-mono hover:text-primary hover:bg-primary/10 transition-all" onClick={() => setShowResetPassword(false)}>
                    ← back --login
                  </Button>
                </form> : <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50 border border-primary/20 rounded-lg">
                    <TabsTrigger value="signin" className="h-10 font-mono text-xs data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow rounded-md transition-all">
                      login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="h-10 font-mono text-xs data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow rounded-md transition-all">
                      register
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-xs font-mono text-primary uppercase tracking-wider">Email_Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-colors group-focus-within:text-accent" />
                          <Input id="signin-email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-accent focus:shadow-glow-cyan transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-xs font-mono text-primary uppercase tracking-wider">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-colors group-focus-within:text-[hsl(var(--cyber-pink))]" />
                          <Input id="signin-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-[hsl(var(--cyber-pink))] focus:shadow-glow-pink transition-all" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 font-mono gradient-primary hover:shadow-glow transition-all text-primary-foreground font-semibold" disabled={isLoading}>
                        {isLoading ? <span className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 animate-spin" />
                            Authenticating...
                          </span> : "login --execute"}
                      </Button>
                      <Button type="button" variant="link" className="w-full text-xs font-mono text-muted-foreground hover:text-[hsl(var(--cyber-pink))] transition-colors" onClick={() => setShowResetPassword(true)}>
                        forgot --password ?
                      </Button>
                    </form>
                  </TabsContent>
                
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-xs font-mono text-primary uppercase tracking-wider">Email_Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-colors group-focus-within:text-accent" />
                          <Input id="signup-email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-accent focus:shadow-glow-cyan transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-xs font-mono text-primary uppercase tracking-wider">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary transition-colors group-focus-within:text-[hsl(var(--cyber-pink))]" />
                          <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="h-12 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-[hsl(var(--cyber-pink))] focus:shadow-glow-pink transition-all" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 font-mono gradient-primary hover:shadow-glow transition-all text-primary-foreground font-semibold" disabled={isLoading}>
                        {isLoading ? <span className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 animate-spin" />
                            Creating...
                          </span> : "register --new-user"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>}
            </CardContent>
          </Card>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-3 mt-6 text-xs text-muted-foreground font-mono">
            <div className="flex items-center gap-1 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-lg">@NELTECH GROUP</span>
            </div>
            <span className="text-accent">|</span>
            <div className="flex items-center gap-1 text-[hsl(var(--cyber-pink))]">
              <Lock className="h-3 w-3" />
              <span>E2E</span>
            </div>
            <span className="text-accent">|</span>
            <div className="flex items-center gap-1 text-accent">
              <Zap className="h-3 w-3" />
              <span>SECURE</span>
            </div>
          </div>
        </div>
      </div>
    </>;
};
export default Auth;