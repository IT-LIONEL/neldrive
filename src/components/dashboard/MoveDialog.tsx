import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFolders } from "@/hooks/useFolders";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  type: "file" | "folder";
  currentFolderId: string | null;
  onSuccess: () => void;
}

export const MoveDialog = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  type,
  currentFolderId,
  onSuccess,
}: MoveDialogProps) => {
  const { folders } = useFolders(null, "");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) {
      onOpenChange(false);
      return;
    }

    setIsMoving(true);
    try {
      const table = type === "file" ? "files" : "folders";
      const { error } = await supabase
        .from(table)
        .update({ [type === "file" ? "folder_id" : "parent_id"]: selectedFolderId })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(`${type === "file" ? "File" : "Folder"} moved successfully`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to move ${type}`);
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move "{itemName}"</DialogTitle>
          <DialogDescription>
            Select a destination folder.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-2">
            <Button
              variant={selectedFolderId === null ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedFolderId(null)}
            >
              <Home className="mr-2 h-4 w-4" />
              My Drive (Root)
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedFolderId(folder.id)}
                disabled={type === "folder" && folder.id === itemId}
              >
                <Folder className="mr-2 h-4 w-4" />
                {folder.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
