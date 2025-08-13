'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText, HelpCircle, Zap, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  AnalysisForm, 
  AnalysisResults, 
  QuizInterface, 
  FlashcardInterface 
} from '@/components/analysis'
import { useQuery } from '@tanstack/react-query'
import { getAnalysisTypes, AnalysisResult, AnalysisType } from '@/lib/api/analysis'

const analysisIcons: Record<string, typeof Brain> = {
  summary: Brain,
  explanation: FileText,
  quiz: HelpCircle,
  keywords: Zap,
  flashcards: Zap
}

export default function AnalysisPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('form')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [analysisType, setAnalysisType] = useState(searchParams.get('type') || 'summary')

  // Fetch available analysis types
  const { data: analysisTypes } = useQuery({
    queryKey: ['analysisTypes'],
    queryFn: getAnalysisTypes,
  })

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && analysisTypes?.some((t: AnalysisType) => t.type === type)) {
      setAnalysisType(type)
    }
  }, [searchParams, analysisTypes])

  const handleAnalysisComplete = (results: AnalysisResult) => {
    setAnalysisResults(results)
    
    // Navigate to appropriate results tab based on analysis type
    if (results.type === 'quiz') {
      setActiveTab('quiz')
    } else if (results.type === 'flashcards') {
      setActiveTab('flashcards')
    } else {
      setActiveTab('results')
    }
  }

  const currentAnalysisType = analysisTypes?.find((t: AnalysisType) => t.type === analysisType)
  const IconComponent = analysisIcons[analysisType] || Brain

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div className="flex items-center space-x-3">
            <IconComponent className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {currentAnalysisType?.name || 'AI Analysis'}
              </h1>
              <p className="text-muted-foreground">
                {currentAnalysisType?.description || 'Generate AI-powered insights from your documents'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Type Selector */}
      {analysisTypes && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Type</CardTitle>
            <CardDescription>
              Choose the type of analysis you want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {analysisTypes.map((type) => {
                const Icon = analysisIcons[type.type] || Brain
                return (
                  <Button
                    key={type.type}
                    variant={analysisType === type.type ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                    onClick={() => {
                      setAnalysisType(type.type)
                      setAnalysisResults(null)
                      setActiveTab('form')
                    }}
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="form">Generate</TabsTrigger>
          <TabsTrigger value="results" disabled={!analysisResults || analysisResults.type === 'quiz'}>
            Results
          </TabsTrigger>
          <TabsTrigger value="quiz" disabled={!analysisResults || analysisResults.type !== 'quiz'}>
            Interactive Quiz
          </TabsTrigger>
          <TabsTrigger value="flashcards" disabled={!analysisResults || analysisResults.type !== 'flashcards'}>
            Flashcards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-6">
          <AnalysisForm
            analysisType={analysisType}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {analysisResults && (
            <AnalysisResults
              results={analysisResults}
              onRegenerate={() => setActiveTab('form')}
            />
          )}
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          {analysisResults && analysisResults.type === 'quiz' && (
            <QuizInterface
              quizData={analysisResults}
              onRestart={() => setActiveTab('form')}
            />
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="space-y-6">
          {analysisResults && analysisResults.type === 'flashcards' && (
            <FlashcardInterface
              flashcardData={analysisResults}
              onRestart={() => setActiveTab('form')}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
