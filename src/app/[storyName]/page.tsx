'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Container, Text, Button, useToast, Box, VStack } from '@chakra-ui/react'
import { useLanguage } from '@/context/LanguageContext'
import { useParams } from 'next/navigation'
import styled from '@emotion/styled'
import { SessionManager } from '@/app/utils/sessionStorage'
import Loader from '@/components/Loader'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PreloadRequest {
  sessionId: string
  storyName: string
  language?: string
  conversationHistory: Message[]
  choices: number[]
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
  action?: string
}

interface StoryState {
  sessionId: string
  currentStep: StoryStep | null
  conversationHistory: Message[]
  isLoading: boolean
  isTyping: boolean
  displayText: string
  isPreloading: boolean
  preloadedSteps: Record<number, StoryStep>
  showShimmer: boolean
}

const ShimmerOverlay = styled.div<{ show: boolean }>`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #8c1c84, transparent);
  animation: ${props => (props.show ? 'shimmer 1s ease-in-out' : 'none')};
  pointer-events: none;

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
`

const FlashOverlay = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  z-index: 999;
  opacity: ${props => (props.show ? 1 : 0)};
  transition: opacity 0.5s ease;
  pointer-events: none;
`

const OptionContainer = styled(Box)<{ disabled: boolean }>`
  position: relative;
  overflow: hidden;
  pointer-events: ${props => (props.disabled ? 'none' : 'auto')};
`

const StoryContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 20px;
  padding-top: 50px;
  position: relative;

  @media (min-width: 768px) {
    padding-left: 5%; /* Adjust this percentage */
    padding-right: 5%; /* Adjust this percentage */
  }
`

const TypingText = styled(Text)`
  font-size: 20px;
  line-height: 1.6;
  margin-bottom: 30px;
  text-align: left;
  min-height: 200px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 3px;
  width: 100%;
`

const OptionsGrid = styled(VStack)`
  width: 100%;
  gap: 18px;
  align-items: stretch;
`

const OptionButton = styled(Button)`
  width: 100%;
  max-width: none;
  padding: 10px 14px;
  font-size: 16px;
  background: transparent;
  color: white;
  border: 2px solid #45a2f8;
  border-radius: 10px;
  transition: all 0.3s ease;
  white-space: normal;
  word-wrap: break-word;
  min-height: 60px;
  height: auto;
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;

  &:hover:not(:disabled) {
    background: rgba(140, 28, 132, 0.1);
    border-color: #8c1c84;
  }

  &:disabled {
    opacity: 1;
    cursor: not-allowed;
    color: #45a2f8;
    border-color: white;
  }

  & > * {
    text-align: left;
    width: 100%;
  }
`

const LoadingBox = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

// Map frontend language codes to API language names
const getLanguageName = (langCode: string): string => {
  const mapping: Record<string, string> = {
    en: 'English',
    zh: 'Chinese',
    hi: 'Hindi',
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic',
    bn: 'Bengali',
    ru: 'Russian',
    pt: 'Portuguese',
    ur: 'Urdu',
  }
  return mapping[langCode] || 'French'
}

