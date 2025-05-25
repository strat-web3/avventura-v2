'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Text, Button, useToast, Box, VStack, Flex, Spinner } from '@chakra-ui/react'
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
  step: StoryStep
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

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [currentStep, setCurrentStep] = useState<StoryStep | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

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

        if (data.success && data.step) {
          setCurrentStep(data.step)
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
    console.log('next step:', choice)
    setIsLoading(true)
    setShowOptions(false)

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

      if (data.success && data.step) {
        setCurrentStep(data.step)
        // Reset options display for new content
        setShowOptions(false)
      } else {
        throw new Error(data.error || 'Failed to generate next step')
      }
    } catch (error) {
      console.error('Error advancing to next step:', error)
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
    // Clear session and restart
    const storageKey = `avventura_session_${storyName}`
    localStorage.removeItem(storageKey)
    setSessionId('')
    setCurrentStep(null)
    setShowOptions(false)
    setIsInitialized(false)
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
            <Spinner size="xl" color="#8c1c84" />
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
            <Button variant="ghost" size="sm">
              ← Retour
            </Button>
          </Link>
        </Box>

        {/* Reset button */}
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <Button variant="ghost" size="sm" onClick={resetStory}>
            Recommencer
          </Button>
        </Box>

        <VStack spacing={4} flex={1} width="100%">
          <Box width="100%" maxHeight="180px" overflowY="auto" marginBottom={4} marginTop={10}>
            <Text as="h4" fontSize="xl" fontWeight="medium" lineHeight="1.6">
              <TypingEffect text={currentStep.desc} onComplete={handleTypingComplete} />
            </Text>
          </Box>

          {showOptions && !isLoading && (
            <VStack spacing={4} width="100%">
              {currentStep.options.map((option, index) => (
                <Box
                  key={index}
                  width="100%"
                  borderRadius="lg"
                  p={4}
                  borderWidth="2px"
                  borderColor="gray.600"
                  onClick={() => nextStep(index + 1)}
                  cursor="pointer"
                  _hover={{
                    borderColor: '#8c1c84',
                    boxShadow: 'md',
                  }}
                  transition="all 0.2s"
                  bg="gray.800"
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
              ))}
            </VStack>
          )}

          {isLoading && showOptions && (
            <Flex justify="center" align="center" width="100%" py={8}>
              <Spinner size="lg" color="#8c1c84" />
            </Flex>
          )}
        </VStack>
      </Flex>
    </Container>
  )
}
