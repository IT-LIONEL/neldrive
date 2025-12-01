import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Folder, Plus, WifiOff, ChevronRight, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFolders } from "@/hooks/useFolders";
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

interface SidebarProps {
  isOpen: boolean;
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreated: () => void;
}

const Sidebar = ({ isOpen, currentFolderId, onFolderSelect, onFolderCreated }: SidebarProps) => {
  const navigate = useNavigate();
  const { folders } = useFolders(null, "");
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card/50 backdrop-blur-sm border-r border-border/50">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Navigation
            </p>
            <Button
              variant={currentFolderId === null ? "default" : "ghost"}
              className={`w-full justify-start h-11 ${
                currentFolderId === null 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-primary/10"
              }`}
              onClick={() => onFolderSelect(null)}
            >
              <HardDrive className="mr-3 h-4 w-4" />
              My Drive
              {currentFolderId === null && <ChevronRight className="ml-auto h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-accent/20"
              onClick={() => navigate("/offline-files")}
            >
              <WifiOff className="mr-3 h-4 w-4" />
              Offline Files
            </Button>
          </div>

          {/* Create New */}
          <div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full justify-start h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5 text-primary" />
                    Create New Folder
                  </DialogTitle>
                  <DialogDescription>
                    Enter a name for your new folder.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      placeholder="My Folder"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFolder();
                        }
                      }}
                      className="h-11"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateFolder}
                    disabled={isCreating || !newFolderName.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isCreating ? "Creating..." : "Create Folder"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Folders List */}
          {folders && folders.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Folders
              </p>
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={currentFolderId === folder.id ? "secondary" : "ghost"}
                  className={`w-full justify-start h-10 ${
                    currentFolderId === folder.id 
                      ? "bg-secondary text-secondary-foreground" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onFolderSelect(folder.id)}
                >
                  <Folder className="mr-3 h-4 w-4 text-primary" />
                  <span className="truncate">{folder.name}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Storage Info */}
          <div className="mt-auto pt-4 border-t border-border/50">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">Storage</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/4 bg-gradient-to-r from-primary to-accent rounded-full" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">2.5 GB of 10 GB used</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
