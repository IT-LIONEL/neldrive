import { useState } from "react";
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
import { Share2, Copy, Eye, EyeOff, Shield, Clock, Link } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ShareFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  isShareable: boolean;
  shareableToken: string;
  onSuccess: () => void;
}

// Hash function for password
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "neldrive_share_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const ShareFolderDialog = ({
  open,
  onOpenChange,
  folderId,
  folderName,
  isShareable,
  shareableToken,
  onSuccess,
}: ShareFolderDialogProps) => {
  const [enableSharing, setEnableSharing] = useState(isShareable);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  const shareUrl = `${window.location.origin}/shared-folder/${shareableToken}`;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let passwordHash = null;
      if (enableSharing && usePassword && password) {
        passwordHash = await hashPassword(password);
      }

      const shareExpiresAt = enableSharing 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("folders")
        .update({
          is_shareable: enableSharing,
          share_expires_at: shareExpiresAt,
          share_password_hash: passwordHash,
        })
        .eq("id", folderId);

      if (error) throw error;

      if (enableSharing) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(`Share link copied! Expires in ${expirationDays} days.`);
      } else {
        toast.success("Folder sharing disabled");
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to update sharing settings");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/30 bg-card/95 backdrop-blur-xl font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Share2 className="h-5 w-5" />
            share --folder "{folderName}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            // Configure sharing options for this folder
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable Sharing Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <Link className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Enable Sharing</p>
                <p className="text-xs text-muted-foreground">Allow access via link</p>
              </div>
            </div>
            <Switch
              checked={enableSharing}
              onCheckedChange={setEnableSharing}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {enableSharing && (
            <>
              {/* Share Link */}
              <div className="space-y-2">
                <Label className="text-xs text-primary uppercase">Share_Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-muted/50 border-border/50 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Password Protection Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-sm">Password Protection</p>
                    <p className="text-xs text-muted-foreground">Require password to access</p>
                  </div>
                </div>
                <Switch
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                  className="data-[state=checked]:bg-accent"
                />
              </div>

              {/* Password Input */}
              {usePassword && (
                <div className="space-y-2">
                  <Label htmlFor="share-password" className="text-xs text-accent uppercase">
                    Set_Password
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                    <Input
                      id="share-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter share password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pl-10 pr-10 font-mono bg-muted/50 border-accent/30 focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Expiration */}
              <div className="space-y-2">
                <Label className="text-xs text-primary uppercase flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Link_Expiration
                </Label>
                <div className="flex gap-2">
                  {[1, 7, 30].map((days) => (
                    <Button
                      key={days}
                      variant={expirationDays === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpirationDays(days)}
                      className={expirationDays === days 
                        ? "bg-primary hover:bg-primary/90" 
                        : "border-border/50 hover:bg-primary/10"
                      }
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
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
            onClick={handleSave}
            disabled={isLoading || (enableSharing && usePassword && !password)}
            className="font-mono bg-primary hover:bg-primary/90 hover:shadow-glow"
          >
            {isLoading ? "Processing..." : enableSharing ? "share --enable" : "share --disable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
