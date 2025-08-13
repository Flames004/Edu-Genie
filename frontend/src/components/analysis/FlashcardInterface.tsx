'use client'

import { useState, useEffect } from 'react'
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
  Brain
} from 'lucide-react'
import { AnalysisResult, parseFlashcards, FlashCard } from '@/lib/api/analysis'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FlashcardInterfaceProps {
  flashcardData: AnalysisResult
  onRestart: () => void
}

interface StudySession {
  currentCard: number
  showBack: boolean
  masteredCards: Set<number>
  difficultCards: Set<number>
  shuffled: boolean
}

export function FlashcardInterface({ flashcardData, onRestart }: FlashcardInterfaceProps) {
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [originalOrder, setOriginalOrder] = useState<FlashCard[]>([])
  const [session, setSession] = useState<StudySession>({
    currentCard: 0,
    showBack: false,
    masteredCards: new Set(),
    difficultCards: new Set(),
    shuffled: false
  })

  useEffect(() => {
    const parsedCards = parseFlashcards(flashcardData.result)
    if (parsedCards.length === 0) {
      toast.error("No flashcards could be parsed from the analysis")
      return
    }
    setFlashcards(parsedCards)
    setOriginalOrder(parsedCards)
  }, [flashcardData.result])

  const handleFlip = () => {
    setSession(prev => ({ ...prev, showBack: !prev.showBack }))
  }

  const handleNext = () => {
    if (session.currentCard < flashcards.length - 1) {
      setSession(prev => ({
        ...prev,
        currentCard: prev.currentCard + 1,
        showBack: false
      }))
    } else {
      setSession(prev => ({ ...prev, currentCard: 0, showBack: false }))
    }
  }

  const handlePrevious = () => {
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
  }

  const handleMastered = () => {
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
  }

  const handleDifficult = () => {
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
  }

  const handleShuffle = () => {
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
  }

  const handleReset = () => {
    setSession({
      currentCard: 0,
      showBack: false,
      masteredCards: new Set(),
      difficultCards: new Set(),
      shuffled: false
    })
    setFlashcards(originalOrder)
    toast.success("Session reset!")
  }

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
                Card {session.currentCard + 1} of {flashcards.length}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
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
          <div className="flex justify-center space-x-2">
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
              onClick={onRestart}
            >
              <Brain className="mr-2 h-4 w-4" />
              New Set
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <Card 
            className={cn(
              "min-h-[400px] cursor-pointer transition-all duration-300 hover:shadow-lg",
              session.masteredCards.has(session.currentCard) && "ring-2 ring-green-500",
              session.difficultCards.has(session.currentCard) && "ring-2 ring-red-500"
            )}
            onClick={handleFlip}
          >
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                {session.showBack ? (
                  <>
                    <EyeOff className="h-5 w-5" />
                    <span>Back</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    <span>Front</span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                Click to flip • Use buttons to navigate
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[250px]">
              <div className="text-center space-y-4">
                <p className="text-lg leading-relaxed">
                  {session.showBack ? currentCard.back : currentCard.front}
                </p>
                {!session.showBack && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFlip()
                    }}
                    className="text-muted-foreground"
                  >
                    Click to reveal answer
                  </Button>
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
        </CardContent>
      </Card>
    </div>
  )
}
