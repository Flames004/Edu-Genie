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
  const { user, isAuthenticated, hasHydrated, setUser, setLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Don't start verification until the store has hydrated
    if (!hasHydrated) {
      return;
    }

    const verifyAuth = async () => {
      try {
        // If we have a user in store, verify with backend
        if (isAuthenticated && user) {
          try {
            const response = await authApi.getProfile();
            if (response.success && response.user) {
              setUser(response.user);
            } else {
              // Invalid session
              setUser(null);
              toast.error("Your session has expired. Please log in again.");
              router.push("/login");
              return;
            }
          } catch (apiError) {
            // API call failed, but don't immediately logout
            console.warn("Profile verification failed:", apiError);
            // Keep the user logged in based on stored state
          }
        } else {
          // No user in store, redirect to login
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // Only logout on severe errors
        setUser(null);
        router.push("/login");
      } finally {
        setIsVerifying(false);
        setLoading(false);
      }
    };

    verifyAuth();
  }, [isAuthenticated, user, hasHydrated, setUser, setLoading, router]);

  // Show loading state while waiting for hydration or verifying
  if (!hasHydrated || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!hasHydrated ? "Loading..." : "Verifying authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
