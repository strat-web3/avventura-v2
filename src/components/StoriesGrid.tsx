'use client'

import { useRouter } from 'next/navigation' // Use next/navigation for App Router
import { Box, Grid, VStack, Text, Button, useColorModeValue } from '@chakra-ui/react'
import { FaArrowRight } from 'react-icons/fa'

interface Story {
  name: string
  slug: string
  description: string
}

interface StoryBoxProps {
  story: Story
  onClick: (slug: string) => void
}

const StoryBox: React.FC<StoryBoxProps> = ({ story, onClick }) => {
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
        <Text color="gray.500">{story.description}</Text>
        <Button rightIcon={<FaArrowRight />} colorScheme="blue" variant="outline" size="sm">
          Start Adventure
        </Button>
      </VStack>
    </Box>
  )
}

const StoriesGrid: React.FC = () => {
  const router = useRouter()

  const FEATURED_STORIES: Story[] = [
    {
      name: 'Crétacé Sup',
      slug: 'cretace',
      description: "Découvrez l'univers fascinant des pectinidés!",
    },
    {
      name: 'Montpellier Medieval',
      slug: 'montpellier',
      description: 'Explorez la vie médiévale à Montpellier au 10ème siècle!',
    },
    {
      name: 'The Truman Show',
      slug: 'trueman',
      description: 'Experience the real world for the first time after a lifetime in a TV show!',
    },
  ]

  const handleStorySelect = (storySlug: string): void => {
    router.push(`/${storySlug}`)
  }

  return (
    <VStack spacing={8} align="stretch">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
        {FEATURED_STORIES.map(story => (
          <StoryBox key={story.slug} story={story} onClick={handleStorySelect} />
        ))}
      </Grid>
    </VStack>
  )
}

export default StoriesGrid
