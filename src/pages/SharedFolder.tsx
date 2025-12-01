import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Folder, FileIcon, Download, Lock, ShieldAlert, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";

interface SharedFolderInfo {
  folder_id: string;
  folder_name: string;
  has_password: boolean;
  is_expired: boolean;
}

interface SharedFile {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

// Hash function matching the one used in ShareFolderDialog
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "neltech_share_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const SharedFolder = () => {
  const { token } = useParams<{ token: string }>();
  const [folderInfo, setFolderInfo] = useState<SharedFolderInfo | null>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);

  useEffect(() => {
    fetchFolderInfo();
  }, [token]);

  const fetchFolderInfo = async () => {
    if (!token) {
      setError("Invalid share link");
      setIsLoading(false);
      return;
    }

    try {
      // Use edge function to bypass RLS
      const { data, error: fnError } = await supabase.functions.invoke("get-shared-folder", {
        body: { token, action: "info" },
      });

      if (fnError || data?.error) {
        setError(data?.error || "Shared folder not found or link has expired");
        setIsLoading(false);
        return;
      }

      if (data.is_expired) {
        setError("This share link has expired");
        setIsLoading(false);
        return;
      }

      const info: SharedFolderInfo = {
        folder_id: data.folder_id,
        folder_name: data.folder_name,
        has_password: data.has_password,
        is_expired: data.is_expired,
      };

      setFolderInfo(info);

      // If no password required, fetch files immediately
      if (!data.has_password) {
        setIsUnlocked(true);
        await fetchFiles(null);
      }
    } catch (err) {
      setError("Failed to load shared folder");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async (hash: string | null) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-shared-folder", {
        body: { token, action: "files", passwordHash: hash },
      });

      if (fnError || data?.error) {
        toast.error(data?.error || "Failed to load files");
        return;
      }

      setFiles(data.files?.map((f: any) => ({
        file_id: f.id,
        file_name: f.name,
        file_type: f.file_type,
        file_size: f.file_size,
        storage_path: f.storage_path,
        created_at: f.created_at || '',
      })) || []);
    } catch (err) {
      toast.error("Failed to load files");
    }
  };

  const handleUnlock = async () => {
    if (!password || !folderInfo) {
      toast.error("Please enter a password");
      return;
    }

    setIsVerifying(true);
    try {
      const hash = await hashPassword(password);
      
      // Verify password via edge function
      const { data, error: fnError } = await supabase.functions.invoke("get-shared-folder", {
        body: { token, action: "verify", passwordHash: hash },
      });

      if (fnError) {
        toast.error("Verification failed");
        return;
      }

      if (data.valid) {
        setPasswordHash(hash);
        setIsUnlocked(true);
        toast.success("Access granted!");
        await fetchFiles(hash);
      } else {
        toast.error("Incorrect password");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async (file: SharedFile) => {
    try {
      // Use the download-shared-file edge function for secure downloads
      const { data, error } = await supabase.functions.invoke("download-shared-file", {
        body: { token, storagePath: file.storage_path, folderToken: token },
      });

      if (error) throw error;

      if (data && data.file) {
        const blob = new Blob([new Uint8Array(data.file)], { type: file.file_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Download started");
      }
    } catch (err) {
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (fileType: string) => {
    return <FileIcon className="h-6 w-6 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary animate-pulse">Loading shared folder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono p-4">
        <Card className="max-w-md w-full p-8 border-destructive/30 bg-card/95 backdrop-blur-xl">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button className="bg-primary hover:bg-primary/90">
                Go to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (folderInfo?.has_password && !isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono p-4">
        <Card className="max-w-md w-full p-8 border-primary/30 bg-card/95 backdrop-blur-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-primary mb-2">Protected Folder</h1>
            <p className="text-muted-foreground text-sm">
              // "{folderInfo.folder_name}" requires a password
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-primary text-sm mb-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="font-semibold">PASSWORD REQUIRED</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the password to access this shared folder
              </p>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                className="h-11 pl-10 pr-10 bg-muted/50 border-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              onClick={handleUnlock}
              disabled={isVerifying || !password}
              className="w-full bg-primary hover:bg-primary/90 hover:shadow-glow"
            >
              {isVerifying ? "Verifying..." : "access --unlock"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">{folderInfo?.folder_name}</h1>
              <p className="text-xs text-muted-foreground">Shared folder • {files.length} files</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {files.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <Card
                key={file.file_id}
                className="p-4 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                    {getFileIcon(file.file_type)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="font-medium truncate mb-1 text-sm">{file.file_name}</h3>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(file.file_size)}</span>
                  {file.created_at && (
                    <span>{format(new Date(file.created_at), "MMM d")}</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="text-primary">NelTech Cloud</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SharedFolder;