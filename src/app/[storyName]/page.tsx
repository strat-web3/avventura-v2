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

  // Enhanced logging wrapper for setShowOptions
  const setShowOptionsWithLogging = (value: boolean, reason: string) => {
    console.log(`🎭 Setting showOptions to: ${value} - Reason: ${reason}`)
    console.log(
      `🎭 Current state: isLoading=${isLoading}, currentStep=${!!currentStep}, options=${currentStep?.options?.length || 0}`
    )
    setShowOptions(value)
  }

  // Enhanced logging wrapper for setCurrentStep
  const setCurrentStepWithLogging = (step: StoryStep | null, reason: string) => {
    console.log(`📖 Setting currentStep - Reason: ${reason}`)
    console.log(
      `📖 New step:`,
      step ? { desc: step.desc.substring(0, 50) + '...', optionsCount: step.options?.length } : null
    )
    setCurrentStep(step)
  }

  // Enhanced logging wrapper for setIsLoading
  const setIsLoadingWithLogging = (value: boolean, reason: string) => {
    console.log(`⏳ Setting isLoading to: ${value} - Reason: ${reason}`)
    setIsLoading(value)
  }

  // Simplified initialization - API handles deduplication
  useEffect(() => {
    const initializeStory = async () => {
      if (isInitialized) return

      console.log(`🚀 Initializing story: ${storyName}`)
      setIsLoadingWithLogging(true, 'Story initialization')

      // Get or create session ID
      const storageKey = `avventura_session_${storyName}`
      let storedSessionId = localStorage.getItem(storageKey)

      if (!storedSessionId) {
        storedSessionId = generateSessionId()
        localStorage.setItem(storageKey, storedSessionId)
        console.log(`🆔 Created new session ID: ${storedSessionId}`)
      } else {
        console.log(`🆔 Using existing session ID: ${storedSessionId}`)
      }

      setSessionId(storedSessionId)

      try {
        console.log(`📡 Making initial API call for: ${storyName}`)
        // Load the first step
        const response = await fetch('/api/story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: storedSessionId,
            storyName,
            language: 'Français', // Changed from 'fr' to 'Français'
          }),
        })

        console.log(`📡 Initial API response status: ${response.status}`)

        if (!response.ok) {
          throw new Error('Failed to load story')
        }

        const data: StoryResponse = await response.json()
        console.log(`📡 Initial API data:`, {
          success: data.success,
          hasCurrentStep: !!data.currentStep,
          nextStepsCount: data.nextSteps?.length || 0,
        })

        if (data.success && data.currentStep) {
          setCurrentStepWithLogging(data.currentStep, 'Initial story load')
          setNextSteps(data.nextSteps || [])
          console.log(
            `✅ Story initialized successfully with ${data.nextSteps?.length || 0} next steps`
          )
        } else {
          throw new Error(data.error || 'Failed to generate story content')
        }
      } catch (error) {
        console.error('❌ Error initializing story:', error)
        toast({
          title: t.common.error,
          description: "Impossible de charger l'histoire. Veuillez réessayer.",
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      } finally {
        setIsLoadingWithLogging(false, 'Story initialization complete')
        setIsInitialized(true)
        console.log(`🏁 Story initialization finished for: ${storyName}`)
      }
    }

    initializeStory()
  }, [storyName, isInitialized, toast, t.common.error])

  const handleTypingComplete = useCallback(() => {
    console.log(`⌨️ Typing complete, showing options in 500ms`)
    setTimeout(() => {
      setShowOptionsWithLogging(true, 'Typing animation completed')
    }, 500)
  }, [])

  const nextStep = async (choice: number) => {
    console.log(`🎯 nextStep called with choice: ${choice}`)
    console.log(
      `🎯 Current state: nextSteps=${nextSteps?.length}, showOptions=${showOptions}, isLoading=${isLoading}`
    )
    console.log(
      `🎯 Current nextSteps:`,
      nextSteps?.map((step, i) => ({
        index: i,
        hasDesc: !!step.desc,
        optionsCount: step.options?.length,
      }))
    )

    setShowOptionsWithLogging(false, `User selected option ${choice}`)

    // Use the pre-loaded next step for immediate display
    if (nextSteps && nextSteps.length >= choice) {
      const immediateStep = nextSteps[choice - 1]
      console.log(`⚡ Pre-loaded step found for choice ${choice}:`, {
        hasDesc: !!immediateStep?.desc,
        optionsCount: immediateStep?.options?.length,
        descPreview: immediateStep?.desc?.substring(0, 50) + '...',
      })

      // Safety check for step structure - if invalid, fall back to API call
      if (!immediateStep || !immediateStep.desc || !immediateStep.options) {
        console.error('❌ Invalid pre-loaded step structure:', immediateStep)
        console.log('🔄 Falling back to API call...')
        // Don't return here, fall through to the API call below
      } else {
        // Valid pre-loaded step, use it immediately
        console.log('✅ Using valid pre-loaded step')
        setCurrentStepWithLogging(immediateStep, `Pre-loaded step for choice ${choice}`)
        setNextSteps([])

        // Start background loading for the next set of steps
        setIsLoadingBackground(true)
        console.log('🔄 Starting background API call...')

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
              language: 'Français',
            }),
          })

          console.log(`🔄 Background API response status: ${response.status}`)

          if (response.ok) {
            const data: StoryResponse = await response.json()
            console.log(`🔄 Background API data:`, {
              success: data.success,
              nextStepsCount: data.nextSteps?.length || 0,
            })
            if (data.success && data.nextSteps) {
              setNextSteps(data.nextSteps)
              console.log(`✅ Background next steps loaded: ${data.nextSteps.length}`)
            } else {
              console.warn('⚠️ Background API returned no next steps')
            }
          } else {
            console.warn(`⚠️ Background API failed with status: ${response.status}`)
          }
        } catch (error) {
          console.warn('⚠️ Background loading error:', error)
        } finally {
          setIsLoadingBackground(false)
          console.log('🔄 Background loading complete')
        }

        return // Only return here if we successfully used pre-loaded step
      }
    } else {
      console.log(
        `⚠️ No pre-loaded step available for choice ${choice} (nextSteps.length: ${nextSteps?.length})`
      )
    }

    // Fallback: no pre-loaded steps or invalid steps, do immediate API call
    console.log('🔄 Using fallback API call')
    setIsLoadingWithLogging(true, `Fallback API call for choice ${choice}`)

    try {
      console.log('📡 Making fallback API call...')
      const response = await fetch('/api/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          choice,
          storyName,
          language: 'Français',
        }),
      })

      console.log(`📡 Fallback API response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`Failed to get next step: ${response.status}`)
      }

      const data: StoryResponse = await response.json()
      console.log(`📡 Fallback API data:`, {
        success: data.success,
        hasCurrentStep: !!data.currentStep,
        nextStepsCount: data.nextSteps?.length || 0,
      })

      if (data.success && data.currentStep) {
        setCurrentStepWithLogging(data.currentStep, `Fallback API result for choice ${choice}`)
        setNextSteps(data.nextSteps || [])
        console.log('✅ Fallback step set successfully')
      } else {
        throw new Error(data.error || 'Failed to generate next step')
      }
    } catch (error) {
      console.error('❌ Error in fallback API call:', error)

      // Re-show options if API call fails to prevent being stuck
      setShowOptionsWithLogging(true, `Fallback API error recovery for choice ${choice}`)
      console.log('🆘 Options restored due to error')

      toast({
        title: t.common.error,
        description:
          "Une erreur est survenue lors de la progression de l'histoire. Options restaurées.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingWithLogging(false, 'Fallback API call complete')
    }
  }

  const resetStory = () => {
    console.log(`🔄 Resetting story: ${storyName}`)
    const storageKey = `avventura_session_${storyName}`
    localStorage.removeItem(storageKey)
    setSessionId('')
    setCurrentStepWithLogging(null, 'Story reset')
    setNextSteps([])
    setShowOptionsWithLogging(false, 'Story reset')
    setIsInitialized(false)
    setIsLoadingBackground(false)
    console.log('✅ Story reset complete')
  }

  // Debug logging for render conditions
  console.log(
    `🖼️ Render check: isInitialized=${isInitialized}, isLoading=${isLoading}, hasCurrentStep=${!!currentStep}`
  )
  console.log(
    `🖼️ Options render check: showOptions=${showOptions}, isLoading=${isLoading}, optionsCount=${currentStep?.options?.length || 0}`
  )

  if (!isInitialized || isLoading) {
    console.log('🖼️ Rendering loading screen')
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
            {/* <Text>Chargement de l&apos;aventure...</Text> */}
          </VStack>
        </Flex>
      </Container>
    )
  }

  if (!currentStep) {
    console.log('🖼️ Rendering error screen - no currentStep')
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

  console.log('🖼️ Rendering main story interface')
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
          <Box width="100%" overflowY="auto" marginBottom={4} marginTop={10}>
            <Text as="h4" fontSize="xl" fontWeight="medium" lineHeight="1.6">
              <TypingEffect text={currentStep.desc} onComplete={handleTypingComplete} />
            </Text>
          </Box>

          {showOptions && !isLoading && (
            <>
              {console.log('🖼️ Rendering options section')}
              <VStack spacing={4} width="100%">
                {currentStep.options.map((option, index) => {
                  const isOptionAvailable = nextSteps && nextSteps.length >= index + 1
                  console.log(
                    `🖼️ Option ${index + 1}: available=${isOptionAvailable}, text="${option?.substring(0, 30)}..."`
                  )

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
              {console.log('🖼️ Rendering loading spinner')}
              <Flex justify="center" align="center" width="100%" py={8}>
                <CustomLoader size={60} />
              </Flex>
            </>
          )}

          {!showOptions && !isLoading && (
            <>{console.log('🖼️ No options or loading visible - this might be the stuck state!')}</>
          )}
        </VStack>
      </Flex>
    </Container>
  )
}
