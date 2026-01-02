import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Upload, Download, Lock, Image, Loader2, X, AlertCircle, FolderOpen, Check } from "lucide-react";

interface DecodePanelProps {
  fullWidth?: boolean;
}

interface DriveFile {
  id: string;
  name: string;
  storage_path: string;
  file_type: string;
}

export const DecodePanel = ({ fullWidth }: DecodePanelProps) => {
  const [activeTab, setActiveTab] = useState("hide");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Hide data state
  const [hideImage, setHideImage] = useState<File | null>(null);
  const [hideImagePreview, setHideImagePreview] = useState<string | null>(null);
  const [secretData, setSecretData] = useState("");
  const [hidePassword, setHidePassword] = useState("");
  const [showHidePassword, setShowHidePassword] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Extract data state
  const [extractImage, setExtractImage] = useState<File | null>(null);
  const [extractImagePreview, setExtractImagePreview] = useState<string | null>(null);
  const [extractPassword, setExtractPassword] = useState("");
  const [showExtractPassword, setShowExtractPassword] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);

  // Drive picker state
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [drivePickerTarget, setDrivePickerTarget] = useState<"hide" | "extract">("hide");
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);

  const loadDriveImages = async () => {
    setIsLoadingDriveFiles(true);
    try {
      const { data, error } = await supabase
        .from("files")
        .select("id, name, storage_path, file_type")
        .in("file_type", ["image/png", "image/jpeg", "image/webp", "image/jpg"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDriveFiles(data || []);
    } catch (error) {
      console.error("Failed to load drive images:", error);
      toast.error("Failed to load images from drive");
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const openDrivePicker = (target: "hide" | "extract") => {
    setDrivePickerTarget(target);
    setShowDrivePicker(true);
    loadDriveImages();
  };

  const handleDriveFileSelect = async (file: DriveFile) => {
    try {
      const { data: urlData } = await supabase.storage
        .from("files")
        .createSignedUrl(file.storage_path, 60);

      if (!urlData?.signedUrl) {
        throw new Error("Failed to get file URL");
      }

      const response = await fetch(urlData.signedUrl);
      const blob = await response.blob();
      const selectedFile = new File([blob], file.name, { type: file.file_type });
      const previewUrl = URL.createObjectURL(selectedFile);

      if (drivePickerTarget === "hide") {
        setHideImage(selectedFile);
        setHideImagePreview(previewUrl);
        setResultImage(null);
      } else {
        setExtractImage(selectedFile);
        setExtractImagePreview(previewUrl);
        setExtractedData(null);
      }

      setShowDrivePicker(false);
      toast.success(`Selected: ${file.name}`);
    } catch (error) {
      console.error("Failed to load file from drive:", error);
      toast.error("Failed to load image from drive");
    }
  };
  const getImageData = useCallback((file: File): Promise<{ data: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData.data.buffer)));
        resolve({
          data: base64,
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const base64ToImageUrl = useCallback((base64Data: string, width: number, height: number): string => {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(bytes);
    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL('image/png');
  }, []);

  const handleHideImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHideImage(file);
      setHideImagePreview(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  const handleExtractImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExtractImage(file);
      setExtractImagePreview(URL.createObjectURL(file));
      setExtractedData(null);
    }
  };

  const handleHideData = async () => {
    if (!hideImage || !secretData.trim()) {
      toast.error("Please select an image and enter data to hide");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: imageData, width, height } = await getImageData(hideImage);
      
      const { data, error } = await supabase.functions.invoke('steganography', {
        body: {
          action: 'hide',
          imageData,
          width,
          height,
          data: secretData,
          type: 'text',
          password: hidePassword || undefined,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const resultUrl = base64ToImageUrl(data.data.resultImageData, data.data.width, data.data.height);
      setResultImage(resultUrl);
      toast.success("Data hidden successfully!");
    } catch (error: any) {
      console.error('Hide data error:', error);
      toast.error(error.message || "Failed to hide data");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractData = async () => {
    if (!extractImage) {
      toast.error("Please select an image to extract data from");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: imageData } = await getImageData(extractImage);
      
      const { data, error } = await supabase.functions.invoke('steganography', {
        body: {
          action: 'extract',
          imageData,
          password: extractPassword || undefined,
        },
      });

      if (error) throw error;
      if (!data.success) {
        if (data.needsPassword) {
          toast.error("This data is encrypted. Please enter the password.");
          return;
        }
        throw new Error(data.error);
      }

      setExtractedData(data.data.content);
      toast.success("Data extracted successfully!");
    } catch (error: any) {
      console.error('Extract data error:', error);
      toast.error(error.message || "Failed to extract data");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = 'hidden-data-image.png';
    link.click();
  };

  const clearHideForm = () => {
    setHideImage(null);
    setHideImagePreview(null);
    setSecretData("");
    setHidePassword("");
    setResultImage(null);
  };

  const clearExtractForm = () => {
    setExtractImage(null);
    setExtractImagePreview(null);
    setExtractPassword("");
    setExtractedData(null);
  };

  return (
    <Card className={`border-primary/20 bg-card/50 backdrop-blur ${fullWidth ? '' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-mono">
          <Eye className="h-5 w-5 text-primary" />
          <span className="text-primary">Decode</span>
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Hide and extract secret data from images
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="hide" className="font-mono text-xs">
              <EyeOff className="h-3 w-3 mr-1" />
              Hide Data
            </TabsTrigger>
            <TabsTrigger value="extract" className="font-mono text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Extract Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hide" className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Cover Image</Label>
              {hideImagePreview ? (
                <div className="relative">
                  <img 
                    src={hideImagePreview} 
                    alt="Cover" 
                    className="w-full h-32 object-contain rounded-lg border border-primary/20 bg-background"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => { setHideImage(null); setHideImagePreview(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background/50">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-mono">Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleHideImageSelect}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => openDrivePicker("hide")}
                    className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background/50"
                  >
                    <FolderOpen className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-mono">From Drive</span>
                  </button>
                </div>
              )}
            </div>

            {/* Secret Data */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Secret Data</Label>
              <Textarea
                placeholder="Enter text to hide..."
                value={secretData}
                onChange={(e) => setSecretData(e.target.value)}
                className="font-mono text-xs min-h-[80px] resize-none"
              />
            </div>

            {/* Password (optional) */}
            <div className="space-y-2">
              <Label className="font-mono text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Password (optional)
              </Label>
              <div className="relative">
                <Input
                  type={showHidePassword ? "text" : "password"}
                  placeholder="Encrypt with password..."
                  value={hidePassword}
                  onChange={(e) => setHidePassword(e.target.value)}
                  className="font-mono text-xs pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowHidePassword(!showHidePassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showHidePassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleHideData}
              disabled={isProcessing || !hideImage || !secretData.trim()}
              className="w-full font-mono text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide Data in Image
                </>
              )}
            </Button>

            {/* Result */}
            {resultImage && (
              <div className="space-y-2 pt-2 border-t border-primary/20">
                <Label className="font-mono text-xs text-primary">Result Image</Label>
                <img 
                  src={resultImage} 
                  alt="Result" 
                  className="w-full h-32 object-contain rounded-lg border border-primary/20 bg-background"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadResult}
                    className="flex-1 font-mono text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHideForm}
                    className="font-mono text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="extract" className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="font-mono text-xs">Image with Hidden Data</Label>
              {extractImagePreview ? (
                <div className="relative">
                  <img 
                    src={extractImagePreview} 
                    alt="Extract" 
                    className="w-full h-32 object-contain rounded-lg border border-primary/20 bg-background"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => { setExtractImage(null); setExtractImagePreview(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background/50">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-mono">Upload</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleExtractImageSelect}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => openDrivePicker("extract")}
                    className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-background/50"
                  >
                    <FolderOpen className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground font-mono">From Drive</span>
                  </button>
                </div>
              )}
            </div>

            {/* Password (if encrypted) */}
            <div className="space-y-2">
              <Label className="font-mono text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Password (if encrypted)
              </Label>
              <div className="relative">
                <Input
                  type={showExtractPassword ? "text" : "password"}
                  placeholder="Enter password..."
                  value={extractPassword}
                  onChange={(e) => setExtractPassword(e.target.value)}
                  className="font-mono text-xs pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowExtractPassword(!showExtractPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showExtractPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleExtractData}
              disabled={isProcessing || !extractImage}
              className="w-full font-mono text-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Extract Hidden Data
                </>
              )}
            </Button>

            {/* Result */}
            {extractedData !== null && (
              <div className="space-y-2 pt-2 border-t border-primary/20">
                <Label className="font-mono text-xs text-primary">Extracted Data</Label>
                <div className="p-3 rounded-lg border border-primary/20 bg-background">
                  <p className="font-mono text-xs whitespace-pre-wrap break-all">{extractedData}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearExtractForm}
                  className="font-mono text-xs"
                >
                  Clear
                </Button>
              </div>
            )}

            {extractedData === null && extractImage && !isProcessing && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-muted-foreground">
                <AlertCircle className="h-3 w-3" />
                <span className="font-mono text-xs">No data extracted yet</span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Drive Image Picker Dialog */}
      <Dialog open={showDrivePicker} onOpenChange={setShowDrivePicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Select from Drive
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingDriveFiles ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Image className="h-8 w-8 mb-2" />
                <span className="font-mono text-xs">No images in drive</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {driveFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleDriveFileSelect(file)}
                    className="relative group aspect-square rounded-lg border border-primary/20 overflow-hidden hover:border-primary/50 transition-colors bg-background"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-mono text-[10px] truncate block">{file.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
