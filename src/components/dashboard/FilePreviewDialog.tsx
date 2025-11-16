import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { FileIcon } from "lucide-react";

interface FilePreviewDialogProps {
  file: {
    id: string;
    name: string;
    file_type: string;
    storage_path: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FilePreviewDialog = ({ file, open, onOpenChange }: FilePreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, file.id]);

  const loadPreview = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("user-files")
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");
  const isPDF = file.file_type === "application/pdf";
  const isText = file.file_type.startsWith("text/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 flex items-center justify-center min-h-[400px]">
          {isLoading ? (
            <div className="animate-pulse text-muted-foreground">Loading preview...</div>
          ) : previewUrl ? (
            <>
              {isImage && (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              )}
              {isPDF && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border"
                  title={file.name}
                />
              )}
              {isText && !isPDF && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border bg-background"
                  title={file.name}
                />
              )}
              {!isImage && !isVideo && !isPDF && !isText && (
                <div className="text-center">
                  <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Preview not available for this file type
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Failed to load preview</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
