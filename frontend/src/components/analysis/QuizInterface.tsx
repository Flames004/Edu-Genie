'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy,
  Clock,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { AnalysisResult, parseQuizQuestions, QuizQuestion, saveQuizResult, QuizResultData, debugQuizParsing } from '@/lib/api/analysis'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuizInterfaceProps {
  quizData: AnalysisResult
  onRestart: () => void
  documentId?: string
}

interface QuizState {
  currentQuestion: number
  answers: (number | null)[]
  showResults: boolean
  startTime: Date
  endTime?: Date
}

export function QuizInterface({ quizData, onRestart, documentId }: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: [],
    showResults: false,
    startTime: new Date()
  })

  useEffect(() => {
    const parsedQuestions = parseQuizQuestions(quizData.result)
    if (parsedQuestions.length === 0) {
      // Debug the parsing if no questions found
      debugQuizParsing(quizData.result)
      toast.error("No quiz questions could be parsed from the analysis")
      return
    }
    
    // Log parsed questions for debugging
    console.log('Parsed quiz questions:', parsedQuestions)
    
    // Validate correct answers
    parsedQuestions.forEach((q, index) => {
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        console.error(`Question ${index + 1}: Invalid correct answer index ${q.correctAnswer} for ${q.options.length} options`)
      } else {
        console.log(`Question ${index + 1}: Correct answer is "${q.options[q.correctAnswer]}" (index ${q.correctAnswer})`)
      }
    })
    
    setQuestions(parsedQuestions)
    setQuizState(prev => ({
      ...prev,
      answers: new Array(parsedQuestions.length).fill(null)
    }))
  }, [quizData.result])

  const handleAnswerSelect = (answerIndex: number) => {
    setQuizState(prev => {
      const newAnswers = [...prev.answers]
      newAnswers[prev.currentQuestion] = answerIndex
      return { ...prev, answers: newAnswers }
    })
  }

  const handleNext = () => {
    if (quizState.currentQuestion < questions.length - 1) {
      setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }))
    } else {
      // Finish quiz
      const endTime = new Date()
      setQuizState(prev => ({
        ...prev,
        showResults: true,
        endTime
      }))
      
      // Save quiz result to backend if documentId is available
      if (documentId) {
        const score = calculateScore()
        const timeSpent = Math.round((endTime.getTime() - quizState.startTime.getTime()) / 1000)
        
        const answers = questions.map((question, index) => ({
          questionIndex: index,
          selectedAnswer: quizState.answers[index] ?? -1,
          correctAnswer: question.correctAnswer,
          isCorrect: quizState.answers[index] === question.correctAnswer
        }))

        const quizResultData: QuizResultData = {
          documentId,
          score,
          timeSpent,
          answers
        }

        saveQuizResult(quizResultData)
          .then(() => {
            toast.success("Quiz result saved!")
          })
          .catch((error) => {
            console.warn("Failed to save quiz result:", error)
            // Don't show error to user as this is not critical
          })
      }
    }
  }

  const handlePrevious = () => {
    if (quizState.currentQuestion > 0) {
      setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }))
    }
  }

  const handleRestart = () => {
    setQuizState({
      currentQuestion: 0,
      answers: new Array(questions.length).fill(null),
      showResults: false,
      startTime: new Date()
    })
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((question, index) => {
      if (quizState.answers[index] === question.correctAnswer) {
        correct++
      }
    })
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (percentage: number) => {
    if (percentage >= 80) return 'default'
    if (percentage >= 60) return 'secondary'
    return 'destructive'
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Quiz Generation Failed</span>
          </CardTitle>
          <CardDescription>
            Unable to generate quiz questions from the analysis content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRestart}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quizState.showResults) {
    const score = calculateScore()
    const duration = quizState.endTime 
      ? Math.round((quizState.endTime.getTime() - quizState.startTime.getTime()) / 1000)
      : 0
    
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10 dark:bg-primary/20">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">Quiz Complete!</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-gray-400">
              Here are your results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className={cn("text-4xl font-bold", getScoreColor(score.percentage), "dark:text-gray-100")}>
                {score.percentage}%
              </div>
              <div className="space-y-2">
                <Badge variant={getScoreBadgeVariant(score.percentage)} className="text-sm px-3 py-1 dark:text-gray-100">
                  {score.correct} out of {score.total} correct
                </Badge>
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={handleRestart} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Quiz
              </Button>
              <Button onClick={onRestart}>
                Generate New Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Question Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Question Review</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-gray-400">
              Review your answers and see explanations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = quizState.answers[index]
              const isCorrect = userAnswer === question.correctAnswer
              
              return (
                <div key={index} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium",
                      isCorrect ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                    )}>
                      {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{question.question}</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex
                          const isCorrectAnswer = optionIndex === question.correctAnswer
                          
                          return (
                            <div
                              key={optionIndex}
                              className={cn(
                                "p-3 rounded-lg border-2",
                                isCorrectAnswer && "border-green-500 bg-green-50 dark:bg-green-900",
                                isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-50 dark:bg-red-900",
                                !isCorrectAnswer && !isUserAnswer && "border-gray-200 dark:border-gray-700"
                              )}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">{option}</span>
                                {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
                                {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600 ml-auto" />}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {question.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < questions.length - 1 && <Separator />}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[quizState.currentQuestion]
  const progress = ((quizState.currentQuestion + 1) / questions.length) * 100
  const userAnswer = quizState.answers[quizState.currentQuestion]

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Interactive Quiz</span>
              </CardTitle>
              <CardDescription>
                Question {quizState.currentQuestion + 1} of {questions.length}
              </CardDescription>
            </div>
            <Badge variant="outline">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all",
                  userAnswer === index 
                    ? "border-primary bg-primary/5 dark:bg-primary/20" 
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-[#232326]"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium",
                    userAnswer === index
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-gray-300 dark:border-gray-700"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={quizState.currentQuestion === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={userAnswer === null}
            >
              {quizState.currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
