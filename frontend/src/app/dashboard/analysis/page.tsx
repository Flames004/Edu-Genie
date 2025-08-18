'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText, HelpCircle, Zap, ArrowLeft, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisForm, AnalysisResults, QuizInterface, FlashcardInterface } from '@/components/analysis'
import { useQuery } from '@tanstack/react-query'
import { getAnalysisTypes, AnalysisResult, AnalysisType } from '@/lib/api/analysis'
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

const analysisIcons: Record<string, typeof Brain> = {
  summary: Brain,
  explanation: FileText,
  quiz: HelpCircle,
  keywords: Tags,
  flashcards: Zap,
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalysisPageContent />
    </Suspense>
  )
}

function AnalysisPageContent() {
  const searchParams = useSearchParams() // ✅ now inside suspense
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('form')
  const [analysisResults, setAnalysisResults] = useState<(AnalysisResult & { documentId?: string }) | null>(null)
  const [analysisType, setAnalysisType] = useState(searchParams.get('type') || 'summary')
  const defaultDocumentId = searchParams.get('documentId') || ''
  const lockDocument = !!defaultDocumentId

  const { data: analysisTypes } = useQuery({
    queryKey: ['analysisTypes'],
    queryFn: getAnalysisTypes,
  })

  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && analysisTypes?.some((t: AnalysisType) => t.type === type)) {
      setAnalysisType(type)
    }
  }, [searchParams, analysisTypes])

  const handleAnalysisComplete = (results: AnalysisResult & { documentId?: string }) => {
    setAnalysisResults(results)
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
    <div className="min-h-screen bg-background text-gray-900 dark:text-neutral-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          {/* Back Button and Theme Toggle */}
          <div className="flex items-center -mt-4 justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 hover:bg-muted/50 dark:text-neutral-100"
            >
              <ArrowLeft className="h-4 w-4 dark:text-neutral-100" />
              <span>Back to Dashboard</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="ml-2"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-500 dark:text-neutral-200" />
              )}
            </Button>
          </div>

          {/* Page Title and Description */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100">
                  {currentAnalysisType?.name || 'AI Analysis'}
                </h1>
                <p className="text-muted-foreground mt-1 dark:text-neutral-300">
                  {currentAnalysisType?.description || 'Generate AI-powered insights from your documents'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Type Selector */}
        {analysisTypes && (
          <Card className="shadow-sm bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100">
            <CardHeader>
              <CardTitle className="dark:text-neutral-100">Choose Analysis Type</CardTitle>
              <CardDescription className="dark:text-neutral-300">
                Select the type of analysis you want to perform on your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
                {analysisTypes.map((type) => {
                  const Icon = analysisIcons[type.type] || Brain
                  const isSelected = analysisType === type.type
                  return (
                    <Card
                      key={type.type}
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md dark:border-violet-400 dark:bg-neutral-900'
                          : 'border-border hover:border-primary/50 dark:border-neutral-700 dark:bg-neutral-900'
                      } text-gray-900 dark:text-neutral-100`}
                      onClick={() => {
                        setAnalysisType(type.type)
                        setAnalysisResults(null)
                        setActiveTab('form')
                      }}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center space-y-3 min-h-[160px] justify-between dark:bg-neutral-900">
                        <div
                          className={`p-3 rounded-full ${
                            isSelected ? 'bg-primary text-primary-foreground dark:bg-violet-400 dark:text-neutral-900' : 'bg-muted dark:bg-neutral-800 dark:text-neutral-100'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 flex-1 flex flex-col justify-center">
                          <h3 className={`font-semibold text-sm leading-tight ${isSelected ? 'text-primary dark:text-violet-300' : 'dark:text-neutral-100'}`}>
                            {type.name}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed dark:text-neutral-300">{type.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
              defaultDocumentId={defaultDocumentId}
              lockDocument={lockDocument}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {analysisResults && (
              <AnalysisResults results={analysisResults} onRegenerate={() => setActiveTab('form')} />
            )}
          </TabsContent>

          <TabsContent value="quiz" className="space-y-6">
            {analysisResults && analysisResults.type === 'quiz' && (
              <QuizInterface
                quizData={analysisResults}
                onRestart={() => setActiveTab('form')}
                documentId={analysisResults.documentId}
              />
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-6">
            {analysisResults && analysisResults.type === 'flashcards' && (
              <FlashcardInterface
                flashcardData={analysisResults}
                documentId={analysisResults.documentId ?? ''}
                onRestart={() => setActiveTab('form')}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
