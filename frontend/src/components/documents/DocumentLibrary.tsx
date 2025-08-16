"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  FileText, 
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  File
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Document } from "@/types";

interface DocumentLibraryProps {
  documents: Document[];
  isLoading?: boolean;
  onViewDocument?: (document: Document) => void;
  onDeleteDocument?: (documentId: string) => void;
  onAnalyzeDocument?: (documentId: string) => void;
}

export default function DocumentLibrary({
  documents,
  isLoading,
  onViewDocument,
  onDeleteDocument,
}: DocumentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [filterType, setFilterType] = useState("all");

  // Filter and search documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || (doc.mimeType && doc.mimeType.toLowerCase().includes(filterType));
    return matchesSearch && matchesFilter;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.originalName.localeCompare(b.originalName);
      case "size":
        return b.fileSize - a.fileSize;
      case "analyses":
        return (b.analyses?.length || 0) - (a.analyses?.length || 0);
      default: // uploadDate
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
  });

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

  const getFileTypeIcon = (mimeType: string | undefined) => {
    if (!mimeType) return "📄";
    
    const type = mimeType.toLowerCase();
    if (type.includes("pdf")) return "📄";
    if (type.includes("word") || type.includes("doc")) return "📝";
    if (type.includes("text") || type.includes("txt")) return "📃";
    return "📄";
  };

  const getFileTypeBadge = (mimeType: string | undefined) => {
    if (!mimeType) return { label: "FILE", color: "bg-purple-100 text-purple-800" };
    
    const type = mimeType.toLowerCase();
    if (type.includes("pdf")) return { label: "PDF", color: "bg-red-100 text-red-800" };
    if (type.includes("word") || type.includes("doc")) return { label: "DOCX", color: "bg-blue-100 text-blue-800" };
    if (type.includes("text") || type.includes("txt")) return { label: "TXT", color: "bg-gray-100 text-gray-800" };
    return { label: "FILE", color: "bg-purple-100 text-purple-800" };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <File className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-gray-500 text-center mb-6">
            Upload your first document to get started with AI-powered analysis
          </p>
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Library</h2>
          <p className="text-muted-foreground">
            {documents.length} {documents.length === 1 ? "document" : "documents"} total
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="word">Word</SelectItem>
            <SelectItem value="text">Text</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uploadDate">Upload Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">File Size</SelectItem>
            <SelectItem value="analyses">Analyses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedDocuments.map((document) => {
            const fileTypeBadge = getFileTypeBadge(document.mimeType);
            return (
              <Card key={document._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileTypeIcon(document.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {document.originalName}
                        </CardTitle>
                        <Badge className={`${fileTypeBadge.color} text-xs mt-1`}>
                          {fileTypeBadge.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDocument?.(document)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDeleteDocument?.(document._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(document.uploadDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>{document.analyses?.length || 0} analyses</span>
                    </div>
                    {document.estimatedPages && (
                      <div className="text-xs text-gray-500">
                        ~{document.estimatedPages} pages
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {sortedDocuments.map((document) => {
            const fileTypeBadge = getFileTypeBadge(document.mimeType);
            return (
              <Card key={document._id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="text-xl">{getFileTypeIcon(document.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{document.originalName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <Badge className={`${fileTypeBadge.color} text-xs`}>
                            {fileTypeBadge.label}
                          </Badge>
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>{formatDate(document.uploadDate)}</span>
                          <span>{document.analyses?.length || 0} analyses</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDocument?.(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDocument?.(document)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDeleteDocument?.(document._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {sortedDocuments.length === 0 && documents.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-gray-500 text-center">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
