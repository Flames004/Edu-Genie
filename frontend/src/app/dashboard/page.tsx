"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import QuickActions from "@/components/dashboard/QuickActions";
import { useDashboardData } from "@/hooks/useDashboardData";
import DocumentModal from "@/components/documents/DocumentModal";
import { Document } from "@/types";
import { useState } from "react";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardData();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDocument = (documentId: string) => {
    const doc = data?.recentDocuments.find((d) => d._id === documentId);
    setSelectedDocument(doc || null);
    setShowModal(true);
  };

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
            onViewDocument={handleViewDocument}
          />
        </div>
        <DocumentModal
          document={selectedDocument}
          open={showModal}
          onOpenChange={setShowModal}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
