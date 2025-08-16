'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Zap, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Shuffle,
  CheckCircle,
  XCircle,
  Brain,
  Clock,
  Target,
  Download
} from 'lucide-react'
import { AnalysisResult, parseFlashcards, FlashCard, saveFlashcardStudyTime } from '@/lib/api/analysis'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useQueryClient } from "@tanstack/react-query"

// Update props to include documentId
interface FlashcardInterfaceProps {
  flashcardData: AnalysisResult
  documentId: string
  onRestart: () => void
}

interface StudySession {
  currentCard: number
  showBack: boolean
  masteredCards: Set<number>
  difficultCards: Set<number>
  shuffled: boolean
  startTime: Date
  studyMode: 'sequential' | 'shuffle' | 'difficult'
}

export function FlashcardInterface({ flashcardData, documentId, onRestart }: FlashcardInterfaceProps) {
  const queryClient = useQueryClient();
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [originalOrder, setOriginalOrder] = useState<FlashCard[]>([])
  const [session, setSession] = useState<StudySession>({
    currentCard: 0,
    showBack: false,
    masteredCards: new Set(),
    difficultCards: new Set(),
    shuffled: false,
    startTime: new Date(),
    studyMode: 'sequential'
  })
  const [studyTime, setStudyTime] = useState(0)

  const formatStudyTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFlip = useCallback(() => {
    setSession(prev => ({ ...prev, showBack: !prev.showBack }))
  }, [])

  const handleNext = useCallback(() => {
    if (session.currentCard < flashcards.length - 1) {
      setSession(prev => ({
        ...prev,
        currentCard: prev.currentCard + 1,
        showBack: false
      }))
    } else {
      setSession(prev => ({ ...prev, currentCard: 0, showBack: false }))
    }
  }, [session.currentCard, flashcards.length])

  const handlePrevious = useCallback(() => {
    if (session.currentCard > 0) {
      setSession(prev => ({
        ...prev,
        currentCard: prev.currentCard - 1,
        showBack: false
      }))
    } else {
      setSession(prev => ({ 
        ...prev, 
        currentCard: flashcards.length - 1,
        showBack: false 
      }))
    }
  }, [session.currentCard, flashcards.length])

  const handleMastered = useCallback(() => {
    setSession(prev => {
      const newMastered = new Set(prev.masteredCards)
      const newDifficult = new Set(prev.difficultCards)
      
      newMastered.add(prev.currentCard)
      newDifficult.delete(prev.currentCard)
      
      return {
        ...prev,
        masteredCards: newMastered,
        difficultCards: newDifficult
      }
    })
    
    toast.success("Card marked as mastered!")
    handleNext()
  }, [handleNext])

  const handleDifficult = useCallback(() => {
    setSession(prev => {
      const newDifficult = new Set(prev.difficultCards)
      const newMastered = new Set(prev.masteredCards)
      
      newDifficult.add(prev.currentCard)
      newMastered.delete(prev.currentCard)
      
      return {
        ...prev,
        difficultCards: newDifficult,
        masteredCards: newMastered
      }
    })
    
    toast.error("Card marked as difficult - you'll see it more often")
    handleNext()
  }, [handleNext])

  const handleShuffle = useCallback(() => {
    if (session.shuffled) {
      // Restore original order
      setFlashcards(originalOrder)
      setSession(prev => ({ ...prev, shuffled: false, currentCard: 0, showBack: false }))
      toast.success("Restored original order")
    } else {
      // Shuffle cards
      const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
      setFlashcards(shuffled)
      setSession(prev => ({ ...prev, shuffled: true, currentCard: 0, showBack: false }))
      toast.success("Cards shuffled!")
    }
  }, [session.shuffled, originalOrder, flashcards])

  const handleReset = useCallback(() => {
    setSession({
      currentCard: 0,
      showBack: false,
      masteredCards: new Set(),
      difficultCards: new Set(),
      shuffled: false,
      startTime: new Date(),
      studyMode: 'sequential'
    })
    setFlashcards(originalOrder)
    setStudyTime(0)
    toast.success("Session reset!")
  }, [originalOrder])

  const handleDownload = useCallback(() => {
    const flashcardText = flashcards.map((card, index) => 
      `Card ${index + 1}:\nFront: ${card.front}\nBack: ${card.back}\n`
    ).join('\n')
    
    const blob = new Blob([flashcardText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Flashcards downloaded!')
  }, [flashcards])

  useEffect(() => {
    const parsedCards = parseFlashcards(flashcardData.result)
    if (parsedCards.length === 0) {
      toast.error("No flashcards could be parsed from the analysis")
      return
    }
    setFlashcards(parsedCards)
    setOriginalOrder(parsedCards)
  }, [flashcardData.result])

  // Study time tracking
  useEffect(() => {
    // Stop timer if all cards are mastered
    if (flashcards.length > 0 && session.masteredCards.size === flashcards.length) {
      return
    }

    const interval = setInterval(() => {
      setStudyTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [flashcards.length, session.masteredCards.size])

  // Post study time to backend when session ends
  useEffect(() => {
    if (flashcards.length > 0 && session.masteredCards.size === flashcards.length && studyTime > 0) {
      // Robust documentId validation and logging
      let validDocumentId = '';
      if (typeof documentId === 'string' && documentId.match(/^[a-fA-F0-9]{24}$/)) {
        validDocumentId = documentId;
      } else {
        console.error('Invalid documentId:', documentId);
        return;
      }
      if (typeof studyTime !== 'number' || studyTime <= 0) {
        console.error('Invalid study time:', studyTime);
        return;
      }
      saveFlashcardStudyTime({
        documentId: validDocumentId,
        timeSpent: studyTime
      }).then(res => {
        if (res.success) {
          toast.success('Flashcard study time saved!');
          queryClient.invalidateQueries({ queryKey: ['flashcard-results'] });
        } else {
          console.error('Failed to save flashcard study time:', res.message);
          toast.error('Could not save study time. Please try again.');
        }
      }).catch((err) => {
        console.error('Failed to save flashcard study time:', err);
        toast.error('Could not save study time. Please try again.');
      });
    }
  }, [flashcards.length, session.masteredCards.size, studyTime, documentId, queryClient])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (event.key) {
        case ' ': // Spacebar to flip
          event.preventDefault()
          handleFlip()
          break
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
        case '1':
          if (session.showBack) {
            event.preventDefault()
            handleDifficult()
          }
          break
        case '2':
          if (session.showBack) {
            event.preventDefault()
            handleMastered()
          }
          break
        case 's':
          event.preventDefault()
          handleShuffle()
          break
        case 'r':
          event.preventDefault()
          handleReset()
          break
        case 'd':
          event.preventDefault()
          handleDownload()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [session.showBack, handleFlip, handlePrevious, handleNext, handleDifficult, handleMastered, handleShuffle, handleReset, handleDownload])

  const progress = flashcards.length > 0 ? ((session.currentCard + 1) / flashcards.length) * 100 : 0
  const masteredCount = session.masteredCards.size
  const difficultCount = session.difficultCards.size

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Flashcard Generation Failed</span>
          </CardTitle>
          <CardDescription>
            Unable to generate flashcards from the analysis content.
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

  const currentCard = flashcards[session.currentCard]

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Study Flashcards</span>
              </CardTitle>
              <CardDescription>
                Card {session.currentCard + 1} of {flashcards.length} • {formatStudyTime(studyTime)} elapsed
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatStudyTime(studyTime)}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{masteredCount} mastered</span>
              </Badge>
              <Badge variant="outline" className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-600" />
                <span>{difficultCount} difficult</span>
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShuffle}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {session.shuffled ? 'Original Order' : 'Shuffle'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRestart}
              >
                <Brain className="mr-2 h-4 w-4" />
                New Set
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <div>Shortcuts: Space (flip) • ← → (navigate) • 1 (difficult) • 2 (mastered) • D (download)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card 
            className={cn(
              "min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg",
              session.showBack 
                ? "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200" 
                : "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200",
              session.masteredCards.has(session.currentCard) && "ring-2 ring-green-500",
              session.difficultCards.has(session.currentCard) && "ring-2 ring-red-500"
            )}
            onClick={handleFlip}
          >
            <CardContent className="flex items-center justify-center min-h-[400px] p-8">
              <div className="text-center space-y-6">
                <p className="text-xl leading-relaxed font-medium">
                  {session.showBack ? currentCard.back : currentCard.front}
                </p>
                {!session.showBack && (
                  <p className="text-sm text-muted-foreground">
                    Click to reveal answer
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation and Actions */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={handleFlip}
          >
            {session.showBack ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            Flip Card
          </Button>
          
          <Button
            variant="outline"
            onClick={handleNext}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Difficulty Actions */}
        {session.showBack && (
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={handleDifficult}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Difficult
            </Button>
            
            <Button
              onClick={handleMastered}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mastered
            </Button>
          </div>
        )}
      </div>

      {/* Study Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Study Progress</CardTitle>
          <CardDescription>
            Track your learning progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-gray-600">
                {flashcards.length - masteredCount - difficultCount}
              </div>
              <p className="text-sm text-muted-foreground">Not Reviewed</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {difficultCount}
              </div>
              <p className="text-sm text-muted-foreground">Need Practice</p>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {masteredCount}
              </div>
              <p className="text-sm text-muted-foreground">Mastered</p>
            </div>
          </div>
          
          {masteredCount + difficultCount > 0 && (
            <div className="mt-4">
              <div className="text-sm text-center text-muted-foreground mb-2">
                Completion: {Math.round(((masteredCount + difficultCount) / flashcards.length) * 100)}%
              </div>
              <Progress 
                value={((masteredCount + difficultCount) / flashcards.length) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Completion Celebration */}
          {masteredCount === flashcards.length && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center space-y-2">
                <Target className="h-8 w-8 text-green-600 mx-auto" />
                <h3 className="font-semibold text-green-800">🎉 Congratulations!</h3>
                <p className="text-sm text-green-700">
                  You&apos;ve mastered all {flashcards.length} flashcards in {formatStudyTime(studyTime)}!
                </p>
                <div className="flex justify-center space-x-2 mt-4">
                  <Button size="sm" onClick={handleReset} variant="outline">
                    Study Again
                  </Button>
                  <Button size="sm" onClick={onRestart}>
                    Create New Set
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
