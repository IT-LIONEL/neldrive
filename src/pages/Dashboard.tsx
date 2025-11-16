import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/dashboard/Sidebar";
import FileGrid from "@/components/dashboard/FileGrid";
import UploadZone from "@/components/dashboard/UploadZone";
import { useFiles } from "@/hooks/useFiles";
import { useFolders } from "@/hooks/useFolders";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { files, isLoading: filesLoading, refetch: refetchFiles } = useFiles(currentFolderId, searchQuery);
  const { folders, isLoading: foldersLoading, refetch: refetchFolders } = useFolders(currentFolderId, searchQuery);

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
