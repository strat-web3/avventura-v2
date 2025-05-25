'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Container, Text, Button, useToast, Box, VStack, Flex } from '@chakra-ui/react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, parseEther, formatEther } from 'ethers'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import styled from '@emotion/styled'

interface StoryCard {
  step: number
  desc: string
  options: string[]
  paths: number[]
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

export default function StoryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [currentStep, setCurrentStep] = useState<number>(1)

  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()

  // Hardcoded placeholder story card
  const story: StoryCard = {
    step: 1,
    desc: 'Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello Hello ',
    options: ['2', '3', '4'],
    paths: [2, 3, 4],
  }

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
      // Placeholder for future API integration
      // For now, just simulate a step change
      setCurrentStep(choice)

      // toast({
      //   title: t.common.success,
      //   description: `You chose option ${choice}`,
      //   status: 'success',
      //   duration: 3000,
      //   isClosable: true,
      // })

      // Reset the typing effect for the next step
      setTimeout(() => {
        setShowOptions(true)
      }, 1000)
    } catch (error) {
      console.error('Error advancing to next step:', error)
      toast({
        title: t.common.error,
        description: 'An error occurred while updating the game state',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initialize the story display
    console.log('Story page initialized')
  }, [])

  return (
    <Container maxW="container.sm" py={0} px={4}>
      <Flex flexDirection="column" height="calc(100vh - 72px)" width="100%">
        <VStack spacing={4} flex={1} width="100%">
          <Box width="100%" maxHeight="180px" overflowY="auto" marginBottom={4} marginTop={10}>
            <Text as="h4" fontSize="xl" fontWeight="medium" lineHeight="1.6">
              <TypingEffect text={story.desc} onComplete={handleTypingComplete} />
            </Text>
          </Box>

          {showOptions && (
            <VStack spacing={4} width="100%">
              {story.options.map((option, index) => (
                <Box
                  key={index}
                  width="100%"
                  borderRadius="lg"
                  p={4}
                  borderWidth="2px"
                  borderColor="gray.600"
                  onClick={() => nextStep(story.paths[index])}
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
        </VStack>
      </Flex>
    </Container>
  )
}
