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
import { Shield, Lock, Mail, Terminal } from "lucide-react";

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
      const { error } = await supabase.auth.updateUser({
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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

  return (
    <>
      <AlertDialog open={showPasswordChangePrompt} onOpenChange={setShowPasswordChangePrompt}>
        <AlertDialogContent className="border-primary/30 bg-card/95 font-mono">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              passwd --change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              // Update your generated password to something memorable
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs text-primary uppercase">New_Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="h-11 font-mono bg-muted/50 border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs text-primary uppercase">Confirm_Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                className="h-11 font-mono bg-muted/50 border-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipPasswordChange} className="font-mono">
              skip --later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={changingPassword} className="font-mono bg-primary">
              {changingPassword ? "Processing..." : "execute --change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden scanline">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-primary blur-xl opacity-50" />
                <img 
                  src="/icon-192x192.png" 
                  alt="NelTech Logo" 
                  className="relative h-20 w-20 rounded-2xl shadow-glow border border-primary/30"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-mono text-primary text-glow tracking-tight">NelTech</h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">// secure_cloud_storage v2.0</p>
          </div>

          <Card className="border-primary/20 shadow-glow backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-semibold font-mono text-primary flex items-center justify-center gap-2">
                <Terminal className="h-5 w-5" />
                access_terminal
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                // authenticate to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {showResetPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-xs font-mono text-primary uppercase">Email_Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-mono bg-primary hover:bg-primary/90 hover:shadow-glow" disabled={isLoading}>
                    {isLoading ? "Sending..." : "send --reset-link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full font-mono hover:text-primary"
                    onClick={() => setShowResetPassword(false)}
                  >
                    ← back --login
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 bg-muted/50 border border-primary/20">
                    <TabsTrigger value="signin" className="h-9 font-mono text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow">
                      login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="h-9 font-mono text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow">
                      register
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-xs font-mono text-primary uppercase">Email_Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-xs font-mono text-primary uppercase">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 font-mono bg-primary hover:bg-primary/90 hover:shadow-glow" disabled={isLoading}>
                        {isLoading ? "Authenticating..." : "login --execute"}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full text-xs font-mono text-muted-foreground hover:text-primary"
                        onClick={() => setShowResetPassword(true)}
                      >
                        forgot --password ?
                      </Button>
                    </form>
                  </TabsContent>
                
                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-xs font-mono text-primary uppercase">Email_Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-xs font-mono text-primary uppercase">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-11 font-mono bg-primary hover:bg-primary/90 hover:shadow-glow" disabled={isLoading}>
                        {isLoading ? "Creating..." : "register --new-user"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground font-mono">
            <Shield className="h-4 w-4 text-primary" />
            <span>// 256-bit SSL encrypted</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
