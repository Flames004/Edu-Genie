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
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, setTheme } = useTheme();
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
  <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
      {/* Header */}
  <header className="bg-white shadow-sm border-b dark:bg-neutral-800 dark:border-neutral-700 sticky top-0 z-50 text-gray-900 dark:text-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Greeting */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <Image
                  src="/logo-genie-nobg.png"
                  alt="EduGenie Logo"
                  className="object-contain"
                  width={56}
                  height={56}
                  style={{ display: 'inline-block' }}
                  priority
                />
                <button
                  className="text-2xl font-bold text-[#5A2ECF] hover:text-[#4826a7] dark:text-violet-300 dark:hover:text-violet-200 transition-colors focus:outline-none"
                  onClick={() => router.push("/dashboard")}
                  title="Go to Dashboard"
                >
                  EduGenie
                </button>
              </div>
            </div>

            {/* User Menu and Dark Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-base text-muted-foreground dark:text-neutral-300 font-medium">
                  {user?.name ? `Welcome, ${user.name.split(" ")[0]}!` : "Welcome!"}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-500 dark:text-neutral-200" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#5A2ECF] text-white dark:bg-violet-400 dark:text-neutral-900">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-52" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-semibold dark:text-neutral-100">{user?.name || "User"}</span>
                      <span className="text-xs text-muted-foreground dark:text-neutral-400">{user?.email}</span>
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
  <nav className="w-64 bg-white shadow-sm border-r dark:bg-neutral-800 dark:border-neutral-700 h-screen sticky top-16 text-gray-900 dark:text-neutral-100">
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
                        ? "bg-[#5A2ECF] text-white hover:bg-[#4826a7]" 
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
