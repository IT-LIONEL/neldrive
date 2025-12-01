import { useState } from "react";
import { FileIcon, Folder, MoreVertical, Download, Trash2, Share2, Eye, Edit, Copy, FolderInput, ArrowUpDown, WifiOff, Wifi, Lock, Unlock, ShieldAlert, Link } from "lucide-react";
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
import { LockFolderDialog } from "./LockFolderDialog";
import { UnlockFolderDialog } from "./UnlockFolderDialog";
import { ShareFolderDialog } from "./ShareFolderDialog";
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
  is_locked?: boolean;
  password_hash?: string | null;
  is_shareable?: boolean;
  shareable_token?: string;
  share_expires_at?: string | null;
  share_password_hash?: string | null;
  auto_lock_minutes?: number | null;
}

interface FileGridProps {
  files: File[];
  folders: Folder[];
  isLoading: boolean;
  onFolderClick: (folderId: string) => void;
  onFileDeleted: () => void;
  onFolderDeleted: () => void;
  onFolderUnlocked?: (folderId: string, autoLockMinutes: number | null) => void;
  isFolderUnlocked?: (folderId: string) => boolean;
  currentFolderLocked?: boolean;
  currentFolderPasswordHash?: string | null;
  currentFolderName?: string;
  currentFolderAutoLock?: number | null;
}

