'use client'

import { useRouter } from 'next/navigation'
import { Box, Grid, VStack, Text, Button, useColorModeValue } from '@chakra-ui/react'
import { FaArrowRight } from 'react-icons/fa'
import { SessionManager } from '@/app/utils/sessionStorage'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'
import { getFeaturedStories } from '../translations/stories'

interface Story {
  name: string
  slug: string
  description: string
}

interface StoryBoxProps {
  story: Story
  onClick: (slug: string) => void
  buttonText: string
}

const StoryBox: React.FC<StoryBoxProps> = ({ story, onClick, buttonText }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.100', 'gray.600')

  return (
    <Box
      p={6}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      cursor="pointer"
      onClick={() => onClick(story.slug)}
      _hover={{
        bg: hoverBg,
        transform: 'translateY(-2px)',
        transition: 'all 0.2s',
      }}
    >
      <VStack spacing={4} align="flex-start">
        <Text fontSize="xl" fontWeight="bold">
          {story.name}
        </Text>
        <Text color="gray.500" minHeight="3em">
          {story.description}
        </Text>
        <Button rightIcon={<FaArrowRight />} colorScheme="blue" variant="outline" size="sm">
          {buttonText}
        </Button>
      </VStack>
    </Box>
  )
}

const StoriesGrid: React.FC = () => {
  const router = useRouter()
  const { language } = useLanguage()
  const t = useTranslation()

  // Get stories for current language
  const stories = getFeaturedStories(language)

  // Get button text based on language
  const getButtonText = (lang: string): string => {
    const buttonTexts: Record<string, string> = {
      fr: "Commencer l'Aventure",
      en: 'Start Adventure',
      zh: '开始冒险',
      hi: 'रोमांच शुरू करें',
      es: 'Comenzar Aventura',
      ar: 'ابدأ المغامرة',
      bn: 'অ্যাডভেঞ্চার শুরু করুন',
      ru: 'Начать приключение',
      pt: 'Começar Aventura',
      ur: 'ایڈونچر شروع کریں',
    }
    return buttonTexts[lang] || buttonTexts.fr
  }

  const handleStorySelect = (storySlug: string): void => {
    console.log(`Starting new adventure: ${storySlug}`)

    try {
      // Clear any existing session for this story first
      SessionManager.clearSessionForStory(storySlug)
      console.log(`Cleared existing session for story: ${storySlug}`)

      // Create a brand new session for this story
      const newSessionId = SessionManager.createNewSessionForStory(storySlug)
      console.log(`Created new session for story ${storySlug}:`, newSessionId)

      // Navigate to the story page
      router.push(`/${storySlug}`)
    } catch (error) {
      console.error('Error creating new session:', error)
      // Fallback: just navigate to the story page
      router.push(`/${storySlug}`)
    }
  }

  return (
    <VStack spacing={8} align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
        {stories.map(story => (
          <StoryBox
            key={story.slug}
            story={story}
            onClick={handleStorySelect}
            buttonText={getButtonText(language)}
          />
        ))}
      </Grid>
    </VStack>
  )
}

export default StoriesGrid
