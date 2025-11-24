import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileIcon, Image, Video, FileText, Cloud, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { format } from "date-fns";

interface FileData {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

const SharedFile = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedFile();
    }
  }, [token]);

  const loadSharedFile = async () => {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("shareable_token", token)
        .eq("is_shareable", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("File not found or not shared");
        return;
      }

      setFile(data);

      // Load preview for images and videos
      if (data.file_type.startsWith("image/") || data.file_type.startsWith("video/")) {
        loadPreview(data.storage_path);
      }
    } catch (error: any) {
      toast.error("Failed to load shared file");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreview = async (storagePath: string) => {
    try {
      // Call edge function to get the file
      const { data, error } = await supabase.functions.invoke("download-shared-file", {
        body: { token, storagePath },
      });

      if (error) throw error;

      // Create blob URL for preview
      if (data && data.file) {
        const blob = new Blob([new Uint8Array(data.file)], { type: file?.file_type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    setIsDownloading(true);
    try {
      // Call edge function to download the file
      const { data, error } = await supabase.functions.invoke("download-shared-file", {
        body: { token, storagePath: file.storage_path },
      });

      if (error) throw error;

      if (data && data.file) {
        // Create blob with correct MIME type
        const blob = new Blob([new Uint8Array(data.file)], { type: file.file_type });
        const url = URL.createObjectURL(blob);
        
        // Create download link with proper attributes
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.setAttribute("type", file.file_type);
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        toast.success("File downloaded successfully");
      }
    } catch (error: any) {
      toast.error("Failed to download file");
      console.error("Error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return FileIcon;
    if (file.file_type.startsWith("image/")) return Image;
    if (file.file_type.startsWith("video/")) return Video;
    if (file.file_type.includes("pdf") || file.file_type.startsWith("text/")) return FileText;
    return FileIcon;
  };

  const FileIconComponent = getFileIcon();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading shared file...</div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">File Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This file doesn't exist or is no longer shared.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <Cloud className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">NelTech</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileIconComponent className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{file.name}</CardTitle>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{formatBytes(file.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(file.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>
              <Button onClick={handleDownload} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {previewUrl ? (
              <div className="rounded-lg overflow-hidden bg-secondary/20 flex items-center justify-center p-4">
                {isImage && (
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-w-full max-h-[600px] object-contain rounded"
                  />
                )}
                {isVideo && (
                  <video
                    src={previewUrl}
                    controls
                    className="max-w-full max-h-[600px] rounded"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/20 rounded-lg">
                <FileIconComponent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Preview not available. Click download to view this file.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SharedFile;
