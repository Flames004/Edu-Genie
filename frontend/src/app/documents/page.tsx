"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FileUpload from "@/components/upload/FileUpload";
import DocumentLibrary from "@/components/documents/DocumentLibrary";
import DocumentModal from "@/components/documents/DocumentModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Plus } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { documentsApi } from "@/lib/api/documents";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Document } from "@/types";

export default function DocumentsPage() {
  const searchParams = useSearchParams();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Set initial tab based on URL parameter
  const initialTab = searchParams.get("tab") === "upload" ? "upload" : "library";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const { data, isLoading } = useDashboardData();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return await documentsApi.deleteDocument(documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(documentId);
    }
  };

  const handleAnalyzeDocument = (documentId: string, type?: string) => {
    // TODO: Implement analysis functionality
    toast.info(`Analysis feature coming soon! (${type || 'general'} analysis for ${documentId})`);
  };

  const handleUploadComplete = () => {
    // Switch to library tab after successful upload
    setActiveTab("library");
    toast.success("Upload completed! Your document is now available in the library.");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
              <p className="text-muted-foreground">
                Upload, manage, and analyze your documents with AI
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Document Library</span>
                {data?.recentDocuments && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {data.recentDocuments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Documents</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-6">
              <DocumentLibrary
                documents={data?.recentDocuments || []}
                isLoading={isLoading}
                onViewDocument={handleViewDocument}
                onDeleteDocument={handleDeleteDocument}
                onAnalyzeDocument={handleAnalyzeDocument}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Upload New Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onUploadComplete={handleUploadComplete}
                    maxFiles={10}
                    maxSize={10 * 1024 * 1024} // 10MB
                  />
                </CardContent>
              </Card>

              {/* Upload Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">📄 Supported Formats</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• PDF documents (.pdf)</li>
                        <li>• Word documents (.docx, .doc)</li>
                        <li>• Text files (.txt)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">🎯 Best Practices</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use clear, descriptive filenames</li>
                        <li>• Ensure text is readable (not image-only)</li>
                        <li>• Keep files under 10MB for faster processing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Document Modal */}
          <DocumentModal
            document={selectedDocument}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onAnalyze={handleAnalyzeDocument}
            onDelete={handleDeleteDocument}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
