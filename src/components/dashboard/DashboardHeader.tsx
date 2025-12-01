import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Menu, Search, User as UserIcon, Settings } from "lucide-react";
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
}

const DashboardHeader = ({
  user,
  onSignOut,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const userInitials = user.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center gap-4 px-4 lg:px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden hover:bg-primary/10"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl gradient-primary blur opacity-40" />
            <img 
              src="/icon-192x192.png" 
              alt="NelTech" 
              className="relative h-10 w-10 rounded-xl"
            />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
            NelTech
          </h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files and folders..."
              className="w-full pl-10 h-10 bg-muted/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/50 bg-card/95 backdrop-blur-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:bg-primary/10"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/appdownload")}
                className="cursor-pointer hover:bg-primary/10"
              >
                <Settings className="mr-2 h-4 w-4" />
                Download App
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem 
                onClick={onSignOut}
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
