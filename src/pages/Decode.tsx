import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DecodePanel } from "@/components/dashboard/DecodePanel";

const Decode = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

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
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background scanline">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <DashboardHeader
        user={user}
        onSignOut={handleSignOut}
        searchQuery=""
        onSearchChange={() => {}}
        onToggleSidebar={() => {}}
      />

      <main className="container mx-auto p-6 max-w-4xl relative">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 font-mono hover:bg-primary/10 hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            cd ../dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-mono text-primary text-glow">Decode</h1>
          </div>
          <p className="text-muted-foreground font-mono">
            // Hide and extract secret data from images using steganography
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <DecodePanel fullWidth />
        </div>
      </main>
    </div>
  );
};

export default Decode;
