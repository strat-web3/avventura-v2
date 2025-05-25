'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, parseEther, formatEther } from 'ethers'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { useParams } from 'next/navigation'
import styled from '@emotion/styled'

interface StoryStep {
  step?: number
  desc: string
  options: string[]
}

interface StoryResponse {
  sessionId: string
  currentStep: StoryStep
  nextSteps: StoryStep[]
  success: boolean
  error?: string
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

const TypingEffect: React.FC<TypingEffectProps> = ({ text, speed = 20, onComplete }) => {
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

// Custom Loader Component using the existing SVG
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

// Generate a unique session ID
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

  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()
  const params = useParams()
  const storyName = params.storyName as string

  // Initialize session and load first step
  useEffect(() => {
    const initializeStory = async () => {
      if (isInitialized) return

      setIsLoading(true)

      // Get or create session ID
      const storageKey = `avventura_session_${storyName}`
      let storedSessionId = localStorage.getItem(storageKey)

      if (!storedSessionId) {
        storedSessionId = generateSessionId()
        localStorage.setItem(storageKey, storedSessionId)
      }

      setSessionId(storedSessionId)

      try {
        // Load the first step
        const response = await fetch('/api/story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: storedSessionId,
            storyName,
            language: 'fr',
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to load story')
        }

        const data: StoryResponse = await response.json()

        if (data.success && data.currentStep) {
          setCurrentStep(data.currentStep)
          setNextSteps(data.nextSteps || [])
        } else {
          throw new Error(data.error || 'Failed to generate story content')
        }
      } catch (error) {
        console.error('Error initializing story:', error)
        toast({
          title: t.common.error,
          description: "Impossible de charger l'histoire. Veuillez réessayer.",
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeStory()
  }, [storyName, isInitialized, toast, t.common.error])

  const handleTypingComplete = useCallback(() => {
    console.log('Typing complete, setting timeout for options')
    setTimeout(() => {
      console.log('Timeout complete, showing options')
      setShowOptions(true)
    }, 500) // Delay before showing options
  }, [])

  const nextStep = async (choice: number) => {
    console.log('=== NEXT STEP CALLED ===')
    console.log('Choice:', choice)
    console.log('Current nextSteps array length:', nextSteps.length)
    console.log('Available pre-loaded steps:', nextSteps.length >= choice)

    setShowOptions(false)

    // Use the pre-loaded next step for immediate display
    if (nextSteps && nextSteps.length >= choice) {
      console.log('Using pre-loaded step for choice:', choice)
      const immediateStep = nextSteps[choice - 1]

      // Safety check for step structure
      if (!immediateStep || !immediateStep.desc || !immediateStep.options) {
        console.error('Invalid pre-loaded step structure:', immediateStep)
        // Fall back to immediate API call
        setIsLoading(true)
        // Continue to the immediate API call section below
      } else {
        console.log('Immediate step:', {
          desc: immediateStep.desc.substring(0, 100) + '...',
          optionsCount: immediateStep.options.length,
        })

        setCurrentStep(immediateStep)

        // Clear next steps since we're using them
        setNextSteps([])

        // Start background loading for the next set of steps
        setIsLoadingBackground(true)
        console.log('Starting background API call...')

        try {
          // Make background API request for future steps
          const response = await fetch('/api/story', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              choice,
              storyName,
              language: 'fr',
            }),
          })

          console.log('Background API response status:', response.status)

          if (response.ok) {
            const data: StoryResponse = await response.json()
            console.log('Background API response:', {
              success: data.success,
              hasCurrentStep: !!data.currentStep,
              nextStepsCount: data.nextSteps?.length || 0,
              error: data.error,
            })

            if (data.success && data.nextSteps) {
              // Store the new next steps for future use
              console.log('Storing', data.nextSteps.length, 'new next steps')
              setNextSteps(data.nextSteps)
            } else {
              console.warn('Background API did not return next steps:', data)
            }
          } else {
            const errorText = await response.text()
            console.warn('Background loading failed with status:', response.status, errorText)
          }
        } catch (error) {
          console.warn('Background loading error:', error)
          // Continue with the immediate step even if background loading fails
        } finally {
          console.log('Background loading completed')
          setIsLoadingBackground(false)
        }

        return // Exit early since we handled the pre-loaded step
      }
    }

    // Fallback: no pre-loaded steps, do immediate API call
    console.log('No pre-loaded steps available or invalid structure, making immediate API call')
    if (!isLoading) setIsLoading(true)

    try {
      console.log('Making immediate API request with choice:', choice)
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          choice,
          storyName,
          language: 'fr',
        }),
      })

      console.log('Immediate API response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Immediate API failed:', response.status, errorText)
        throw new Error('Failed to get next step')
      }

      const data: StoryResponse = await response.json()
      console.log('Immediate API response data:', {
        success: data.success,
        hasCurrentStep: !!data.currentStep,
        nextStepsCount: data.nextSteps?.length || 0,
        error: data.error,
      })

      if (data.success && data.currentStep) {
        console.log('Setting current step from immediate API')
        setCurrentStep(data.currentStep)
        setNextSteps(data.nextSteps || [])
      } else {
        console.error('Immediate API did not return valid data:', data)
        throw new Error(data.error || 'Failed to generate next step')
      }
    } catch (error) {
      console.error('Error in immediate API call:', error)
      toast({
        title: t.common.error,
        description: "Une erreur est survenue lors de la progression de l'histoire",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      console.log('Immediate API call completed')
      setIsLoading(false)
    }
  }

  const resetStory = () => {
    // Clear session and restart
    const storageKey = `avventura_session_${storyName}`
    localStorage.removeItem(storageKey)
    setSessionId('')
    setCurrentStep(null)
    setNextSteps([])
    setShowOptions(false)
    setIsInitialized(false)
    setIsLoadingBackground(false)
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
            <CustomLoader size={80} />
            <Text>Chargement de l&apos;aventure...</Text>
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
            {/* <Text>Erreur lors du chargement de l&apos;histoire</Text>
            <Button onClick={resetStory} colorScheme="blue">
              Recommencer
            </Button>
            <Link href="/">
              <Button variant="outline">Retour à l&apos;accueil</Button>
            </Link> */}
          </VStack>
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.sm" py={0} px={4}>
      <Flex flexDirection="column" height="calc(100vh - 72px)" width="100%">
        {/* Back button */}
        <Box position="absolute" top={4} left={4} zIndex={10}>
          <Link href="/">
            {/* <Button variant="ghost" size="sm">
              ← Retour
            </Button> */}
          </Link>
        </Box>

        {/* Reset button with loading indicator */}
        <Box position="absolute" top={4} right={4} zIndex={10}>
          {/* <Button variant="ghost" size="sm" onClick={resetStory} isDisabled={isLoading}>
            Recommencer
          </Button>
          {isLoadingBackground && (
            <Box position="absolute" top={-1} right={-1}>
              <CustomLoader size={16} />
            </Box>
          )} */}
        </Box>

        <VStack spacing={4} flex={1} width="100%">
          <Box width="100%" maxHeight="180px" overflowY="auto" marginBottom={4} marginTop={10}>
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
            <Flex justify="center" align="center" width="100%" py={8}>
              <CustomLoader size={60} />
            </Flex>
          )}
        </VStack>
      </Flex>
    </Container>
  )
}
