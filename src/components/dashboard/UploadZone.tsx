import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileIcon, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { queueUpload } from "@/lib/offlineStorage";

interface UploadZoneProps {
  currentFolderId: string | null;
  onUploadSuccess: () => void;
}

const UploadZone = ({ currentFolderId, onUploadSuccess }: UploadZoneProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase.from("files").insert({
        name: file.name,
        folder_id: currentFolderId,
        user_id: user.id,
        storage_path: fileName,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
      });

      if (dbError) throw dbError;
    } catch (error: any) {
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Check if online
      const isOnline = navigator.onLine;

      if (!isOnline) {
        // Queue uploads for when back online
        setUploading(true);
        setProgress(0);

        try {
          const totalFiles = acceptedFiles.length;
          let queued = 0;

          for (const file of acceptedFiles) {
            await queueUpload(
              file.name,
              file,
              file.type || "application/octet-stream",
              file.size,
              currentFolderId
            );
            queued++;
            setProgress((queued / totalFiles) * 100);
          }

          toast.success(
            `${totalFiles} file(s) queued for upload. They will be uploaded when you're back online.`,
            { icon: <WifiOff className="h-4 w-4" /> }
          );
        } catch (error: any) {
          toast.error("Failed to queue file for upload");
        } finally {
          setUploading(false);
          setProgress(0);
        }
        return;
      }

      // Upload immediately if online
      setUploading(true);
      setProgress(0);

      try {
        const totalFiles = acceptedFiles.length;
        let uploaded = 0;

        for (const file of acceptedFiles) {
          await uploadFile(file);
          uploaded++;
          setProgress((uploaded / totalFiles) * 100);
        }

        toast.success(`${totalFiles} file(s) uploaded successfully!`);
        onUploadSuccess();
      } catch (error: any) {
        toast.error(error.message || "Failed to upload file");
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [currentFolderId, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  });

  return (
    <Card
      {...getRootProps()}
      className={`mb-6 p-8 border-2 border-dashed transition-all cursor-pointer ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {uploading ? (
          <>
            <FileIcon className="h-12 w-12 text-primary animate-pulse" />
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm text-muted-foreground">
                Uploading... {Math.round(progress)}%
              </p>
              <Progress value={progress} />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-base font-medium">
                {isDragActive ? "Drop files here" : "Drag & drop files here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Choose Files
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default UploadZone;
