import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, WifiOff, Upload, HardDrive, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getAllOfflineFiles, getUploadQueue, getStorageStats, clearOfflineFiles, clearUploadQueue } from "@/lib/offlineStorage";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OfflineFiles = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [offlineFiles, setOfflineFiles] = useState<any[]>([]);
  const [queuedUploads, setQueuedUploads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = async () => {
    const [offline, queued, statistics] = await Promise.all([
      getAllOfflineFiles(),
      getUploadQueue(),
      getStorageStats(),
    ]);

    setOfflineFiles(offline);
    setQueuedUploads(queued);
    setStats(statistics);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleClearOfflineFiles = async () => {
    try {
      await clearOfflineFiles();
      toast.success("Offline files cleared");
      loadData();
    } catch (error) {
      toast.error("Failed to clear offline files");
    }
  };

  const handleClearUploadQueue = async () => {
    try {
      await clearUploadQueue();
      toast.success("Upload queue cleared");
      loadData();
    } catch (error) {
      toast.error("Failed to clear upload queue");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        user={user}
        onSignOut={handleSignOut}
        searchQuery=""
        onSearchChange={() => {}}
        onToggleSidebar={() => {}}
      />

      <main className="container mx-auto p-6 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <WifiOff className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Offline Files</h1>
          </div>
          <p className="text-muted-foreground">
            Manage files saved for offline access and queued uploads
          </p>
        </div>

        {!isOnline && (
          <Alert className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              You are currently offline. Files will be uploaded automatically when you're back online.
            </AlertDescription>
          </Alert>
        )}

        {/* Storage Statistics */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Offline Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.offlineFiles.count || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(stats?.offlineFiles.size || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Queued Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.queuedUploads.count || 0}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(stats?.queuedUploads.size || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatBytes(stats?.totalSize || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Local storage used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queued Uploads */}
        {queuedUploads.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queued Uploads</CardTitle>
                  <CardDescription>
                    Files waiting to be uploaded when back online
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearUploadQueue}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queuedUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{upload.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(upload.file_size)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Queued {new Date(upload.queued_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offline Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Offline Files</CardTitle>
                <CardDescription>
                  Files saved for offline access
                </CardDescription>
              </div>
              {offlineFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOfflineFiles}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {offlineFiles.length === 0 ? (
              <div className="text-center py-12">
                <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No offline files saved</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mark files for offline access from your dashboard
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {offlineFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <WifiOff className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(file.file_size)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Cached {new Date(file.cached_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OfflineFiles;
