import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Unlock, Eye, EyeOff, Shield, Timer, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LockFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  isLocked: boolean;
  onSuccess: () => void;
  autoLockMinutes?: number | null;
  passwordHash?: string | null;
}

// Simple hash function for password (in production, use bcrypt on server)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "neldrive_salt_2024");
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
  autoLockMinutes: initialAutoLock,
  passwordHash: folderPasswordHash,
}: LockFolderDialogProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoQuarantine, setAutoQuarantine] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  
  // For unlock verification
  const [folderPassword, setFolderPassword] = useState("");
  const [accountPassword, setAccountPassword] = useState("");

  useEffect(() => {
    if (initialAutoLock) {
      setAutoQuarantine(true);
      setAutoLockMinutes(initialAutoLock);
    } else {
      setAutoQuarantine(false);
      setAutoLockMinutes(5);
    }
  }, [initialAutoLock, open]);

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
          password_hash: passwordHash,
          auto_lock_minutes: autoQuarantine ? autoLockMinutes : null
        } as any)
        .eq("id", folderId);

      if (error) throw error;

      toast.success(autoQuarantine 
        ? `Folder locked with ${autoLockMinutes}-min auto-quarantine!` 
        : "Folder locked successfully!");
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
    if (!folderPassword) {
      toast.error("Folder password is required");
      return;
    }
    if (!accountPassword) {
      toast.error("Account password is required");
      return;
    }

    setIsLoading(true);
    try {
      // Verify folder password
      const folderHash = await hashPassword(folderPassword);
      if (folderHash !== folderPasswordHash) {
        toast.error("Incorrect folder password");
        setIsLoading(false);
        return;
      }

      // Verify account password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Unable to verify account");
        setIsLoading(false);
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: accountPassword,
      });

      if (authError) {
        toast.error("Incorrect account password");
        setIsLoading(false);
        return;
      }

      // Both passwords verified, proceed to unlock
      const { error } = await supabase
        .from("folders")
        .update({ 
          is_locked: false, 
          password_hash: null,
          auto_lock_minutes: null
        } as any)
        .eq("id", folderId);

      if (error) throw error;

      toast.success("Folder lock removed!");
      setFolderPassword("");
      setAccountPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to unlock folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAutoLock = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("folders")
        .update({ 
          auto_lock_minutes: autoQuarantine ? autoLockMinutes : null
        } as any)
        .eq("id", folderId);

      if (error) throw error;

      toast.success(autoQuarantine 
        ? `Auto-quarantine set to ${autoLockMinutes} minutes` 
        : "Auto-quarantine disabled");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
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
              ? "// Remove password protection or update auto-quarantine"
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

            {/* Auto-Quarantine Section */}
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <Label htmlFor="auto-quarantine" className="text-sm font-semibold text-destructive">
                    Auto-Quarantine
                  </Label>
                </div>
                <Switch
                  id="auto-quarantine"
                  checked={autoQuarantine}
                  onCheckedChange={setAutoQuarantine}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                // Automatically re-lock folder after inactivity
              </p>
              
              {autoQuarantine && (
                <div className="flex items-center gap-3 mt-2">
                  <Timer className="h-4 w-4 text-destructive" />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={autoLockMinutes}
                      onChange={(e) => setAutoLockMinutes(parseInt(e.target.value) || 5)}
                      className="w-20 h-9 font-mono bg-muted/50 border-destructive/30 focus:border-destructive"
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              // Warning: If you forget the password, you'll need to remove the lock from settings
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              // Removing lock requires both folder password and account password
            </p>

            {/* Folder Password */}
            <div className="space-y-2">
              <Label htmlFor="folder-password-unlock" className="text-xs text-destructive uppercase">
                Folder_Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                <Input
                  id="folder-password-unlock"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={folderPassword}
                  onChange={(e) => setFolderPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 font-mono bg-muted/50 border-destructive/30 focus:border-destructive"
                />
              </div>
            </div>

            {/* Account Password */}
            <div className="space-y-2">
              <Label htmlFor="account-password-unlock" className="text-xs text-destructive uppercase">
                Account_Password
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                <Input
                  id="account-password-unlock"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 font-mono bg-muted/50 border-destructive/30 focus:border-destructive"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Update Auto-Quarantine Section for locked folders */}
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  <Label htmlFor="auto-quarantine-update" className="text-sm font-semibold text-destructive">
                    Auto-Quarantine
                  </Label>
                </div>
                <Switch
                  id="auto-quarantine-update"
                  checked={autoQuarantine}
                  onCheckedChange={setAutoQuarantine}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                // {autoQuarantine ? `Re-locks after ${autoLockMinutes} min of inactivity` : "Stays unlocked until manual lock"}
              </p>
              
              {autoQuarantine && (
                <div className="flex items-center gap-3 mt-2">
                  <Timer className="h-4 w-4 text-destructive" />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={autoLockMinutes}
                      onChange={(e) => setAutoLockMinutes(parseInt(e.target.value) || 5)}
                      className="w-20 h-9 font-mono bg-muted/50 border-destructive/30 focus:border-destructive"
                    />
                    <span className="text-xs text-muted-foreground">minutes</span>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdateAutoLock}
                disabled={isLoading}
                className="w-full mt-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <Timer className="mr-2 h-4 w-4" />
                {isLoading ? "Updating..." : "update --auto-lock"}
              </Button>
            </div>
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