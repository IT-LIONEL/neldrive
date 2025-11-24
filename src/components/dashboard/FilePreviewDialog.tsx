import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { FileIcon } from "lucide-react";
import mammoth from "mammoth";
import Papa from "papaparse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);

  useEffect(() => {
    if (open) {
      setDocxHtml(null);
      setCsvData(null);
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

      // Handle DOCX files
      if (file.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await data.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocxHtml(result.value);
      }
      // Handle CSV files
      else if (file.file_type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
        const text = await data.text();
        Papa.parse(text, {
          complete: (result) => {
            setCsvData(result.data);
          },
          header: false,
        });
      }
      // Handle other files
      else {
        const url = URL.createObjectURL(data);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isImage = file.file_type.startsWith("image/");
  const isVideo = file.file_type.startsWith("video/");
  const isPDF = file.file_type === "application/pdf";
  const isText = file.file_type.startsWith("text/") && !file.name.toLowerCase().endsWith(".csv");
  const isDocx = file.file_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isCsv = file.file_type === "text/csv" || file.name.toLowerCase().endsWith(".csv");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 flex items-center justify-center min-h-[400px]">
          {isLoading ? (
            <div className="animate-pulse text-muted-foreground">Loading preview...</div>
          ) : (
            <>
              {isDocx && docxHtml ? (
                <ScrollArea className="w-full h-[70vh] rounded-lg border p-6 bg-background">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: docxHtml }}
                  />
                </ScrollArea>
              ) : isCsv && csvData && csvData.length > 0 ? (
                <ScrollArea className="w-full h-[70vh] rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvData[0].map((header: string, idx: number) => (
                          <TableHead key={idx} className="font-semibold">
                            {header || `Column ${idx + 1}`}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(1).map((row: string[], rowIdx: number) => (
                        <TableRow key={rowIdx}>
                          {row.map((cell: string, cellIdx: number) => (
                            <TableCell key={cellIdx}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
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
                  {isText && (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[70vh] rounded-lg border bg-background"
                      title={file.name}
                    />
                  )}
                  {!isImage && !isVideo && !isPDF && !isText && !isDocx && !isCsv && (
                    <div className="text-center">
                      <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Preview not available — download instead.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <FileIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {isDocx || isCsv ? "Failed to load preview" : "Preview not available — download instead."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
