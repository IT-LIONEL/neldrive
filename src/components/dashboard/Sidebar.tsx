import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Folder, Plus, WifiOff, ChevronRight, HardDrive, Database, Lock, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFolders } from "@/hooks/useFolders";
import { useStorage, formatStorageSize } from "@/hooks/useStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UnlockFolderDialog } from "./UnlockFolderDialog";

interface SidebarProps {
  isOpen: boolean;
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreated: () => void;
}

interface FolderToUnlock {
  id: string;
  name: string;
  password_hash: string;
}

const Sidebar = ({ isOpen, currentFolderId, onFolderSelect, onFolderCreated }: SidebarProps) => {
  const navigate = useNavigate();
  const { folders } = useFolders(null, "");
  const { usedBytes, totalBytes, percentage, isLoading: storageLoading } = useStorage();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderToUnlock, setFolderToUnlock] = useState<FolderToUnlock | null>(null);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("folders").insert({
        name: newFolderName,
        user_id: user.id,
        parent_id: currentFolderId,
      });

      if (error) throw error;

      setNewFolderName("");
      setDialogOpen(false);
      onFolderCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create folder");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFolderClick = (folder: any) => {
    // If folder is locked, show unlock dialog
    if (folder.is_locked && folder.password_hash) {
      setFolderToUnlock({
        id: folder.id,
        name: folder.name,
        password_hash: folder.password_hash,
      });
    } else {
      // Folder is not locked, navigate directly
      onFolderSelect(folder.id);
    }
  };

  const handleUnlockSuccess = () => {
    if (folderToUnlock) {
      onFolderSelect(folderToUnlock.id);
      setFolderToUnlock(null);
    }
  };

  if (!isOpen) return null;

  const getStorageColor = () => {
    if (percentage > 90) return "from-destructive to-destructive/70";
    if (percentage > 70) return "from-amber-500 to-amber-400";
    return "from-primary to-accent";
  };

  return (
    <>
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card/50 backdrop-blur-sm border-r border-border/50 scanline">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider px-3 mb-3 text-glow">
                // Navigation
              </p>
              <Button
                variant={currentFolderId === null ? "default" : "ghost"}
                className={`w-full justify-start h-11 font-mono ${
                  currentFolderId === null 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "hover:bg-primary/10 hover:text-primary"
                }`}
                onClick={() => onFolderSelect(null)}
              >
                <HardDrive className="mr-3 h-4 w-4" />
                My_Drive
                {currentFolderId === null && <ChevronRight className="ml-auto h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-11 font-mono hover:bg-accent/10 hover:text-accent"
                onClick={() => navigate("/offline-files")}
              >
                <WifiOff className="mr-3 h-4 w-4" />
                Offline_Files
              </Button>
            </div>

            {/* Create New */}
            <div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full justify-start h-11 font-mono bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all"
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    + New_Folder
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-primary/30 bg-card/95 backdrop-blur-xl border-glow">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-mono text-primary">
                      <Folder className="h-5 w-5" />
                      mkdir /new_folder
                    </DialogTitle>
                    <DialogDescription className="font-mono text-muted-foreground">
                      Enter folder name:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name" className="font-mono text-xs text-primary">
                        FOLDER_NAME
                      </Label>
                      <Input
                        id="folder-name"
                        placeholder="my_folder"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateFolder();
                          }
                        }}
                        className="h-11 font-mono bg-background/50 border-primary/30 focus:border-primary focus:shadow-glow"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateFolder}
                      disabled={isCreating || !newFolderName.trim()}
                      className="font-mono bg-primary hover:bg-primary/90 hover:shadow-glow"
                    >
                      {isCreating ? "Creating..." : "Execute"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Folders List */}
            {folders && folders.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider px-3 mb-3 text-glow">
                  // Folders
                </p>
                {folders.map((folder: any) => (
                  <Button
                    key={folder.id}
                    variant={currentFolderId === folder.id ? "secondary" : "ghost"}
                    className={`w-full justify-start h-10 font-mono ${
                      folder.is_locked 
                        ? "border border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10" 
                        : ""
                    } ${
                      currentFolderId === folder.id 
                        ? "bg-secondary text-secondary-foreground border border-primary/30" 
                        : "hover:bg-muted/50 hover:text-primary"
                    }`}
                    onClick={() => handleFolderClick(folder)}
                  >
                    {folder.is_locked ? (
                      <ShieldAlert className="mr-3 h-4 w-4 text-destructive" />
                    ) : (
                      <Folder className="mr-3 h-4 w-4 text-primary" />
                    )}
                    <span className="truncate">{folder.name}</span>
                    {folder.is_locked && (
                      <Lock className="ml-auto h-3 w-3 text-destructive" />
                    )}
                  </Button>
                ))}
              </div>
            )}

            {/* Storage Info */}
            <div className="mt-auto pt-4 border-t border-primary/20">
              <div className="px-3 py-3 bg-muted/30 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-primary" />
                  <p className="text-xs font-mono text-primary uppercase">Storage_Usage</p>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                  <div 
                    className={`h-full bg-gradient-to-r ${getStorageColor()} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs font-mono text-muted-foreground">
                    {storageLoading ? "Loading..." : formatStorageSize(usedBytes)}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {formatStorageSize(totalBytes)}
                  </p>
                </div>
                <p className="text-xs font-mono text-primary/70 mt-1">
                  {percentage.toFixed(1)}% used
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Unlock Folder Dialog */}
      {folderToUnlock && (
        <UnlockFolderDialog
          open={!!folderToUnlock}
          onOpenChange={(open) => !open && setFolderToUnlock(null)}
          folderName={folderToUnlock.name}
          passwordHash={folderToUnlock.password_hash}
          onSuccess={handleUnlockSuccess}
        />
      )}
    </>
  );
};

export default Sidebar;
