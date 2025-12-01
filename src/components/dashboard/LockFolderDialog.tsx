import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Unlock, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LockFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  isLocked: boolean;
  onSuccess: () => void;
}

// Simple hash function for password (in production, use bcrypt on server)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "neltech_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const LockFolderDialog = ({
  open,
  onOpenChange,
  folderId,
  folderName,
  isLocked,
  onSuccess,
}: LockFolderDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLock = async () => {
    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setIsLoading(true);
    try {
      const passwordHash = await hashPassword(password);
      
      const { error } = await supabase
        .from("folders")
        .update({ 
          is_locked: true, 
          password_hash: passwordHash 
        })
        .eq("id", folderId);

      if (error) throw error;

      toast.success("Folder locked successfully!");
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to lock folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("folders")
        .update({ 
          is_locked: false, 
          password_hash: null 
        })
        .eq("id", folderId);

      if (error) throw error;

      toast.success("Folder unlocked!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock folder");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/30 bg-card/95 backdrop-blur-xl font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            {isLocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            {isLocked ? "unlock" : "lock"} --folder "{folderName}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isLocked 
              ? "// Remove password protection from this folder"
              : "// Set a password to protect this folder"
            }
          </DialogDescription>
        </DialogHeader>

        {!isLocked ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lock-password" className="text-xs text-primary uppercase">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  id="lock-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-lock-password" className="text-xs text-primary uppercase">
                Confirm_Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  id="confirm-lock-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pl-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              // Warning: If you forget the password, you'll need to remove the lock from settings
            </p>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              // This will remove password protection. Anyone with access to your account can view the folder.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono border-border/50"
          >
            cancel
          </Button>
          <Button
            onClick={isLocked ? handleUnlock : handleLock}
            disabled={isLoading}
            className="font-mono bg-primary hover:bg-primary/90 hover:shadow-glow"
          >
            {isLoading ? "Processing..." : isLocked ? "unlock --remove" : "lock --set"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
