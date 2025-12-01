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
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface UnlockFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  passwordHash: string;
  onSuccess: () => void;
}

// Same hash function as in LockFolderDialog
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "neltech_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const UnlockFolderDialog = ({
  open,
  onOpenChange,
  folderName,
  passwordHash,
  onSuccess,
}: UnlockFolderDialogProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = async () => {
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setIsLoading(true);
    try {
      const inputHash = await hashPassword(password);
      
      if (inputHash === passwordHash) {
        toast.success("Access granted!");
        setPassword("");
        setAttempts(0);
        onOpenChange(false);
        onSuccess();
      } else {
        setAttempts(prev => prev + 1);
        toast.error(`Access denied! ${3 - attempts - 1} attempts remaining`);
        
        if (attempts >= 2) {
          toast.error("Too many failed attempts. Please try again later.");
          onOpenChange(false);
          setAttempts(0);
        }
      }
    } catch (error: any) {
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-destructive/30 bg-card/95 backdrop-blur-xl font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            access --locked "{folderName}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            // This folder is password protected. Enter password to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive text-sm mb-2">
              <Lock className="h-4 w-4" />
              <span className="font-semibold">LOCKED FOLDER</span>
            </div>
            <p className="text-xs text-muted-foreground">
              // {3 - attempts} attempts remaining
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unlock-password" className="text-xs text-primary uppercase">
              Enter_Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                id="unlock-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnlock();
                  }
                }}
                className="h-11 pl-10 pr-10 font-mono bg-muted/50 border-primary/30 focus:border-primary focus:shadow-glow"
                autoFocus
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono border-border/50"
          >
            cancel
          </Button>
          <Button
            onClick={handleUnlock}
            disabled={isLoading || !password}
            className="font-mono bg-primary hover:bg-primary/90 hover:shadow-glow"
          >
            {isLoading ? "Verifying..." : "access --unlock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
