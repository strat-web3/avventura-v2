'use client'

import { useRouter } from 'next/navigation'
import { Box, VStack, Text, Button, useColorModeValue, Alert, AlertIcon } from '@chakra-ui/react'
import { FaArrowRight } from 'react-icons/fa'
import { SessionManager } from '@/app/utils/sessionStorage'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useState, useEffect } from 'react'
import Loader from './Loader'

interface StoryDisplayData {
  slug: string
  title: string
  description: string
}

interface StoryBoxProps {
  story: StoryDisplayData
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
      mb={4}
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
          {story.title}
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

  const [stories, setStories] = useState<StoryDisplayData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch stories from database (single entry per story)
  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true)
      setError(null)

      try {
        console.log(`🔍 Fetching stories...`)

        // Fetch stories from the new single-entry API
        const response = await fetch(`/api/admin/stories/homepage?language=${language}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch stories')
        }

        // Stories are already in the correct format from the API
        setStories(data.stories)
        console.log(`✅ Loaded ${data.stories.length} stories`)
      } catch (error) {
        console.error('❌ Error fetching stories:', error)
        setError(error instanceof Error ? error.message : 'Failed to load stories')

        // Fallback to hardcoded stories if database fails
        console.log('🔄 Falling back to hardcoded stories')
        setStories(getFallbackStories(language))
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [language])

  // Fallback stories with proper translations (matches your provided data)
  const getFallbackStories = (lang: string): StoryDisplayData[] => {
    const fallbackTranslations: Record<string, StoryDisplayData[]> = {
      fr: [
        {
          slug: 'montpellier',
          title: 'Montpellier Médiéval',
          description: 'Explorez la vie médiévale à Montpellier au 10ème siècle!',
        },
        {
          slug: 'cretace',
          title: 'Crétacé Sup',
          description: "Découvrez l'univers fascinant des pectinidés!",
        },
        {
          slug: 'truman',
          title: 'The Truman Show',
          description:
            'Découvrez le monde réel pour la première fois après une vie dans une émission de télé!',
        },
        {
          slug: 'kingston',
          title: 'À Kingston Town',
          description: "Vous descendez de l'avion à l'aéroport Palisadoes de Kingston, 1957",
        },
        {
          slug: 'sailing',
          title: "La Promesse de l'Océan",
          description:
            "Dirigez une expédition de restauration corallienne à bord d'un voilier de recherche dans les Caraïbes!",
        },
      ],
      en: [
        {
          slug: 'montpellier',
          title: 'Medieval Montpellier',
          description: 'Explore medieval life in 10th century Montpellier!',
        },
        {
          slug: 'cretace',
          title: 'Cretaceous Era',
          description: 'Discover the fascinating world of scallops!',
        },
        {
          slug: 'truman',
          title: 'The Truman Show',
          description:
            'Experience the real world for the first time after a lifetime in a TV show!',
        },
        {
          slug: 'kingston',
          title: 'In Kingston Town',
          description: "You step off the plane at Kingston's Palisadoes Airport, 1957",
        },
        {
          slug: 'sailing',
          title: "Ocean's Promise",
          description:
            'Lead a coral restoration expedition aboard a research sailing vessel in the Caribbean!',
        },
      ],
      zh: [
        {
          slug: 'montpellier',
          title: '中世纪蒙彼利埃',
          description: '探索10世纪蒙彼利埃的中世纪生活！',
        },
        {
          slug: 'cretace',
          title: '白垩纪时代',
          description: '探索扇贝的迷人世界！',
        },
        {
          slug: 'truman',
          title: '楚门的世界',
          description: '在电视节目中生活一辈子后，第一次体验真实世界！',
        },
        {
          slug: 'kingston',
          title: '在金斯敦镇',
          description: '您从金斯敦帕利萨多斯机场走下飞机，1957年',
        },
        {
          slug: 'sailing',
          title: '海洋之约',
          description: '在加勒比海研究帆船上领导珊瑚修复探险！',
        },
      ],
    }

    return fallbackTranslations[lang] || fallbackTranslations.fr
  }

  const handleStorySelect = (storySlug: string): void => {
    console.log(`Starting new adventure: ${storySlug} in ${language}`)

    try {
      // Clear any existing session for this story first
      SessionManager.clearSessionForStory(storySlug)
      console.log(`Cleared existing session for story: ${storySlug}`)

      // Create a brand new session for this story
      const newSessionId = SessionManager.createNewSessionForStory(storySlug)
      console.log(`Created new session for story ${storySlug}:`, newSessionId)

      // Navigate to the story page - language will be passed via URL context
      router.push(`/${storySlug}`)
    } catch (error) {
      console.error('Error creating new session:', error)
      // Fallback: just navigate to the story page
      router.push(`/${storySlug}`)
    }
  }

  if (loading) {
    return <Loader />
  }

  if (error) {
    return (
      <VStack spacing={8} align="stretch">
        {stories.length > 0 && (
          <>
            <VStack spacing={4} align="stretch">
              {stories.map(story => (
                <StoryBox
                  key={story.slug}
                  story={story}
                  onClick={handleStorySelect}
                  buttonText={getButtonText(language)}
                />
              ))}
            </VStack>
          </>
        )}
      </VStack>
    )
  }

  return (
    <VStack spacing={8} align="stretch">
      <VStack spacing={4} align="stretch">
        {stories.map(story => (
          <StoryBox
            key={story.slug}
            story={story}
            onClick={handleStorySelect}
            buttonText={getButtonText(language)}
          />
        ))}
      </VStack>

      {stories.length === 0 && (
        <VStack spacing={4} align="center" py={10}>
          <Text color="gray.500" textAlign="center">
            No stories available in {language}.
          </Text>
          <Text color="gray.400" fontSize="sm" textAlign="center">
            Try switching to English or French, or check back later.
          </Text>
        </VStack>
      )}
    </VStack>
  )
}

export default StoriesGrid
