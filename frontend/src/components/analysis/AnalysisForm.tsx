'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Upload, Brain, Loader2, AlertCircle } from 'lucide-react'
import { analyzeText, analyzeFile, reAnalyzeDocument, AnalysisResult } from '@/lib/api/analysis'
import { documentsApi } from '@/lib/api/documents'
import { Document } from '@/types'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface AnalysisFormProps {
  analysisType: string
  onAnalysisComplete: (results: AnalysisResult & { documentId?: string }) => void
}

export function AnalysisForm({ analysisType, onAnalysisComplete }: AnalysisFormProps) {
  const [inputMethod, setInputMethod] = useState<'text' | 'file' | 'document'>('text')
  const [textInput, setTextInput] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [progress, setProgress] = useState(0)

  // Fetch user documents for re-analysis
  const { data: documentsResponse } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: () => documentsApi.getDocuments(),
    enabled: inputMethod === 'document'
  })

  const documents = documentsResponse?.documents || []

  // Text analysis mutation
  const textMutation = useMutation({
    mutationFn: (data: { type: string; text: string }) => analyzeText(data),
    onSuccess: (data) => {
      onAnalysisComplete(data)
      toast.success("Analysis Complete", {
        description: "Your text has been analyzed successfully.",
      })
    },
    onError: (error: Error) => {
      toast.error("Analysis Failed", {
        description: error.message || "Failed to analyze text",
      })
    }
  })

  // File analysis mutation  
  const fileMutation = useMutation({
    mutationFn: (data: { file: File; type: string }) => analyzeFile(data.file, data.type),
    onSuccess: (data) => {
      onAnalysisComplete(data)
      toast.success("Analysis Complete", {
        description: "Your file has been analyzed successfully.",
      })
    },
    onError: (error: Error) => {
      toast.error("Analysis Failed", {
        description: error.message || "Failed to analyze file",
      })
    }
  })

  // Document re-analysis mutation
  const documentMutation = useMutation({
    mutationFn: (data: { documentId: string; type: string }) => 
      reAnalyzeDocument(data.documentId, data.type),
    onSuccess: (data, variables) => {
      onAnalysisComplete({ ...data, documentId: variables.documentId })
      toast.success("Analysis Complete", {
        description: "Your document has been re-analyzed successfully.",
      })
    },
    onError: (error: Error) => {
      toast.error("Analysis Failed", {
        description: error.message || "Failed to analyze document",
      })
    }
  })

  // Simulate progress for better UX
  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 500)

    return () => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  // Dropzone for file upload
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (files) => {
      if (files.length > 0) {
        handleFileAnalysis(files[0])
      }
    }
  })

  const handleTextAnalysis = () => {
    if (!textInput.trim()) {
      toast.error("No Text Provided", {
        description: "Please enter some text to analyze.",
      })
      return
    }

    const cleanup = simulateProgress()
    textMutation.mutate({ type: analysisType, text: textInput.trim() })
    cleanup()
  }

  const handleFileAnalysis = (file: File) => {
    const cleanup = simulateProgress()
    fileMutation.mutate({ file, type: analysisType })
    cleanup()
  }

  const handleDocumentAnalysis = () => {
    if (!selectedDocument) {
      toast.error("No Document Selected", {
        description: "Please select a document to analyze.",
      })
      return
    }

    const cleanup = simulateProgress()
    documentMutation.mutate({ documentId: selectedDocument, type: analysisType })
    cleanup()
  }

  const isLoading = textMutation.isPending || fileMutation.isPending || documentMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Generate Analysis</span>
        </CardTitle>
        <CardDescription>
          Choose your input method and generate AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Method Selection */}
        <div className="space-y-2">
          <Label>Input Method</Label>
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'text' | 'file' | 'document')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Saved Document</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Enter Text</Label>
                <Textarea
                  id="text-input"
                  placeholder="Paste or type the text you want to analyze..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {textInput.length} characters
                </p>
              </div>
              <Button 
                onClick={handleTextAnalysis}
                disabled={isLoading || !textInput.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Text
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive && "border-primary bg-primary/5",
                  acceptedFiles.length > 0 && "border-green-500 bg-green-50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {acceptedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">
                      File selected: {acceptedFiles[0].name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(acceptedFiles[0].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-sm text-primary">Drop the file here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drag & drop a file here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PDF, DOC, DOCX, TXT (max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="document" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-select">Select Document</Label>
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a saved document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents?.map((doc: Document) => (
                      <SelectItem key={doc._id} value={doc._id}>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{doc.originalName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleDocumentAnalysis}
                disabled={isLoading || !selectedDocument}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Document
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Progress Indicator */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Analysis Type Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will generate a <strong>{analysisType}</strong> based on your input.
            Processing may take a few moments depending on the content length.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
