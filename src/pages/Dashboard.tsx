import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail } from "lucide-react";
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
  
  // Enable offline sync
  useOfflineSync();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Listen for auth changes
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
      <DashboardHeader
        user={user}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          currentFolderId={currentFolderId}
          onFolderSelect={setCurrentFolderId}
          onFolderCreated={handleFolderCreated}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="p-6 max-w-7xl mx-auto">
            <InstallPrompt />
            
            {user && !user.email_confirmed_at && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email Verification Required</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>Please verify your email address to access all features and ensure account security.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendingEmail}
                    className="ml-4"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isResendingEmail ? "Sending..." : "Resend Email"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
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
