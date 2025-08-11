"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // If we have a user in store, verify with backend
        if (isAuthenticated && user) {
          const response = await authApi.getProfile();
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            // Invalid session
            setUser(null);
            toast.error("Your session has expired. Please log in again.");
            router.push("/login");
          }
        } else {
          // No user in store, redirect to login
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        setUser(null);
        router.push("/login");
      } finally {
        setIsVerifying(false);
        setLoading(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, user, setUser, setLoading, router]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
