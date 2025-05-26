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

  // Simplified initialization - API handles deduplication
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
    setTimeout(() => {
      setShowOptions(true)
    }, 500)
  }, [])

  const nextStep = async (choice: number) => {
    setShowOptions(false)

    // Use the pre-loaded next step for immediate display
    if (nextSteps && nextSteps.length >= choice) {
      const immediateStep = nextSteps[choice - 1]

      // Safety check for step structure
      if (!immediateStep || !immediateStep.desc || !immediateStep.options) {
        console.error('Invalid pre-loaded step structure:', immediateStep)
        setIsLoading(true)
      } else {
        setCurrentStep(immediateStep)
        setNextSteps([])

        // Start background loading for the next set of steps
        setIsLoadingBackground(true)

        try {
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

          if (response.ok) {
            const data: StoryResponse = await response.json()
            if (data.success && data.nextSteps) {
              setNextSteps(data.nextSteps)
            }
          }
        } catch (error) {
          console.warn('Background loading error:', error)
        } finally {
          setIsLoadingBackground(false)
        }

        return
      }
    }

    // Fallback: no pre-loaded steps, do immediate API call
    if (!isLoading) setIsLoading(true)

    try {
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

      if (!response.ok) {
        throw new Error('Failed to get next step')
      }

      const data: StoryResponse = await response.json()

      if (data.success && data.currentStep) {
        setCurrentStep(data.currentStep)
        setNextSteps(data.nextSteps || [])
      } else {
        throw new Error(data.error || 'Failed to generate next step')
      }
    } catch (error) {
      console.error('Error in API call:', error)
      toast({
        title: t.common.error,
        description: "Une erreur est survenue lors de la progression de l'histoire",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetStory = () => {
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
          {/* <VStack spacing={4}>
            <Text>Erreur lors du chargement de l&apos;histoire</Text>
            <Button onClick={resetStory} colorScheme="blue">
              Recommencer
            </Button>
            <Link href="/">
              <Button variant="outline">Retour à l&apos;accueil</Button>
            </Link>
          </VStack> */}
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.sm" py={0} px={4}>
      <Flex flexDirection="column" height="calc(100vh - 72px)" width="100%">
        {/* Back button */}
        {/* <Box position="absolute" top={4} left={4} zIndex={10}>
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Retour
            </Button>
          </Link>
        </Box> */}

        {/* Reset button with loading indicator */}
        {/* <Box position="absolute" top={4} right={4} zIndex={10}>
          <Button variant="ghost" size="sm" onClick={resetStory} isDisabled={isLoading}>
            Recommencer
          </Button>
          {isLoadingBackground && (
            <Box position="absolute" top={-1} right={-1}>
              <CustomLoader size={16} />
            </Box>
          )}
        </Box> */}

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
