import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Cloud, Copy, Check } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  const generatePassword = (email: string) => {
    const emailPrefix = email.split("@")[0].substring(0, 3);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${emailPrefix}${randomPart}`;
  };

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired reset link");
        navigate("/auth");
      } else if (session.user?.email) {
        setUserEmail(session.user.email);
        const newPassword = generatePassword(session.user.email);
        setGeneratedPassword(newPassword);
      }
    });
  }, [navigate]);

  const handleSetPassword = async () => {
    if (!generatedPassword) {
      toast.error("No password generated");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: generatedPassword,
        data: {
          needs_password_change: true
        }
      });

      if (error) throw error;

      setPasswordSet(true);
      toast.success("Password updated successfully! Please save your new password.");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center">
              <Cloud className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Reset Password</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter your new password below
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A secure password has been generated for your account: <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
            
            {generatedPassword && (
              <div className="space-y-2">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-lg font-mono font-semibold flex-1">
                      {generatedPassword}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyPassword}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  This password contains part of your email for easy management. Make sure to save it securely.
                </p>
              </div>
            )}

            {!passwordSet ? (
              <Button 
                onClick={handleSetPassword} 
                className="w-full" 
                disabled={isLoading || !generatedPassword}
              >
                {isLoading ? "Setting Password..." : "Confirm & Set Password"}
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full"
              >
                Continue to Sign In
              </Button>
            )}
            
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
