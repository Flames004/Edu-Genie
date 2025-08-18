"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Document } from "@/types";

interface RecentDocumentsProps {
  documents: Document[];
  isLoading?: boolean;
  onViewDocument?: (documentId: string) => void;
  onAnalyzeDocument?: (documentId: string) => void;
}

export default function RecentDocuments({ 
  documents, 
  isLoading,
  onViewDocument
}: RecentDocumentsProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getFileTypeColor = (fileType: string | undefined) => {
    if (!fileType) return "bg-purple-100 text-purple-800 dark:bg-violet-900 dark:text-violet-200";
    switch (fileType.toLowerCase()) {
      case "application/pdf":
        return "bg-red-100 text-red-800 dark:bg-rose-900 dark:text-rose-200";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "text/plain":
        return "bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200";
      default:
        return "bg-purple-100 text-purple-800 dark:bg-violet-900 dark:text-violet-200";
    }
  };

  const getFileTypeLabel = (fileType: string | undefined) => {
    if (!fileType) return "FILE";
    
    switch (fileType.toLowerCase()) {
      case "application/pdf":
        return "PDF";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "DOCX";
      case "text/plain":
        return "TXT";
      default:
        return "FILE";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
        <CardHeader>
          <CardTitle className="dark:text-neutral-100">Recent Documents</CardTitle>
          <CardDescription className="dark:text-neutral-300">Loading your recent documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-neutral-300">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
        <CardHeader>
          <CardTitle className="dark:text-neutral-100">Recent Documents</CardTitle>
          <CardDescription className="dark:text-neutral-300">Your recently uploaded documents will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-neutral-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-neutral-100">No documents yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-300">
              Get started by uploading your first document.
            </p>
            <div className="mt-6">
              <Button className="dark:text-neutral-100 dark:border-neutral-700">
                <FileText className="mr-2 h-4 w-4 dark:text-neutral-100" />
                Upload Document
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
      <CardHeader>
        <CardTitle className="dark:text-neutral-100">Recent Documents</CardTitle>
        <CardDescription className="dark:text-neutral-300">
          {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.slice(0, 5).map((document) => (
            <div
              key={document._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-200" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate">
                      {document.originalName}
                    </p>
                    <Badge 
                      variant="secondary" 
                      className={getFileTypeColor(document.mimeType)}
                    >
                      {getFileTypeLabel(document.mimeType)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-neutral-300">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>{document.estimatedPages} page{document.estimatedPages !== 1 ? "s" : ""}</span>
                    <span>•</span>
                    <span>{formatDate(document.uploadDate)}</span>
                    {document.analyses.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {document.analyses.length} analysis{document.analyses.length !== 1 ? "es" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="dark:text-neutral-100">
                      <MoreHorizontal className="h-4 w-4 dark:text-neutral-100" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark:bg-neutral-900 dark:text-neutral-100">
                    <DropdownMenuItem onClick={() => onViewDocument?.(document._id)} className="dark:text-neutral-100">
                      <Eye className="mr-2 h-4 w-4 dark:text-neutral-100" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this document?')) {
                          if (typeof document._id === 'string' && document._id) {
                            // Use a custom event to notify parent to delete
                            const event = new CustomEvent('deleteDocument', { detail: document._id });
                            window.dispatchEvent(event);
                          }
                        }
                      }}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4 dark:text-red-400" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          {documents.length > 5 && (
            <div className="pt-4 border-t dark:border-neutral-700">
              <Button variant="outline" className="w-full dark:text-neutral-100 dark:border-neutral-700">
                View All Documents ({documents.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