// Local storage functions
const saveConversationHistory = (sessionId: string, history: Message[]) => {
  try {
    localStorage.setItem(`conversation_${sessionId}`, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save conversation history:', error)
  }
}

const loadConversationHistory = (sessionId: string): Message[] => {
  try {
    const stored = localStorage.getItem(`conversation_${sessionId}`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load conversation history:', error)
    return []
  }
}

// Create heart element for milestone celebration
const createHeart = () => {
  const heart = document.createElement('div')
  heart.innerText = '❤️'
  heart.style.position = 'fixed'
  heart.style.fontSize = `${Math.random() * 30 + 30}px`
  heart.style.left = `${Math.random() * 100}vw`
  heart.style.top = '-30px'
  heart.style.zIndex = '1000'
  heart.style.userSelect = 'none'
  heart.style.pointerEvents = 'none'

  const duration = 5

  // Apply animation
  heart.animate(
    [
      {
        transform: `translate(0, 0) rotate(0deg)`,
        opacity: 1,
      },
      {
        transform: `translate(${Math.random() * 10 - 5}px, ${window.innerHeight * 0.5}px) rotate(${Math.random() * 60 - 30}deg)`,
        opacity: 1,
      },
      {
        transform: `translate(${Math.random() * 20 - 10}px, ${window.innerHeight + 50}px) rotate(${Math.random() * 100 - 50}deg)`,
        opacity: 0,
      },
    ],
    {
      duration: duration * 1000,
      easing: 'cubic-bezier(0.1, 0.8, 0.8, 1)',
      fill: 'forwards',
    }
  )

  document.body.appendChild(heart)

  // Remove the heart element when animation completes
  setTimeout(() => {
    if (heart.parentNode) {
      heart.parentNode.removeChild(heart)
    }
  }, duration * 1000)
}

// Trigger milestone celebration
const triggerMilestoneCelebration = () => {
  console.log('🎉 Starting milestone celebration!')

  for (let i = 0; i < 150; i++) {
    setTimeout(() => createHeart(), i * 20)
  }
}

// Typing effect component
const TypingEffect: React.FC<{
  text: string
  speed?: number
  onComplete?: () => void
}> = ({ text, speed = 50, onComplete }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Update the ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reset when text changes
  useEffect(() => {
    setDisplayText('')
    setCurrentIndex(0)
    setIsComplete(false)
  }, [text])

  // Handle typing animation
  useEffect(() => {
    if (currentIndex < text.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true)
      if (onCompleteRef.current) {
        onCompleteRef.current()
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentIndex, text.length, speed, isComplete])

  return <span>{displayText}</span>
}

export default function StoryPage() {
  const params = useParams()
  const toast = useToast()
  const { language } = useLanguage()
  const [state, setState] = useState<StoryState>({
    sessionId: '',
    currentStep: null,
    conversationHistory: [],
    isLoading: false,
    isTyping: true,
    displayText: '',
    isPreloading: false,
    preloadedSteps: {},
    showShimmer: false,
  })
  const [showFlash, setShowFlash] = useState(false)

  const languageName = getLanguageName(language)
  const storyName = Array.isArray(params?.storyName) ? params.storyName[0] : params?.storyName || ''

  // Initialize story session
  useEffect(() => {
    if (!storyName) return

    const sessionId = SessionManager.getOrCreateSessionId(storyName)
    const savedHistory = loadConversationHistory(sessionId)

    setState(prev => ({
      ...prev,
      sessionId,
      conversationHistory: savedHistory,
    }))

    if (savedHistory.length > 0) {
      // Load from saved conversation
      loadFromHistory(sessionId, savedHistory)
    } else {
      // Start new story
      loadInitialStory(sessionId)
    }
  }, [storyName, language])

  const loadFromHistory = async (sessionId: string, history: Message[]) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          storyName,
          language: languageName,
          conversationHistory: history,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setState(prev => ({
          ...prev,
          currentStep: data.currentStep,
          conversationHistory: data.conversationHistory,
          isLoading: false,
          isTyping: true,
        }))

        // Start preloading after loading from history
        startPreloading(sessionId, data.conversationHistory)
      } else {
        throw new Error(data.error || 'Failed to load from history')
      }
    } catch (error) {
      console.error('Error loading from history:', error)
      // Fallback to new story
      loadInitialStory(sessionId)
    }
  }

  const loadInitialStory = async (sessionId: string) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          storyName,
          language: languageName,
          forceRestart: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const newHistory = data.conversationHistory
        saveConversationHistory(sessionId, newHistory)

        setState(prev => ({
          ...prev,
          currentStep: data.currentStep,
          conversationHistory: newHistory,
          isLoading: false,
          isTyping: true,
        }))

        // Start preloading after initial story loads
        startPreloading(sessionId, newHistory)
      } else {
        throw new Error(data.error || 'Failed to load story')
      }
    } catch (error) {
      console.error('Error loading story:', error)
      toast({
        title: 'Error',
        description: 'Failed to load story. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const startPreloading = async (sessionId: string, conversationHistory: Message[]) => {
    try {
      setState(prev => ({ ...prev, isPreloading: true }))

      const preloadRequest: PreloadRequest = {
        sessionId,
        storyName,
        language: languageName,
        conversationHistory,
        choices: [1, 2, 3],
      }

      const response = await fetch('/api/story/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preloadRequest),
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Preloading completed:', data.summary)
        setState(prev => ({
          ...prev,
          preloadedSteps: data.preloadedSteps,
          isPreloading: false,
          showShimmer: true,
        }))

        // Hide shimmer after animation
        setTimeout(() => {
          setState(prev => ({ ...prev, showShimmer: false }))
        }, 1500)
      } else {
        console.warn('⚠️ Preloading failed:', data.error)
        setState(prev => ({ ...prev, isPreloading: false }))
      }
    } catch (error) {
      console.error('❌ Preloading error:', error)
      setState(prev => ({ ...prev, isPreloading: false }))
    }
  }

  const handleChoice = async (choiceNumber: number) => {
    if (state.isLoading || state.isPreloading || state.isTyping) return

    // Check if we have preloaded data for this choice
    const preloadedStep = state.preloadedSteps[choiceNumber]

    if (preloadedStep) {
      console.log(`🚀 Using preloaded data for choice ${choiceNumber}`)

      // Update conversation history with the choice
      const newHistory: Message[] = [
        ...state.conversationHistory,
        { role: 'user', content: `Choice ${choiceNumber}` },
        {
          role: 'assistant',
          content: JSON.stringify({
            desc: preloadedStep.desc,
            options: preloadedStep.options,
            action: preloadedStep.action,
          }),
        },
      ]

      // Save conversation history
      saveConversationHistory(state.sessionId, newHistory)

      setState(prev => ({
        ...prev,
        currentStep: preloadedStep,
        conversationHistory: newHistory,
        preloadedSteps: {}, // Clear preloaded steps
        showShimmer: false,
        isTyping: true,
      }))

      // Update session storage
      SessionManager.updateLastAccessed(state.sessionId)

      // Start preloading for the next set of choices
      startPreloading(state.sessionId, newHistory)

      return
    }

    // Fallback to API call if no preloaded data
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          choice: choiceNumber,
          storyName,
          language: languageName,
          conversationHistory: state.conversationHistory,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const newHistory =
          data.conversationHistory.length > 0 ? data.conversationHistory : state.conversationHistory

        // Save conversation history
        saveConversationHistory(state.sessionId, newHistory)

        setState(prev => ({
          ...prev,
          currentStep: data.currentStep,
          conversationHistory: newHistory,
          isLoading: false,
          isTyping: true,
          preloadedSteps: {}, // Clear preloaded steps
        }))

        SessionManager.updateLastAccessed(state.sessionId)

        // Start preloading for the next set of choices
        startPreloading(state.sessionId, newHistory)
      } else {
        throw new Error(data.error || 'Failed to process choice')
      }
    } catch (error) {
      console.error('Error processing choice:', error)
      toast({
        title: 'Wooops',
        description: 'Something went wrong. Sorry for that! Please try again.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleTypingComplete = () => {
    setState(prev => ({ ...prev, isTyping: false }))

    // Log action if present and trigger celebration when description appears
    if (state.currentStep?.action) {
      console.log(`🎯 Action: ${state.currentStep.action}`)

      // Special handling for milestones
      if (state.currentStep.action === 'milestone') {
        console.log('🏆 MILESTONE REACHED!')
        // Trigger the celebration effect
        triggerMilestoneCelebration()
      }
    }
  }

  if (state.isLoading && !state.currentStep) {
    return (
      <StoryContainer>
        <Loader />
      </StoryContainer>
    )
  }

  if (!state.currentStep) {
    return (
      <StoryContainer>
        <Loader />
      </StoryContainer>
    )
  }

  const isChoiceDisabled = state.isLoading || state.isPreloading || state.isTyping

  return (
    <>
      <FlashOverlay show={showFlash} />
      <StoryContainer>
        <TypingText>
          <TypingEffect text={state.currentStep.desc} speed={5} onComplete={handleTypingComplete} />
        </TypingText>

        {!state.isTyping && (
          <OptionsGrid>
            {state.currentStep.options.map((option, index) => (
              <OptionContainer
                key={index}
                disabled={isChoiceDisabled}
                onClick={() => !isChoiceDisabled && handleChoice(index + 1)}
              >
                <OptionButton disabled={isChoiceDisabled}>{option}</OptionButton>
                <ShimmerOverlay show={state.showShimmer} />
              </OptionContainer>
            ))}
          </OptionsGrid>
        )}

        {state.isLoading && !state.currentStep && <Loader />}
      </StoryContainer>
    </>
  )
}
