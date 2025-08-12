"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import QuickActions from "@/components/dashboard/QuickActions";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();

  if (error) {
    console.error("Dashboard data error:", error);
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Dashboard Stats */}
          <DashboardStats 
            stats={data?.stats}
            isLoading={isLoading}
          />

          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Documents */}
          <RecentDocuments 
            documents={data?.recentDocuments || []}
            isLoading={isLoading}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
