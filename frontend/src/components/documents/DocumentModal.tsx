"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ ADDED: For fast navigation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  Calendar,
  FileIcon,
  Eye,
  Brain,
  Tags,
  Share2,
  Trash2,
  MessageSquare, // ✅ ADDED: Chat Icon
} from "lucide-react";
import { Document } from "@/types";

interface DocumentModalProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalyze?: (documentId: string, type: string) => void;
  onDelete?: (documentId: string) => void;
}

export default function DocumentModal({
  document,
  open,
  onOpenChange,
  onAnalyze,
  onDelete,
}: DocumentModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "content" | "analyses"
  >("overview");

  const router = useRouter(); // ✅ ADDED: Router instance

  if (!document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeIcon = (fileType?: string) => {
    if (!fileType) return "📄";
    const lower = fileType.toLowerCase();
    if (lower.includes("pdf")) return "📄";
    if (lower.includes("word")) return "📝";
    if (lower.includes("text")) return "📃";
    return "📄";
  };

  const getFileTypeBadge = (fileType?: string) => {
    if (!fileType)
      return {
        label: "FILE",
        color:
          "bg-purple-100 text-purple-800 dark:bg-violet-900 dark:text-violet-200",
      };
    const lower = fileType.toLowerCase();
    if (lower.includes("pdf"))
      return {
        label: "PDF",
        color: "bg-red-100 text-red-800 dark:bg-rose-900 dark:text-rose-200",
      };
    if (lower.includes("word"))
      return {
        label: "DOCX",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      };
    if (lower.includes("text"))
      return {
        label: "TXT",
        color:
          "bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-neutral-200",
      };
    return {
      label: "FILE",
      color:
        "bg-purple-100 text-purple-800 dark:bg-violet-900 dark:text-violet-200",
    };
  };

  const analysisTypes = [
    { key: "summary", label: "Summary", icon: FileText },
    { key: "quiz", label: "Quiz", icon: Brain },
    { key: "flashcards", label: "Flashcards", icon: Eye },
    { key: "keywords", label: "Keywords", icon: Tags },
  ];

  const fileTypeBadge = getFileTypeBadge(document.mimeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-900">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getFileTypeIcon(document.mimeType)}</div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate dark:text-neutral-100">
                {document.originalName}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge
                  className={`${fileTypeBadge.color} text-xs dark:text-neutral-100`}
                >
                  {fileTypeBadge.label}
                </Badge>
                <span className="text-sm text-muted-foreground dark:text-neutral-100">
                  {formatFileSize(document.fileSize)}
                </span>
                <span className="text-sm text-muted-foreground dark:text-neutral-100">
                  •
                </span>
                <span className="text-sm text-muted-foreground dark:text-neutral-100">
                  {formatDate(document.uploadDate)}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col space-y-4 overflow-hidden text-gray-900 dark:text-neutral-100">
          {/* Tabs */}
          <div className="flex space-x-1 border-b dark:border-neutral-700">
            {[
              { key: "overview", label: "Overview", icon: FileIcon },
              { key: "content", label: "Content", icon: Eye },
              {
                key: "analyses",
                label: `Analyses (${document.analyses?.length || 0})`,
                icon: Brain,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() =>
                  setActiveTab(tab.key as "overview" | "content" | "analyses")
                }
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-[#6139d0] text-[#5A2ECF] dark:border-violet-400 dark:text-violet-300"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-100"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <ScrollArea className="flex-1 pr-4">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Document Info */}
                <Card className="bg-white dark:bg-neutral-900">
                  <CardHeader className="dark:bg-neutral-900">
                    <CardTitle className="text-lg dark:text-neutral-100">
                      Document Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 dark:bg-neutral-900">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          File Name
                        </h4>
                        <p className="text-sm font-mono break-all dark:text-neutral-100">
                          {document.fileName}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          Original Name
                        </h4>
                        <p className="text-sm">{document.originalName}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          File Size
                        </h4>
                        <p className="text-sm">
                          {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          Upload Date
                        </h4>
                        <p className="text-sm">
                          {formatDate(document.uploadDate)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          Text Length
                        </h4>
                        <p className="text-sm">
                          {document.textLength?.toLocaleString()} characters
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                          Estimated Pages
                        </h4>
                        <p className="text-sm">
                          {document.estimatedPages || "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {/* ✅ 1. NEW CHAT BUTTON (Full Width) */}
                      <Button
                        variant="default"
                        className="col-span-2 w-full justify-center bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-700 dark:hover:bg-violet-600 shadow-sm mb-2"
                        onClick={() => {
                          onOpenChange(false);
                          router.push(
                            `/dashboard/analysis?type=chat&documentId=${document._id}`
                          );
                        }}
                      >
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Chat with Document
                      </Button>

                      {/* 2. Existing Buttons */}
                      {analysisTypes.map((type) => (
                        <Button
                          key={type.key}
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            onOpenChange(false);
                            // Using router.push instead of window.location for smoother feel
                            router.push(
                              `/dashboard/analysis?type=${type.key}&documentId=${document._id}`
                            );
                          }}
                        >
                          <type.icon className="mr-2 h-4 w-4" />
                          Generate {type.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === "content" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Document Content Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mb-4 text-gray-400" />
                      <p className="text-lg font-semibold mb-2">Coming Soon</p>
                      <p className="text-sm">
                        Document content preview will be available in a future
                        update.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analyses Tab */}
            {activeTab === "analyses" && (
              <ScrollArea className="space-y-4 max-h-[60vh] pr-2">
                {document.analyses && document.analyses.length > 0 ? (
                  document.analyses.map((analysis) => (
                    <Card key={analysis._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg capitalize">
                            {analysis.taskType}
                          </CardTitle>
                          <div className="flex items-center space-x-2 text-sm text-neutral-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(analysis.timestamp)}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {analysis.result || "No content available"}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No analyses yet
                      </h3>
                      <p className="text-gray-500 text-center mb-6">
                        Generate your first AI analysis to get insights from
                        this document
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {analysisTypes.slice(0, 2).map((type) => (
                          <Button
                            key={type.key}
                            onClick={() => onAnalyze?.(document._id, type.key)}
                            size="sm"
                          >
                            <type.icon className="mr-2 h-3 w-3" />
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </ScrollArea>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete?.(document._id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
