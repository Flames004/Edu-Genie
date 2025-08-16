"use client";

import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  FileText, 
  Home, 
  LogOut, 
  Settings, 
  User, 
  Moon 
} from "lucide-react";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      router.push("/login");
    }
  };

  const navigationItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: FileText, label: "Documents", href: "/documents" },
    { icon: BookOpen, label: "Analytics", href: "/analytics" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Greeting */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Image
                  src="/logo-genie3.png"
                  alt="EduGenie Logo"
                  className="object-contain"
                  width={80}
                  height={80}
                  style={{ display: 'inline-block' }}
                  priority
                />
                <button
                  className="text-2xl font-bold text-[#5A2ECF] hover:text-blue-700 transition-colors focus:outline-none"
                  onClick={() => router.push("/dashboard")}
                  title="Go to Dashboard"
                >
                  EduGenie
                </button>
              </div>
              <div className="hidden sm:block">
                <span className="text-base text-muted-foreground font-medium">
                  {user?.name ? `Welcome, ${user.name.split(" ")[0]}!` : "Welcome!"}
                </span>
              </div>
            </div>

            {/* User Menu and Dark Mode Toggle */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                title="Toggle dark mode"
                onClick={() => toast("Dark mode coming soon!")}
              >
                <Moon className="h-5 w-5 text-gray-500" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-semibold">{user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (static sticky) */}
        <nav className="w-64 bg-white shadow-sm border-r h-screen sticky top-16">
          <div className="p-6">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.label}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      isActive 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
