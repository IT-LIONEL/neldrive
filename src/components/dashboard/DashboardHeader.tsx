import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Menu, Search, User as UserIcon, Settings, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  user: User;
  onSignOut: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleSidebar: () => void;
  displayName?: string | null;
  avatarUrl?: string | null;
}

const DashboardHeader = ({
  user,
  onSignOut,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  displayName,
  avatarUrl,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const userInitials = displayName?.[0]?.toUpperCase() || user.email?.charAt(0).toUpperCase() || "U";
  const showName = displayName || user.email?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-primary/20">
      <div className="flex items-center gap-4 px-4 lg:px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden hover:bg-primary/10 hover:text-primary"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-primary blur-md opacity-50" />
            <img 
              src="/icon-192x192.png" 
              alt="NelDrive" 
              className="relative h-10 w-10 rounded-xl border border-primary/30"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold font-mono text-primary text-glow">
              NelDrive
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground -mt-1">
              // secure_cloud v2.0
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              type="search"
              placeholder="search --files --folders..."
              className="w-full pl-10 h-10 font-mono text-sm bg-muted/50 border-primary/20 focus:bg-background focus:border-primary focus:shadow-glow transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2 rounded-full hover:ring-2 hover:ring-primary/50 transition-all">
                <Avatar className="h-9 w-9 border-2 border-primary/30">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-mono font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block font-mono text-sm text-foreground max-w-24 truncate">
                  {showName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-primary/20 bg-card/95 backdrop-blur-xl font-mono">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-primary">{showName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:bg-primary/10 hover:text-primary"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                profile --view
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/appdownload")}
                className="cursor-pointer hover:bg-primary/10 hover:text-primary"
              >
                <Settings className="mr-2 h-4 w-4" />
                download --app
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-primary/20" />
              <DropdownMenuItem 
                onClick={onSignOut}
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                exit --logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
