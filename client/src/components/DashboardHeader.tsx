import { Button } from "../components/ui/button";
import { SidebarTrigger } from "../components/ui/sidebar";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { logout, MeResponse } from "../lib/auth";

interface DashboardHeaderProps {
  user: MeResponse;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    logout();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-6">
      <SidebarTrigger className="text-primary hover:bg-primary/10" />
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(user?.email || user?.username || "?")
                  ?.charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {user?.email || user?.username}
              </p>
              <p className="text-xs text-muted-foreground">Account</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <User className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
