import { useState } from "react";
import { FileIcon, Folder, MoreVertical, Download, Trash2, Share2, Eye, Edit, Copy, FolderInput } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";
import FilePreviewDialog from "./FilePreviewDialog";
import { RenameDialog } from "./RenameDialog";
import { MoveDialog } from "./MoveDialog";

interface File {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  is_shareable: boolean;
  shareable_token: string;
  folder_id: string | null;
}

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface FileGridProps {
  files: File[];
  folders: Folder[];
  isLoading: boolean;
  onFolderClick: (folderId: string) => void;
  onFileDeleted: () => void;
  onFolderDeleted: () => void;
}

const FileGrid = ({
  files,
  folders,
  isLoading,
  onFolderClick,
  onFileDeleted,
  onFolderDeleted,
}: FileGridProps) => {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: "file" | "folder" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: "file" | "folder"; folderId: string | null } | null>(null);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from("user-files")
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (error: any) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (fileId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast.success("File deleted successfully");
      onFileDeleted();
    } catch (error: any) {
      toast.error("Failed to delete file");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;

      toast.success("Folder deleted successfully");
      onFolderDeleted();
    } catch (error: any) {
      toast.error("Failed to delete folder");
    }
  };

  const handleShare = async (file: File) => {
    try {
      const { error } = await supabase
        .from("files")
        .update({ is_shareable: !file.is_shareable })
        .eq("id", file.id);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${file.shareable_token}`;
      
      if (!file.is_shareable) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      } else {
        toast.success("File sharing disabled");
      }
      
      onFileDeleted();
    } catch (error: any) {
      toast.error("Failed to update sharing settings");
    }
  };

  const handleDuplicate = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Download the file first
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("user-files")
        .download(file.storage_path);

      if (downloadError) throw downloadError;

      // Generate new filename
      const nameParts = file.name.split(".");
      const ext = nameParts.pop();
      const baseName = nameParts.join(".");
      const newName = `${baseName} (copy).${ext}`;
      const newPath = `${user.id}/${Date.now()}_${newName}`;

      // Upload the duplicate
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(newPath, fileData);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase.from("files").insert({
        name: newName,
        file_type: file.file_type,
        file_size: file.file_size,
        storage_path: newPath,
        user_id: user.id,
        folder_id: file.folder_id,
      });

      if (dbError) throw dbError;

      toast.success("File duplicated successfully");
      onFileDeleted();
    } catch (error: any) {
      toast.error("Failed to duplicate file");
    }
  };

  const handleDragStart = (fileId: string) => {
    setDraggedFile(fileId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnFolder = async (folderId: string) => {
    if (!draggedFile) return;

    try {
      const { error } = await supabase
        .from("files")
        .update({ folder_id: folderId })
        .eq("id", draggedFile);

      if (error) throw error;

      toast.success("File moved successfully");
      onFileDeleted();
    } catch (error: any) {
      toast.error("Failed to move file");
    } finally {
      setDraggedFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4 h-48 animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  const allItems = [
    ...folders.map(f => ({ ...f, type: "folder" as const })),
    ...files.map(f => ({ ...f, type: "file" as const }))
  ];

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12">
        <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No files or folders yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload files or create folders to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allItems.map((item) =>
          item.type === "folder" ? (
            <Card
              key={item.id}
              className="p-4 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => onFolderClick(item.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                handleDropOnFolder(item.id);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Folder className="h-6 w-6 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameItem({ id: item.id, name: item.name, type: "folder" });
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(item.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium truncate mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.created_at), "MMM d, yyyy")}
              </p>
            </Card>
          ) : (
            <Card
              key={item.id}
              className="p-4 hover:shadow-md transition-all group"
              draggable
              onDragStart={() => handleDragStart(item.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-secondary rounded-lg">
                  <FileIcon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPreviewFile(item)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(item)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRenameItem({ id: item.id, name: item.name, type: "file" })}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setMoveItem({ id: item.id, name: item.name, type: "file", folderId: item.folder_id })}
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(item)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      {item.is_shareable ? "Disable" : "Enable"} Sharing
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(item.id, item.storage_path)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium truncate mb-1">{item.name}</h3>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>{formatBytes(item.file_size)}</p>
                <p>{format(new Date(item.created_at), "MMM d, yyyy")}</p>
              </div>
            </Card>
          )
        )}
      </div>

      {previewFile && (
        <FilePreviewDialog
          file={previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
        />
      )}

      {renameItem && (
        <RenameDialog
          open={!!renameItem}
          onOpenChange={(open) => !open && setRenameItem(null)}
          itemId={renameItem.id}
          currentName={renameItem.name}
          type={renameItem.type}
          onSuccess={() => {
            setRenameItem(null);
            if (renameItem.type === "file") {
              onFileDeleted();
            } else {
              onFolderDeleted();
            }
          }}
        />
      )}

      {moveItem && (
        <MoveDialog
          open={!!moveItem}
          onOpenChange={(open) => !open && setMoveItem(null)}
          itemId={moveItem.id}
          itemName={moveItem.name}
          type={moveItem.type}
          currentFolderId={moveItem.folderId}
          onSuccess={() => {
            setMoveItem(null);
            if (moveItem.type === "file") {
              onFileDeleted();
            } else {
              onFolderDeleted();
            }
          }}
        />
      )}
    </>
  );
};

export default FileGrid;
