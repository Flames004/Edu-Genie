"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { documentsApi } from "@/lib/api/documents";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FileWithProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  id: string;
  error?: string;
}

interface FileUploadProps {
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

export default function FileUpload({ 
  onUploadComplete, 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024 // 10MB 
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return await documentsApi.upload(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      onUploadComplete?.();
    },
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === "file-too-large") {
          toast.error(`File "${file.name}" is too large. Maximum size is ${maxSize / 1024 / 1024}MB.`);
        } else if (error.code === "file-invalid-type") {
          toast.error(`File "${file.name}" has an invalid type. Only PDF, DOCX, and TXT files are allowed.`);
        } else {
          toast.error(`Error with file "${file.name}": ${error.message}`);
        }
      });
    });

    // Handle accepted files
    const newFiles: FileWithProgress[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
      id: Math.random().toString(36).substr(2, 9),
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Upload each file
    newFiles.forEach((fileWithProgress) => {
      uploadFile(fileWithProgress);
    });
  }, [maxSize]);

  const uploadFile = async (fileWithProgress: FileWithProgress) => {
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileWithProgress.id
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const response = await uploadMutation.mutateAsync(fileWithProgress.file);

      clearInterval(progressInterval);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, progress: 100, status: "success" }
            : f
        )
      );

      toast.success(`"${fileWithProgress.file.name}" uploaded successfully!`);
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { 
                ...f, 
                status: "error", 
                error: error.message || "Upload failed" 
              }
            : f
        )
      );

      toast.error(`Failed to upload "${fileWithProgress.file.name}"`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxSize,
    maxFiles,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: FileWithProgress["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <File className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive 
                ? "border-[#5A2ECF] bg-[#f2edff] scale-105" 
                : "border-gray-300 hover:border-[#6640d0] hover:bg-[#f5f1ff]"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-[#e5dcfe] rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-[#5A2ECF]" />
              </div>
              
              {isDragActive ? (
                <div>
                  <h3 className="text-lg font-semibold text-[#5A2ECF]">Drop files here!</h3>
                  <p className="text-sm text-gray-600">Release to upload your documents</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Drag & drop your documents here
                  </h3>
                  <p className="text-sm text-gray-600">
                    or <span className="font-medium text-[#5A2ECF]">click to browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports PDF, DOCX, DOC, TXT • Max {maxSize / 1024 / 1024}MB per file • Up to {maxFiles} files
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Uploading Files</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAll}
                disabled={files.some(f => f.status === "uploading")}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3">
              {files.map((fileWithProgress) => (
                <div key={fileWithProgress.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(fileWithProgress.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileWithProgress.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileWithProgress.file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileWithProgress.id)}
                      disabled={fileWithProgress.status === "uploading"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {fileWithProgress.status === "uploading" && (
                    <Progress value={fileWithProgress.progress} className="h-2" />
                  )}
                  
                  {fileWithProgress.status === "error" && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileWithProgress.error}
                    </p>
                  )}
                  
                  {fileWithProgress.status === "success" && (
                    <p className="text-xs text-green-600 mt-1">
                      Upload completed successfully!
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
