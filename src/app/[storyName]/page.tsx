'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Container, Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, parseEther, formatEther } from 'ethers'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useParams } from 'next/navigation'
import styled from '@emotion/styled'
import { SessionManager } from '@/app/utils/sessionStorage'

interface StoryRequest {
  sessionId: string
  choice?: number
  storyName: string
  language?: string
  forceRestart?: boolean
}

interface StoryStep {
  step?: number
  desc: string
  options: string[]
}

interface StoryResponse {
  sessionId?: string
  currentStep: StoryStep
  nextSteps: StoryStep[]
  success: boolean
  error?: string
  shouldRestart?: boolean
}

const TypingText = styled.div`
  white-space: pre-wrap;
  overflow: hidden;
  border-right: 0px solid;
`

interface TypingEffectProps {
  text: string
  speed?: number
  onComplete: () => void
}

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
    let i = 0
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
        onComplete()
      }
    }, speed)

    return () => clearInterval(typingInterval)
  }, [text, speed, onComplete])

  return <TypingText>{displayedText}</TypingText>
}

const CustomLoader: React.FC<{ size?: number }> = ({ size = 60 }) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width={`${size}px`}
      height={`${size}px`}
    >
      <Box as="img" src="/loader.svg" alt="Loading..." width={`${size}px`} height={`${size}px`} />
    </Box>
  )
}

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [currentStep, setCurrentStep] = useState<StoryStep | null>(null)
  const [nextSteps, setNextSteps] = useState<StoryStep[]>([])
  const [sessionId, setSessionId] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingBackground, setIsLoadingBackground] = useState(false)

  // Simple ref to prevent duplicate initialization in React Strict Mode
  const initializeOnce = useRef(false)
  const currentStoryName = useRef<string>('')

  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()
  const params = useParams()
  const storyName = params.storyName as string

  // Reset the flag only when storyName actually changes
  if (currentStoryName.current !== storyName) {
    console.log('Story name changed from', currentStoryName.current, 'to', storyName)
    currentStoryName.current = storyName
    initializeOnce.current = false
  }

  const setShowOptionsWithLogging = (value: boolean, reason: string) => {
    console.log(`Setting showOptions to ${value}, reason: ${reason}`)
    setShowOptions(value)
  }

  const setCurrentStepWithLogging = (step: StoryStep | null, reason: string) => {
    console.log(`Setting currentStep, reason: ${reason}`, step)
    setCurrentStep(step)
  }

  const setIsLoadingWithLogging = (value: boolean, reason: string) => {
    console.log(`Setting isLoading to ${value}, reason: ${reason}`)
    setIsLoading(value)
  }

  // Single, properly typed callStoryAPI function
  const callStoryAPI = async (requestData: StoryRequest): Promise<StoryResponse | null> => {
    try {
      console.log('Calling story API with data:', requestData)

      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: StoryResponse = await response.json()
      console.log('API response data:', data)

      return data
    } catch (error) {
      console.error('Error calling story API:', error)
      toast({
        title: 'Error',
        description: 'Failed to load story. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return null
    }
  }

  // Updated initializeStory function
  const initializeStory = async () => {
    console.log('Initializing story for:', storyName)
    setIsLoadingWithLogging(true, 'Story initialization started')

    try {
      // Try to load existing session from localStorage
      let existingSessionId: string | null = null
      if (typeof window !== 'undefined') {
        existingSessionId = SessionManager.getSessionForStory(storyName)
      }

      let sessionToUse: string
      let shouldStartFresh = false
      let testResponse: StoryResponse | null = null

      if (existingSessionId) {
        console.log('Found existing session in localStorage:', existingSessionId)

        // Try to continue with existing session first
        testResponse = await callStoryAPI({
          sessionId: existingSessionId,
          storyName: storyName,
          language: 'français',
          // Don't include choice - this will be treated as "continue existing story"
        })

        if (testResponse && testResponse.success) {
          // Server has the session, we can continue
          sessionToUse = existingSessionId
          console.log('Successfully continuing with existing session')
        } else if (testResponse && testResponse.error && testResponse.shouldRestart) {
          // Server lost the session, start fresh but keep using the same sessionId
          console.log('Server lost session, starting fresh with same sessionId')
          sessionToUse = existingSessionId
          shouldStartFresh = true
        } else {
          // Some other error, create completely new session
          console.log('Error with existing session, creating new one')
          if (typeof window !== 'undefined') {
            sessionToUse = SessionManager.createNewSessionForStory(storyName)
          } else {
            sessionToUse = generateSessionId()
          }
          shouldStartFresh = true
        }
      } else {
        // No existing session, create new one
        console.log('No existing session found, creating new one')
        if (typeof window !== 'undefined') {
          sessionToUse = SessionManager.createNewSessionForStory(storyName)
        } else {
          sessionToUse = generateSessionId()
        }
        shouldStartFresh = true
      }

      setSessionId(sessionToUse)

      let response: StoryResponse | null
      if (shouldStartFresh) {
        // Force a fresh start by making an initialization call
        response = await callStoryAPI({
          sessionId: sessionToUse,
          storyName: storyName,
          language: 'français',
          forceRestart: true,
        })
      } else {
        // We already got the response from the test call above, use it
        response = testResponse
      }

      if (response && response.success) {
        console.log('Story initialization successful')
        setCurrentStepWithLogging(response.currentStep, 'Story initialized successfully')
        setNextSteps(response.nextSteps)
        setIsInitialized(true)

        // Update session data in localStorage
        if (typeof window !== 'undefined') {
          SessionManager.storeSessionData(sessionToUse, {
            sessionId: sessionToUse,
            storyName: storyName,
            currentStep: response.currentStep.step || 1,
          })
        }
      } else if (response) {
        console.error('Story initialization failed:', response?.error || 'Unknown error')
        toast({
          title: 'Error',
          description: response?.error || 'Failed to initialize story',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error during story initialization:', error)
      toast({
        title: 'Error',
        description: 'Failed to initialize story. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingWithLogging(false, 'Story initialization completed')
    }
  }

  // Simple effect that only runs once per storyName
  useEffect(() => {
    console.log(
      'useEffect triggered, storyName:',
      storyName,
      'initializeOnce.current:',
      initializeOnce.current
    )

    if (storyName && !initializeOnce.current) {
      initializeOnce.current = true
      console.log('Calling initializeStory')
      initializeStory()
    }

    // Don't reset the flag in cleanup - this was causing the double execution
    // The flag should only reset when storyName actually changes
  }, [storyName])

  const handleTypingComplete = useCallback(() => {
    setShowOptionsWithLogging(true, 'Typing animation completed')
  }, [])

  const nextStep = async (choice: number) => {
    console.log('Next step called with choice:', choice)
    setIsLoadingWithLogging(true, `User selected choice ${choice}`)
    setShowOptionsWithLogging(false, 'Starting new choice processing')

    try {
      const response = await callStoryAPI({
        sessionId: sessionId,
        choice: choice,
        storyName: storyName,
        language: 'français',
      })

      if (response && response.success) {
        console.log('Next step successful')
        setCurrentStepWithLogging(response.currentStep, `Choice ${choice} processed successfully`)
        setNextSteps(response.nextSteps)

        // Update session data in localStorage
        if (typeof window !== 'undefined') {
          SessionManager.storeSessionData(sessionId, {
            sessionId: sessionId,
            storyName: storyName,
            currentStep: response.currentStep.step || 1,
          })
        }
      } else {
        console.error('Next step failed:', response?.error || 'Unknown error')
        toast({
          title: 'Error',
          description: response?.error || 'Failed to process your choice',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error during next step:', error)
      toast({
        title: 'Error',
        description: 'Failed to process your choice. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingWithLogging(false, 'Next step processing completed')
    }
  }

  if (!isInitialized || isLoading) {
    return (
      <Container maxW="container.sm" py={0} px={4}>
        <Flex
          flexDirection="column"
          height="calc(100vh - 72px)"
          width="100%"
          justify="center"
          align="center"
        >
          <VStack spacing={4}>
            <CustomLoader size={200} />
          </VStack>
        </Flex>
      </Container>
    )
  }

  if (!currentStep) {
    return (
      <Container maxW="container.sm" py={0} px={4}>
        <Flex
          flexDirection="column"
          height="calc(100vh - 72px)"
          width="100%"
          justify="center"
          align="center"
        >
          <VStack spacing={4}>
            <Text>No story data available</Text>
            <Button onClick={initializeStory}>Try Again</Button>
          </VStack>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.sm" py={0} px={4}>
      <Flex flexDirection="column" height="calc(100vh - 72px)" width="100%">
        <VStack spacing={4} flex={1} width="100%">
          <Box width="100%" overflowY="auto" marginBottom={4} marginTop={10}>
            <Text as="h4" fontSize="xl" fontWeight="medium" lineHeight="1.6">
              <TypingEffect text={currentStep.desc} onComplete={handleTypingComplete} />
            </Text>
          </Box>

          {showOptions && !isLoading && (
            <>
              <VStack spacing={4} width="100%">
                {currentStep.options.map((option, index) => {
                  const isOptionAvailable = nextSteps && nextSteps.length >= index + 1

                  return (
                    <Box
                      key={index}
                      width="100%"
                      borderRadius="lg"
                      p={4}
                      borderWidth="2px"
                      borderColor="gray.600"
                      onClick={isOptionAvailable ? () => nextStep(index + 1) : undefined}
                      cursor="pointer"
                      _hover={{
                        borderColor: '#8c1c84',
                        boxShadow: 'md',
                      }}
                      transition="all 0.2s"
                      bg="gray.800"
                      position="relative"
                    >
                      <Text
                        fontSize="lg"
                        fontWeight="medium"
                        color="#45a2f8"
                        _hover={{ color: '#45a2f8' }}
                      >
                        {option}
                      </Text>
                    </Box>
                  )
                })}
              </VStack>
            </>
          )}

          {isLoading && showOptions && (
            <>
              <Flex justify="center" align="center" width="100%" py={8}>
                <CustomLoader size={60} />
              </Flex>
            </>
          )}
        </VStack>
      </Flex>
    </Container>
  )
}