const FileGrid = ({
  files,
  folders,
  isLoading,
  onFolderClick,
  onFileDeleted,
  onFolderDeleted,
  onFolderUnlocked,
  isFolderUnlocked,
  currentFolderLocked,
  currentFolderPasswordHash,
  currentFolderName,
  currentFolderAutoLock,
}: FileGridProps) => {
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: "file" | "folder" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ id: string; name: string; type: "file" | "folder"; folderId: string | null } | null>(null);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [lockFolder, setLockFolder] = useState<{ id: string; name: string; isLocked: boolean; autoLockMinutes?: number | null } | null>(null);
  const [unlockFolder, setUnlockFolder] = useState<{ id: string; name: string; passwordHash: string; autoLockMinutes?: number | null } | null>(null);
  const [pendingFolderId, setPendingFolderId] = useState<string | null>(null);
  const [shareFolder, setShareFolder] = useState<{ id: string; name: string; isShareable: boolean; shareableToken: string } | null>(null);
  const [fileUnlockDialog, setFileUnlockDialog] = useState<{ file: File; action: 'preview' | 'download' } | null>(null);

  // Check if file action requires unlock
  const requiresUnlock = (file: File) => {
    if (!currentFolderLocked) return false;
    return true;
  };

  const handleFileAction = (file: File, action: 'preview' | 'download') => {
    if (requiresUnlock(file)) {
      setFileUnlockDialog({ file, action });
    } else {
      if (action === 'preview') {
        setPreviewFile(file);
      } else {
        handleDownload(file);
      }
    }
  };

  const handleFileUnlockSuccess = () => {
    if (fileUnlockDialog) {
      // Notify parent about folder unlock
      if (onFolderUnlocked && fileUnlockDialog.file.folder_id) {
        onFolderUnlocked(fileUnlockDialog.file.folder_id, currentFolderAutoLock || null);
      }
      
      // Perform the action
      if (fileUnlockDialog.action === 'preview') {
        setPreviewFile(fileUnlockDialog.file);
      } else {
        handleDownload(fileUnlockDialog.file);
      }
      setFileUnlockDialog(null);
    }
  };

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
          <Card key={i} className="p-4 h-40 animate-pulse bg-muted/50 border-border/30 rounded-xl" />
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
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">No files or folders yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Upload files or create folders to get started with your cloud storage
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[130px] h-9 bg-muted/50 border-border/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50">
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-muted/50 border-border/50 hover:bg-primary/10"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 font-mono">
        {allItems.map((item) =>
          item.type === "folder" ? (
            <Card
              key={item.id}
              className={`p-4 hover:shadow-lg transition-all cursor-pointer group rounded-xl border-border/50 bg-card/80 backdrop-blur-sm relative ${
                item.is_locked 
                  ? "hover:shadow-destructive/10 hover:border-destructive/30 border-destructive/20" 
                  : "hover:shadow-primary/5 hover:border-primary/30"
              }`}
              onClick={() => {
                // Check if folder is locked AND not already unlocked in this session
                if (item.is_locked && item.password_hash && (!isFolderUnlocked || !isFolderUnlocked(item.id))) {
                  setPendingFolderId(item.id);
                  setUnlockFolder({ 
                    id: item.id, 
                    name: item.name, 
                    passwordHash: item.password_hash,
                    autoLockMinutes: item.auto_lock_minutes
                  });
                } else {
                  onFolderClick(item.id);
                }
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.stopPropagation();
                if (!item.is_locked) {
                  handleDropOnFolder(item.id);
                }
              }}
            >
              {item.is_locked && (
                <div className="absolute top-3 right-3 p-1.5 bg-destructive/20 rounded-full">
                  <Lock className="h-3 w-3 text-destructive" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${
                  item.is_locked 
                    ? "bg-gradient-to-br from-destructive/20 to-destructive/5" 
                    : "bg-gradient-to-br from-primary/20 to-primary/5"
                }`}>
                  {item.is_locked ? (
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  ) : (
                    <Folder className="h-6 w-6 text-primary" />
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-muted/50"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameItem({ id: item.id, name: item.name, type: "folder" });
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setLockFolder({ 
                          id: item.id, 
                          name: item.name, 
                          isLocked: item.is_locked || false,
                          autoLockMinutes: item.auto_lock_minutes
                        });
                      }}
                      className="cursor-pointer"
                    >
                      {item.is_locked ? (
                        <>
                          <Unlock className="mr-2 h-4 w-4" />
                          remove --lock
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          set --password
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareFolder({
                          id: item.id,
                          name: item.name,
                          isShareable: item.is_shareable || false,
                          shareableToken: item.shareable_token || '',
                        });
                      }}
                      className="cursor-pointer"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      {item.is_shareable ? "share --settings" : "share --enable"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(item.id);
                      }}
                      className="text-destructive cursor-pointer focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium truncate mb-1 flex items-center gap-2">
                {item.name}
                {item.is_locked && <Lock className="h-3 w-3 text-destructive" />}
                {item.is_shareable && <Link className="h-3 w-3 text-accent" />}
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(item.created_at), "MMM d, yyyy")}
              </p>
            </Card>
          ) : (
            <Card
              key={item.id}
              className={`p-4 hover:shadow-lg transition-all group relative rounded-xl border-border/50 bg-card/80 backdrop-blur-sm ${
                currentFolderLocked 
                  ? "hover:shadow-destructive/5 hover:border-destructive/30 border-destructive/20" 
                  : "hover:shadow-accent/5 hover:border-accent/30"
              }`}
              draggable={!currentFolderLocked}
              onDragStart={() => !currentFolderLocked && handleDragStart(item.id)}
            >
              {currentFolderLocked && (
                <div className="absolute top-3 right-3 p-1.5 bg-destructive/20 rounded-full">
                  <Lock className="h-3 w-3 text-destructive" />
                </div>
              )}
              {item.is_offline && !currentFolderLocked && (
                <div className="absolute top-3 right-3 p-1.5 bg-primary/10 rounded-full">
                  <WifiOff className="h-3 w-3 text-primary" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl">
                  <FileIcon className="h-6 w-6 text-accent" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-muted/50"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-xl border-border/50">
                    <DropdownMenuItem onClick={() => handleFileAction(item, 'preview')} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview {currentFolderLocked && <Lock className="ml-auto h-3 w-3 text-destructive" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleFileAction(item, 'download')} className="cursor-pointer">
                      <Download className="mr-2 h-4 w-4" />
                      Download {currentFolderLocked && <Lock className="ml-auto h-3 w-3 text-destructive" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRenameItem({ id: item.id, name: item.name, type: "file" })}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setMoveItem({ id: item.id, name: item.name, type: "file", folderId: item.folder_id })}
                      className="cursor-pointer"
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(item)} className="cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare(item)} className="cursor-pointer">
                      <Share2 className="mr-2 h-4 w-4" />
                      {item.is_shareable ? "Disable" : "Enable"} Sharing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={() => handleToggleOffline(item)} className="cursor-pointer">
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
                      className="text-destructive cursor-pointer focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium truncate mb-1">{item.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatBytes(item.file_size)}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span>{format(new Date(item.created_at), "MMM d, yyyy")}</span>
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

      {lockFolder && (
        <LockFolderDialog
          open={!!lockFolder}
          onOpenChange={(open) => !open && setLockFolder(null)}
          folderId={lockFolder.id}
          folderName={lockFolder.name}
          isLocked={lockFolder.isLocked}
          autoLockMinutes={lockFolder.autoLockMinutes}
          onSuccess={() => {
            setLockFolder(null);
            onFolderDeleted();
          }}
        />
      )}

      {unlockFolder && (
        <UnlockFolderDialog
          open={!!unlockFolder}
          onOpenChange={(open) => {
            if (!open) {
              setUnlockFolder(null);
              setPendingFolderId(null);
            }
          }}
          folderName={unlockFolder.name}
          passwordHash={unlockFolder.passwordHash}
          onSuccess={() => {
            // Notify parent that folder was unlocked
            if (onFolderUnlocked && pendingFolderId) {
              onFolderUnlocked(pendingFolderId, unlockFolder.autoLockMinutes || null);
            }
            setUnlockFolder(null);
            if (pendingFolderId) {
              onFolderClick(pendingFolderId);
              setPendingFolderId(null);
            }
          }}
        />
      )}

      {shareFolder && (
        <ShareFolderDialog
          open={!!shareFolder}
          onOpenChange={(open) => !open && setShareFolder(null)}
          folderId={shareFolder.id}
          folderName={shareFolder.name}
          isShareable={shareFolder.isShareable}
          shareableToken={shareFolder.shareableToken}
          onSuccess={() => {
            setShareFolder(null);
            onFolderDeleted();
          }}
        />
      )}

      {/* File unlock dialog - for files in locked folders */}
      {fileUnlockDialog && currentFolderPasswordHash && (
        <UnlockFolderDialog
          open={!!fileUnlockDialog}
          onOpenChange={(open) => !open && setFileUnlockDialog(null)}
          folderName={currentFolderName || 'Locked Folder'}
          passwordHash={currentFolderPasswordHash}
          onSuccess={handleFileUnlockSuccess}
        />
      )}
    </>
  );
};

export default FileGrid;
