import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Sparkles } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/dashboard/Sidebar";
import FileGrid from "@/components/dashboard/FileGrid";
import UploadZone from "@/components/dashboard/UploadZone";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const { files, isLoading: filesLoading, refetch: refetchFiles } = useFiles(currentFolderId, searchQuery);
  const { folders, isLoading: foldersLoading, refetch: refetchFolders } = useFolders(currentFolderId, searchQuery);
  
  useOfflineSync();

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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleUploadSuccess = () => {
    refetchFiles();
    toast.success("File uploaded successfully!");
  };

  const handleFolderCreated = () => {
    refetchFolders();
    toast.success("Folder created successfully!");
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;
      
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: any) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResendingEmail(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <DashboardHeader
        user={user}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex relative">
        <Sidebar
          isOpen={isSidebarOpen}
          currentFolderId={currentFolderId}
          onFolderSelect={setCurrentFolderId}
          onFolderCreated={handleFolderCreated}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-4 lg:p-6 max-w-7xl mx-auto relative">
            <InstallPrompt />
            
            {user && !user.email_confirmed_at && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-600 dark:text-amber-400">Email Verification Required</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-amber-600/80 dark:text-amber-400/80">
                    Please verify your email address to access all features.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendingEmail}
                    className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 shrink-0"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isResendingEmail ? "Sending..." : "Resend Email"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Welcome Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {currentFolderId ? "Folder Contents" : "My Drive"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentFolderId 
                  ? "Browse files in this folder" 
                  : "Your secure cloud storage - upload, organize, and share files"
                }
              </p>
            </div>
            
            <UploadZone
              currentFolderId={currentFolderId}
              onUploadSuccess={handleUploadSuccess}
            />
            
            <FileGrid
              files={files}
              folders={folders}
              isLoading={filesLoading || foldersLoading}
              onFolderClick={setCurrentFolderId}
              onFileDeleted={refetchFiles}
              onFolderDeleted={refetchFolders}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
