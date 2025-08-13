'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Copy, 
  Download, 
  RefreshCw, 
  Clock, 
  FileText, 
  BarChart3,
  CheckCircle
} from 'lucide-react'
import { AnalysisResult } from '@/lib/api/analysis'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AnalysisResultsProps {
  results: AnalysisResult
  onRegenerate: () => void
}

export function AnalysisResults({ results, onRegenerate }: AnalysisResultsProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(results.result)
      toast.success("Copied to clipboard!")
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleDownload = () => {
    setIsDownloading(true)
    try {
      const blob = new Blob([results.result], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${results.type}-analysis-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Analysis downloaded successfully!")
    } catch {
      toast.error("Failed to download analysis")
    } finally {
      setIsDownloading(false)
    }
  }

  const getAnalysisTypeInfo = (type: string) => {
    const types: Record<string, { name: string; description: string; color: string }> = {
      summary: {
        name: 'Summary',
        description: 'Concise overview of main points',
        color: 'bg-blue-500'
      },
      explanation: {
        name: 'Explanation',
        description: 'Detailed breakdown and clarification',
        color: 'bg-green-500'
      },
      quiz: {
        name: 'Quiz',
        description: 'Interactive questions and answers',
        color: 'bg-purple-500'
      },
      keywords: {
        name: 'Keywords',
        description: 'Important terms and concepts',
        color: 'bg-orange-500'
      },
      flashcards: {
        name: 'Flashcards',
        description: 'Study cards for memorization',
        color: 'bg-pink-500'
      }
    }
    return types[type] || { name: type, description: 'AI-generated analysis', color: 'bg-gray-500' }
  }

  const typeInfo = getAnalysisTypeInfo(results.type)
  const formattedDate = results.timestamp 
    ? new Date(results.timestamp).toLocaleString() 
    : 'Unknown date'

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-lg text-white", typeInfo.color)}>
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{typeInfo.name} Analysis</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </CardTitle>
                <CardDescription>{typeInfo.description}</CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{(results.wordCount || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{(results.textLength || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Characters</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Analysis</p>
                <p className="text-xs text-muted-foreground">Gemini 2.5 Flash</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analysis Results</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Regenerate</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full rounded-md border p-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {results.result}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Insights</CardTitle>
          <CardDescription>
            Key metrics and information about this analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Content Metrics</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Input word count: {(results.wordCount || 0).toLocaleString()}</p>
                <p>• Character count: {(results.textLength || 0).toLocaleString()}</p>
                <p>• Estimated reading time: {Math.ceil((results.wordCount || 0) / 200)} minutes</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Analysis Details</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Analysis type: {typeInfo.name}</p>
                <p>• Generated on: {formattedDate}</p>
                <p>• AI model: Gemini 2.5 Flash</p>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <span>Need a different analysis?</span>
            <Button 
              variant="link" 
              onClick={onRegenerate}
              className="p-0 h-auto font-medium"
            >
              Generate new analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
