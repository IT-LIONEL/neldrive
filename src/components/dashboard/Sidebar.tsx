import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Folder, Plus, WifiOff } from "lucide-react";
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
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border shadow-sm">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Button
              variant={currentFolderId === null ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onFolderSelect(null)}
            >
              <Home className="mr-2 h-4 w-4" />
              My Drive
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => navigate("/offline-files")}
            >
              <WifiOff className="mr-2 h-4 w-4" />
              Offline Files
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateFolder}
                    disabled={isCreating || !newFolderName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground px-2 mb-2">
              Folders
            </h3>
            {folders?.map((folder) => (
              <Button
                key={folder.id}
                variant={currentFolderId === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => onFolderSelect(folder.id)}
              >
                <Folder className="mr-2 h-4 w-4" />
                {folder.name}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;
