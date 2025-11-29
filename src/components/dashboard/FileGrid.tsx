import { useState } from "react";
import { FileIcon, Folder, MoreVertical, Download, Trash2, Share2, Eye, Edit, Copy, FolderInput, ArrowUpDown, WifiOff, Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";
import FilePreviewDialog from "./FilePreviewDialog";
import { RenameDialog } from "./RenameDialog";
import { MoveDialog } from "./MoveDialog";
import { saveFileOffline, removeOfflineFile, getOfflineFile } from "@/lib/offlineStorage";

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
  is_offline: boolean;
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
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const logAudit = async (fileId: string, action: string) => {
    try {
      await supabase.from("file_audit_logs").insert({
        file_id: fileId,
        action,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Failed to log audit:", error);
    }
  };

  const handleDownload = async (file: File) => {
    try {
      await logAudit(file.id, "download");
      
      const { data, error } = await supabase.storage
        .from("user-files")
        .download(file.storage_path);

      if (error) throw error;

      // Create blob with correct MIME type
      const blob = new Blob([data], { type: file.file_type });
      const url = URL.createObjectURL(blob);
      
      // Create download link with proper headers
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.setAttribute("type", file.file_type);
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (error: any) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (fileId: string, storagePath: string) => {
    try {
      await logAudit(fileId, "delete");
      
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
      await logAudit(file.id, "share");
      
      // Set expiration to 1 day from now when enabling sharing
      const shareExpiresAt = !file.is_shareable 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      const { error } = await supabase
        .from("files")
        .update({ 
          is_shareable: !file.is_shareable,
          share_expires_at: shareExpiresAt
        })
        .eq("id", file.id);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${file.shareable_token}`;
      
      if (!file.is_shareable) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied! Expires in 24 hours.");
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

  const handleToggleOffline = async (file: File) => {
    try {
      const isCurrentlyOffline = file.is_offline;
      
      if (!isCurrentlyOffline) {
        // Download and cache the file
        const { data, error } = await supabase.storage
          .from("user-files")
          .download(file.storage_path);

        if (error) throw error;

        await saveFileOffline(file.id, file.name, data, file.file_type, file.file_size);
        
        toast.success("File saved for offline access");
      } else {
        // Remove from offline cache
        await removeOfflineFile(file.id);
        toast.success("File removed from offline storage");
      }

      // Update database
      const { error } = await supabase
        .from("files")
        .update({ is_offline: !isCurrentlyOffline })
        .eq("id", file.id);

      if (error) throw error;

      onFileDeleted();
    } catch (error: any) {
      toast.error("Failed to update offline status");
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

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "size":
        comparison = a.file_size - b.file_size;
        break;
      case "type":
        comparison = a.file_type.localeCompare(b.file_type);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const allItems = [
    ...folders.map(f => ({ ...f, type: "folder" as const })),
    ...sortedFiles.map(f => ({ ...f, type: "file" as const }))
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
        </h2>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
              className="p-4 hover:shadow-md transition-all group relative"
              draggable
              onDragStart={() => handleDragStart(item.id)}
            >
              {item.is_offline && (
                <div className="absolute top-2 right-2 p-1 bg-primary/10 rounded-full">
                  <WifiOff className="h-3 w-3 text-primary" />
                </div>
              )}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleOffline(item)}>
                      {item.is_offline ? (
                        <>
                          <Wifi className="mr-2 h-4 w-4" />
                          Remove from Offline
                        </>
                      ) : (
                        <>
                          <WifiOff className="mr-2 h-4 w-4" />
                          Save for Offline
                        </>
                      )}
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
