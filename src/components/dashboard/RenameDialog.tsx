import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  currentName: string;
  type: "file" | "folder";
  onSuccess: () => void;
}

export const RenameDialog = ({
  open,
  onOpenChange,
  itemId,
  currentName,
  type,
  onSuccess,
}: RenameDialogProps) => {
  const [newName, setNewName] = useState(currentName);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRename = async () => {
    if (!newName.trim() || newName === currentName) return;

    setIsRenaming(true);
    try {
      const table = type === "file" ? "files" : "folders";
      const { error } = await supabase
        .from(table)
        .update({ name: newName })
        .eq("id", itemId);

      if (error) throw error;

      toast.success(`${type === "file" ? "File" : "Folder"} renamed successfully`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(`Failed to rename ${type}`);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {type === "file" ? "File" : "Folder"}</DialogTitle>
          <DialogDescription>
            Enter a new name for this {type}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || !newName.trim() || newName === currentName}
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
