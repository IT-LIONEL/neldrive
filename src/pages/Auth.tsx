import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Loader2, Terminal, User } from "lucide-react";
const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
        }
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created successfully!");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background font-mono relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,136,0.03)_2px,rgba(0,255,136,0.03)_4px)]" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Terminal Header */}
        <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-t-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-primary/20">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-primary/70" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-xs text-primary">neldrive@secure:~/{isLogin ? "login" : "register"}</span>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-6 space-y-6">
            {/* ASCII Logo */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/20 border border-primary/30 mb-4">
                <Terminal className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-primary text-glow mb-1">
                NelDrive
              </h1>
              <p className="text-xs text-muted-foreground">
                // {isLogin ? "authenticate user session" : "create new user account"}
              </p>
            </div>

            {/* Status Line */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs text-primary">
                <span className="text-muted-foreground">$</span> system --status
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                → secure_connection: <span className="text-primary">active</span>
              </p>
              <p className="text-xs text-muted-foreground">
                → encryption: <span className="text-primary">AES-256</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-primary uppercase">
                  user_email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input id="email" type="email" placeholder="user@domain.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11 bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow rounded-lg font-mono text-sm" disabled={loading} />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-primary uppercase">
                  password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10 h-11 bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow rounded-lg font-mono text-sm" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              {isLogin && <div className="flex justify-end">
                  <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:text-primary/80 transition-colors" disabled={loading}>
                    reset --password
                  </button>
                </div>}

              {/* Submit Button */}
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-mono shadow-glow transition-all" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>
                    {isLogin ? "auth --login" : "auth --register"}
                  </>}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">// or</span>
              </div>
            </div>

            {/* Toggle Auth Mode */}
            <p className="text-center text-xs text-muted-foreground">
              {isLogin ? "// no account?" : "// have account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:text-primary/80 transition-colors" disabled={loading}>
                {isLogin ? "register --new" : "login --existing"}
              </button>
            </p>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="bg-primary/10 border border-t-0 border-primary/30 rounded-b-xl px-4 py-2">
          <p className="text-[10px] text-muted-foreground text-center bg-sidebar-primary">
            <span className="text-primary">►</span> ​DEVELOPED BY NELTECH DEV GROUP      
          </p>
        </div>
      </div>
    </div>;
};
export default Auth;