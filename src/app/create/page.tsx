'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  HStack,
  IconButton,
  Collapse,
  useDisclosure,
  Badge,
  Select,
  Spinner,
  Center,
} from '@chakra-ui/react'
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaSave,
  FaEye,
  FaLanguage,
  FaSearch,
  FaUpload,
  FaWallet,
  FaLock,
} from 'react-icons/fa'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppKitAccount } from '@reown/appkit/react'
import Link from 'next/link'
import Loader from '@/components/Loader'
import Header from '@/components/Header'
import Connect from '@/components/Connect'

// Language mapping for display
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  bn: 'বাংলা',
  ru: 'Русский',
  pt: 'Português',
  ur: 'اردو',
}

interface LanguageEntry {
  title: string
  description: string
}

interface StoryFormData {
  slug: string
  title: string
  content: string
  homepage_display: Record<string, LanguageEntry>
}

interface ExistingStory {
  id: number
  slug: string
  title: string
  content: string
  homepage_display: Record<string, LanguageEntry>
  owner?: string
  created_at: string
  updated_at: string
}

// Authentication Guard Component
const AuthenticationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, address } = useAppKitAccount()

  if (!isConnected) {
    return (
      <Container maxW="container.lg" py={10} mt={69}>
        <VStack spacing={8} align="center" py={20}>
          <Box textAlign="center">
            <FaLock size={60} style={{ margin: '0 auto 20px', opacity: 0.3 }} />
            <Heading size="xl" mb={4} color="gray.500">
              Authentication Required
            </Heading>
            <Text color="gray.400" fontSize="lg" mb={8} maxW="md">
              You need to connect your wallet to create or edit stories. This ensures you own and
              control your content.
            </Text>
          </Box>

          <VStack spacing={4}>
            <Connect />
            <Text fontSize="sm" color="gray.500" textAlign="center" maxW="sm">
              Your wallet address will be recorded as the owner of any stories you create. Only you
              will be able to edit them.
            </Text>
          </VStack>

          <Box mt={8} p={6} bg="gray.50" _dark={{ bg: 'gray.700' }} borderRadius="lg" maxW="md">
            <VStack spacing={3} align="start">
              <Text fontSize="sm" fontWeight="bold" color="blue.400">
                Why do I need to connect?
              </Text>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                • <strong>Ownership:</strong> Your wallet proves you own your stories
              </Text>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                • <strong>Security:</strong> Only you can edit your content
              </Text>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                • <strong>Future features:</strong> Monetization, NFTs, and more
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    )
  }

  return <>{children}</>
}

const CreateStoryContent: React.FC = () => {
  const { address, isConnected } = useAppKitAccount()
  const [formData, setFormData] = useState<StoryFormData>({
    slug: '',
    title: '',
    content: '',
    homepage_display: {
      en: { title: '', description: '' },
      fr: { title: '', description: '' },
    },
  })

  // Story loading state
  const [existingStories, setExistingStories] = useState<ExistingStory[]>([])
  const [selectedStorySlug, setSelectedStorySlug] = useState('')
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [isLoadingStory, setIsLoadingStory] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claudePrompt, setClaudePrompt] = useState('')
  const [claudeResponse, setClaudeResponse] = useState<any>(null)
  const [isSendingToClaude, setIsSendingToClaude] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const { isOpen: isLanguagesOpen, onToggle: onToggleLanguages } = useDisclosure()
  const { isOpen: isLoadSectionOpen, onToggle: onToggleLoadSection } = useDisclosure()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch user's stories function
  const fetchUserStories = React.useCallback(async () => {
    if (!address) return

    console.log('📡 Starting fetchUserStories for address:', address)
    setIsLoadingStories(true)
    try {
      console.log('🔗 Making request to /api/admin/stories?owner=', address)
      const response = await fetch(`/api/admin/stories?owner=${address}`)
      console.log('📡 Response status:', response.status, response.statusText)

      const data = await response.json()
      console.log('📦 Response data:', data)

      if (data.success) {
        console.log('✅ Stories fetched successfully:', data.stories.length, 'stories')
        console.log(
          '📚 Story details:',
          data.stories.map((s: ExistingStory) => ({
            slug: s.slug,
            title: s.title,
            id: s.id,
            owner: s.owner,
          }))
        )
        setExistingStories(data.stories)
      } else {
        console.error('❌ API returned error:', data.error)
        toast({
          title: 'Failed to load your stories',
          description: data.error || 'Could not fetch your stories',
          status: 'error',
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('💥 Error fetching stories:', error)
      toast({
        title: 'Network Error',
        description: 'Failed to connect to the server',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setIsLoadingStories(false)
      console.log('🏁 fetchUserStories completed')
    }
  }, [address, toast])

  // Load user's stories when address changes
  useEffect(() => {
    if (address) {
      console.log('🔄 Address connected, fetching user stories...', address)
      fetchUserStories()
    }
  }, [address, fetchUserStories])

  // Load a specific story for editing (with ownership check)
  const loadStoryForEditing = React.useCallback(
    async (slug: string) => {
      console.log('📖 Starting loadStoryForEditing for slug:', slug)
      if (!slug || !address) {
        console.log('❌ No slug or address provided to loadStoryForEditing')
        return
      }

      setIsLoadingStory(true)
      try {
        console.log('🔗 Making request to /api/admin/stories/', slug)
        const response = await fetch(`/api/admin/stories/${slug}`)
        console.log('📡 Response status:', response.status, response.statusText)

        const data = await response.json()
        console.log('📦 Story load response:', data)

        if (data.success && data.story) {
          const story = data.story

          // Check ownership
          if (story.owner && story.owner !== address) {
            toast({
              title: 'Access Denied',
              description: 'You can only edit stories that you own.',
              status: 'error',
              duration: 5000,
            })
            return
          }

          console.log('✅ Story loaded successfully:', {
            slug: story.slug,
            title: story.title,
            owner: story.owner,
            contentLength: story.content?.length,
            homepageDisplayKeys: Object.keys(story.homepage_display || {}),
          })

          setFormData({
            slug: story.slug,
            title: story.title,
            content: story.content,
            homepage_display: story.homepage_display || {
              en: { title: '', description: '' },
              fr: { title: '', description: '' },
            },
          })
          setEditMode(true)

          toast({
            title: 'Story Loaded',
            description: `"${story.title}" is now ready for editing`,
            status: 'success',
            duration: 3000,
          })
        } else {
          console.error('❌ Story load failed:', data.error || 'Story not found')
          toast({
            title: 'Story Not Found',
            description: data.error || `Could not find story: ${slug}`,
            status: 'error',
            duration: 3000,
          })
        }
      } catch (error) {
        console.error('💥 Error loading story:', error)
        toast({
          title: 'Load Error',
          description: 'Failed to load the selected story',
          status: 'error',
          duration: 3000,
        })
      } finally {
        setIsLoadingStory(false)
        console.log('🏁 loadStoryForEditing completed for slug:', slug)
      }
    },
    [address, toast]
  )

  // Handle URL edit parameter after stories are loaded
  useEffect(() => {
    const editSlug = searchParams.get('edit')
    console.log('🔍 URL edit parameter check:', { editSlug, storiesLoaded: existingStories.length })

    if (editSlug && existingStories.length > 0) {
      console.log('📝 Processing edit request for slug:', editSlug)
      console.log(
        '📚 Available stories:',
        existingStories.map(s => ({ slug: s.slug, title: s.title }))
      )

      setSelectedStorySlug(editSlug)
      if (existingStories.some(story => story.slug === editSlug)) {
        console.log('✅ Story found, loading for editing:', editSlug)
        loadStoryForEditing(editSlug)
      } else {
        console.log('❌ Story not found:', editSlug)
        toast({
          title: 'Story Not Found',
          description: `You don't have a story called "${editSlug}" or it doesn't exist.`,
          status: 'error',
          duration: 7000,
        })
        // Clear the invalid edit parameter from URL
        const url = new URL(window.location.href)
        url.searchParams.delete('edit')
        window.history.replaceState({}, '', url.toString())
        console.log('🧹 Cleared invalid edit parameter from URL')
      }
    }
  }, [existingStories, searchParams, loadStoryForEditing, toast])

  // Handle story selection change
  const handleStorySelection = (slug: string) => {
    console.log('🎯 handleStorySelection called with slug:', slug)
    setSelectedStorySlug(slug)
    if (slug && existingStories.some(story => story.slug === slug)) {
      console.log('✅ Valid story selected, loading:', slug)
      loadStoryForEditing(slug)
    } else if (slug) {
      console.log('❌ Invalid story selected:', slug)
      toast({
        title: 'Invalid Story',
        description: `Story "${slug}" not found in your stories.`,
        status: 'warning',
        duration: 3000,
      })
      setSelectedStorySlug('')
    }
  }

  // Reset form to create new story
  const resetToNewStory = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      homepage_display: {
        en: { title: '', description: '' },
        fr: { title: '', description: '' },
      },
    })
    setSelectedStorySlug('')
    setEditMode(false)
    setSubmitStatus({ type: null, message: '' })

    // Update URL to remove edit parameter
    const url = new URL(window.location.href)
    url.searchParams.delete('edit')
    window.history.replaceState({}, '', url.toString())
  }

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 50)
  }

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && !editMode && { slug: generateSlug(value) }),
    }))
  }

  // Handle language entry changes
  const handleLanguageChange = (lang: string, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      homepage_display: {
        ...prev.homepage_display,
        [lang]: {
          ...prev.homepage_display[lang],
          [field]: value,
        },
      },
    }))
  }

  // Add new language
  const addLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      homepage_display: {
        ...prev.homepage_display,
        [lang]: { title: '', description: '' },
      },
    }))
  }

  // Remove language
  const removeLanguage = (lang: string) => {
    if (lang === 'en' || lang === 'fr') return // Don't allow removing required languages

    setFormData(prev => {
      const newHomepageDisplay = { ...prev.homepage_display }
      delete newHomepageDisplay[lang]
      return {
        ...prev,
        homepage_display: newHomepageDisplay,
      }
    })
  }

  // Handle Claude editor request
  const handleClaudeRequest = async () => {
    if (!claudePrompt.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter instructions for Claude before sending.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsSendingToClaude(true)
    setClaudeResponse(null)

    try {
      const storyGenerationPrompt = `User's story prompt: "${claudePrompt}"

Generate a complete story specification now:`

      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('message', storyGenerationPrompt)
      formData.append('model', 'anthropic')
      formData.append('sessionId', '')
      formData.append('walletAddress', address || '')
      formData.append('context', 'avventura')
      formData.append('data', '')

      console.log('🚀 Sending request to Rukh API route...')

      const response = await fetch('/api/rukh/ask', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📥 Rukh API response received:', data)

      setClaudeResponse(data)

      // Try to parse the JSON from Claude's response and auto-fill the form
      if (data.output) {
        try {
          const cleanResponse = data.output.replace(/```json\s*|\s*```/g, '').trim()
          const storyData = JSON.parse(cleanResponse)

          if (storyData.slug && storyData.title && storyData.content) {
            setFormData({
              slug: storyData.slug,
              title: storyData.title,
              content: storyData.content,
              homepage_display: storyData.homepage_display || {
                en: {
                  title: storyData.title,
                  description: 'Adventure awaits!',
                },
                fr: {
                  title: storyData.title,
                  description: "L'aventure vous attend!",
                },
              },
            })

            setEditMode(false)
            setSelectedStorySlug('')

            toast({
              title: 'Story Generated & Form Pre-filled!',
              description:
                'Claude has generated your story and pre-filled the form. Review and save when ready.',
              status: 'success',
              duration: 1000,
              isClosable: true,
            })
          } else {
            toast({
              title: 'Story Generated',
              description:
                'Claude response received, but auto-fill failed. Please copy the content manually.',
              status: 'info',
              duration: 5000,
              isClosable: true,
            })
          }
        } catch (parseError) {
          console.error('❌ Could not parse Claude response for auto-fill:', parseError)
          toast({
            title: 'Story Generated',
            description:
              'Claude response received, but auto-fill failed. Please copy the content manually.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch (error) {
      console.error('💥 Claude request failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setClaudeResponse({ error: errorMessage })

      toast({
        title: 'Story Generation Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSendingToClaude(false)
    }
  }

  // Submit form to save story
  const handleSubmit = async () => {
    if (!address) {
      toast({
        title: 'Authentication Required',
        description: 'Please connect your wallet to save the story.',
        status: 'error',
        duration: 5000,
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    // Validation
    if (!formData.slug || !formData.title || !formData.content) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields: slug, title, and content.',
      })
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        ...formData,
        owner: address,
      }

      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        const actionText = editMode ? 'updated' : 'created'
        setSubmitStatus({
          type: 'success',
          message: `Story "${result.story.title}" has been ${actionText} successfully!`,
        })

        toast({
          title: `Story ${editMode ? 'Updated' : 'Created'}`,
          description: `"${result.story.title}" is now available`,
          status: 'success',
          duration: 5000,
        })

        // Refresh the user's stories list if we were editing
        if (editMode) {
          await fetchUserStories()
        }

        // Redirect to the story that was just created/updated after a delay
        setTimeout(() => {
          router.push(`/${result.story.slug}`)
        }, 2000)
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || `Failed to ${editMode ? 'update' : 'create'} story`,
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: `Network error: Failed to ${editMode ? 'update' : 'save'} story`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <Container maxW="container.lg" py={10} mt={69}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading size="xl" mb={4}>
              {editMode ? `Edit Story: ${formData.title}` : 'Create Your Own Story'}
            </Heading>
            <Text color="gray.500" fontSize="lg">
              {editMode
                ? 'Modify your existing story or create a new one'
                : 'Generate stories manually or with the help of our faithful assistant'}
            </Text>

            {/* Connected Address Display */}
            {address && (
              <Box
                mt={4}
                p={3}
                bg="blue.50"
                _dark={{ bg: 'blue.900' }}
                borderRadius="md"
                maxW="md"
                mx="auto"
              >
                <HStack justify="center" spacing={2}>
                  <FaWallet color="#4299E1" />
                  <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
                    {address}
                  </Text>
                </HStack>
              </Box>
            )}
          </Box>

          {/* Load Existing Story Section */}
          <Box>
            <FormControl>
              <FormLabel>
                <HStack justify="space-between" w="100%">
                  <HStack>
                    <FaUpload />
                    <Text>Load Your Stories for Editing</Text>
                    {editMode && (
                      <Badge colorScheme="blue" variant="solid">
                        Editing Mode
                      </Badge>
                    )}
                    <Badge colorScheme="green" variant="outline">
                      {existingStories.length} stories
                    </Badge>
                  </HStack>
                  <IconButton
                    aria-label="Toggle load section"
                    icon={isLoadSectionOpen ? <FaChevronUp /> : <FaChevronDown />}
                    size="sm"
                    variant="ghost"
                    onClick={onToggleLoadSection}
                  />
                </HStack>
              </FormLabel>

              <Collapse in={isLoadSectionOpen}>
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg="gray.50"
                  _dark={{ bg: 'gray.700' }}
                  mt={2}
                >
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Select one of your existing stories to edit, or create a new one from scratch.
                    </Text>

                    <HStack spacing={4} align="end">
                      <FormControl flex={1}>
                        <FormLabel size="sm">Select Your Story to Edit</FormLabel>
                        {isLoadingStories ? (
                          <HStack p={2}>
                            <Spinner size="sm" />
                            <Text fontSize="sm">Loading your stories...</Text>
                          </HStack>
                        ) : (
                          <Select
                            value={selectedStorySlug}
                            onChange={e => handleStorySelection(e.target.value)}
                            placeholder={
                              existingStories.length > 0
                                ? 'Choose a story to edit...'
                                : 'No stories found'
                            }
                            bg="white"
                            _dark={{ bg: 'gray.600' }}
                            disabled={existingStories.length === 0}
                          >
                            {existingStories.map(story => (
                              <option key={story.slug} value={story.slug}>
                                {story.title} ({story.slug})
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>

                      <Button
                        leftIcon={<FaUpload />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => {
                          if (
                            selectedStorySlug &&
                            existingStories.some(story => story.slug === selectedStorySlug)
                          ) {
                            handleStorySelection(selectedStorySlug)
                          } else {
                            toast({
                              title: 'No Story Selected',
                              description: 'Please select a valid story from the dropdown first.',
                              status: 'warning',
                              duration: 3000,
                            })
                          }
                        }}
                        isLoading={isLoadingStory}
                        loadingText="Loading..."
                        disabled={
                          !selectedStorySlug ||
                          !existingStories.some(story => story.slug === selectedStorySlug) ||
                          isLoadingStories
                        }
                      >
                        Load Story
                      </Button>

                      {editMode && (
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="green"
                          variant="outline"
                          onClick={resetToNewStory}
                        >
                          New Story
                        </Button>
                      )}
                    </HStack>

                    {existingStories.length === 0 && !isLoadingStories && (
                      <Alert status="info">
                        <AlertIcon />
                        <Text fontSize="sm">
                          You haven&apos;t created any stories yet. Create your first story below!
                        </Text>
                      </Alert>
                    )}
                  </VStack>
                </Box>
              </Collapse>
            </FormControl>
          </Box>

          {!editMode && <Divider />}

          {/* Claude Generation Section */}
          {!editMode && (
            <Box>
              <VStack spacing={4} align="stretch">
                <Heading as="h2" size="md" color="blue.400">
                  <HStack>
                    <FaEdit />
                    <Text>Generate with Rukh AI</Text>
                  </HStack>
                </Heading>

                <Text fontSize="sm" color="gray.500">
                  Describe your story idea and Rukh will generate a complete adventure with
                  multilingual content.
                </Text>

                <VStack spacing={3} align="stretch">
                  <FormControl>
                    <FormLabel>
                      Describe your story idea. The more detail you give (content, tone, milestones,
                      ...), the better the story will be!
                    </FormLabel>
                    <Textarea
                      value={claudePrompt}
                      onChange={e => setClaudePrompt(e.target.value)}
                      placeholder="Example: Create an adventure about working as a sound technician for Queen during their 1986 Wembley concert. Include technical challenges and interactions with band members..."
                      rows={4}
                      resize="vertical"
                      disabled={!isConnected}
                    />
                  </FormControl>

                  <HStack>
                    <Button
                      leftIcon={<FaEdit />}
                      colorScheme="blue"
                      onClick={handleClaudeRequest}
                      isLoading={isSendingToClaude}
                      loadingText="Generating..."
                      disabled={!claudePrompt.trim() || !isConnected}
                    >
                      Generate Story
                    </Button>
                    {!isConnected && (
                      <Text fontSize="sm" color="gray.500">
                        Connect wallet to generate stories
                      </Text>
                    )}
                  </HStack>

                  {/* Claude Response Display */}
                  {claudeResponse && (
                    <Box>
                      {claudeResponse.error ? (
                        <Alert status="error">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Generation Failed</AlertTitle>
                            <AlertDescription>{claudeResponse.error}</AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Box
                          p={4}
                          bg="gray.50"
                          borderRadius="md"
                          borderLeft="4px solid"
                          borderColor="blue.400"
                          _dark={{ bg: 'gray.700' }}
                        >
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <HStack>
                                <FaEdit color="#4299E1" />
                                <Text fontWeight="bold" color="blue.400">
                                  Story Generated
                                </Text>
                              </HStack>
                              {claudeResponse.usage && (
                                <Badge variant="outline" colorScheme="blue" fontSize="xs">
                                  {claudeResponse.usage.output_tokens} tokens
                                </Badge>
                              )}
                            </HStack>

                            <Text fontSize="sm" color="green.600" fontWeight="medium">
                              ✅ Form has been pre-filled with the generated story. Review the
                              content below and make any adjustments needed.
                            </Text>

                            {/* Show blockchain transaction info if available */}
                            {claudeResponse.txHash && (
                              <Box
                                pt={2}
                                borderTop="1px solid"
                                borderColor="gray.200"
                                _dark={{ borderColor: 'gray.600' }}
                              >
                                <VStack spacing={1} align="stretch">
                                  <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                    Blockchain Transaction:
                                  </Text>
                                  <HStack justify="space-between" fontSize="xs">
                                    <Text color="gray.600">Network:</Text>
                                    <Badge variant="subtle" colorScheme="green">
                                      {claudeResponse.network || 'Unknown'}
                                    </Badge>
                                  </HStack>
                                  {claudeResponse.explorerLink && (
                                    <HStack justify="space-between" fontSize="xs">
                                      <Text color="gray.600">Transaction:</Text>
                                      <Button
                                        as="a"
                                        href={claudeResponse.explorerLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="xs"
                                        variant="link"
                                        colorScheme="blue"
                                        fontFamily="mono"
                                      >
                                        {claudeResponse.txHash.slice(0, 10)}...
                                      </Button>
                                    </HStack>
                                  )}
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      )}
                    </Box>
                  )}
                </VStack>
              </VStack>
            </Box>
          )}

          {!editMode && <Divider />}

          {/* Story Form */}
          <VStack spacing={6} align="stretch">
            <Heading as="h2" size="md">
              Story Details
            </Heading>

            {/* Basic Information */}
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Story Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder="Enter your story title"
                  disabled={!isConnected}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Story Slug{' '}
                  <Text as="span" fontSize="sm" color="gray.500">
                    {editMode ? '(cannot be changed)' : '(auto-generated)'}
                  </Text>
                </FormLabel>
                <Input
                  value={formData.slug}
                  onChange={e => handleInputChange('slug', e.target.value)}
                  placeholder="story-slug"
                  bg={editMode ? 'gray.100' : 'gray.50'}
                  _dark={{ bg: editMode ? 'gray.600' : 'gray.700' }}
                  isReadOnly={editMode}
                  disabled={!isConnected}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  URL will be: /{formData.slug}
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Story Content (Markdown)</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={e => handleInputChange('content', e.target.value)}
                  placeholder="Write your story content in markdown format..."
                  rows={15}
                  resize="vertical"
                  fontFamily="mono"
                  disabled={!isConnected}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Include story setup, characters, milestones, and educational objectives.
                </Text>
              </FormControl>
            </VStack>

            {/* Homepage Display Languages */}
            <Box>
              <FormControl>
                <FormLabel>
                  <HStack justify="space-between" w="100%">
                    <HStack>
                      <FaLanguage />
                      <Text>Homepage Display (Multilingual)</Text>
                      <Badge colorScheme="blue" variant="subtle">
                        {Object.keys(formData.homepage_display).length} languages
                      </Badge>
                    </HStack>
                    <IconButton
                      aria-label="Toggle languages"
                      icon={isLanguagesOpen ? <FaChevronUp /> : <FaChevronDown />}
                      size="sm"
                      variant="ghost"
                      onClick={onToggleLanguages}
                      disabled={!isConnected}
                    />
                  </HStack>
                </FormLabel>

                <Collapse in={isLanguagesOpen}>
                  <VStack spacing={4} mt={4}>
                    {/* Current Languages */}
                    {Object.entries(formData.homepage_display).map(([langCode, content]) => {
                      const langInfo = LANGUAGE_NAMES[langCode]
                      const isRequired = langCode === 'en'

                      return (
                        <Box
                          key={langCode}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          w="100%"
                          bg={isRequired ? 'blue.50' : 'gray.50'}
                          _dark={{
                            bg: isRequired ? 'blue.900' : 'gray.700',
                          }}
                        >
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <HStack>
                                <Text fontWeight="bold">{langInfo || langCode.toUpperCase()}</Text>
                                {isRequired && (
                                  <Badge colorScheme="blue" size="sm">
                                    Required
                                  </Badge>
                                )}
                              </HStack>
                              {!isRequired && (
                                <IconButton
                                  aria-label="Remove language"
                                  icon={<FaTrash />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => removeLanguage(langCode)}
                                  disabled={!isConnected}
                                />
                              )}
                            </HStack>

                            <FormControl isRequired={isRequired}>
                              <FormLabel size="sm">Title</FormLabel>
                              <Input
                                value={content.title}
                                onChange={e =>
                                  handleLanguageChange(langCode, 'title', e.target.value)
                                }
                                placeholder={`Story title in ${langInfo || langCode}`}
                                size="sm"
                                disabled={!isConnected}
                              />
                            </FormControl>

                            <FormControl isRequired={isRequired}>
                              <FormLabel size="sm">Description</FormLabel>
                              <Textarea
                                value={content.description}
                                onChange={e =>
                                  handleLanguageChange(langCode, 'description', e.target.value)
                                }
                                placeholder={`Brief description in ${langInfo || langCode}`}
                                rows={2}
                                size="sm"
                                resize="vertical"
                                disabled={!isConnected}
                              />
                            </FormControl>
                          </VStack>
                        </Box>
                      )
                    })}

                    {/* Add Language Options */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Add More Languages:
                      </Text>
                      <HStack wrap="wrap" spacing={2}>
                        {Object.keys(LANGUAGE_NAMES)
                          .filter(lang => !formData.homepage_display[lang])
                          .map(lang => (
                            <Button
                              key={lang}
                              leftIcon={<FaPlus />}
                              size="sm"
                              variant="outline"
                              onClick={() => addLanguage(lang)}
                              disabled={!isConnected}
                            >
                              {LANGUAGE_NAMES[lang]}
                            </Button>
                          ))}
                      </HStack>
                    </Box>
                  </VStack>
                </Collapse>
              </FormControl>
            </Box>

            {/* Submit Section */}
            <VStack spacing={4}>
              <Button
                leftIcon={<FaSave />}
                colorScheme="green"
                size="lg"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText={editMode ? 'Updating Story...' : 'Saving Story...'}
                disabled={
                  !isConnected ||
                  !formData.title ||
                  !formData.content ||
                  !formData.homepage_display.en?.title ||
                  !formData.homepage_display.en?.description
                }
              >
                {editMode ? 'Update Story' : 'Create Story'}
              </Button>

              {!isConnected && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Connect your wallet to save stories
                </Text>
              )}

              {submitStatus.type && (
                <Alert status={submitStatus.type}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {submitStatus.type === 'success'
                        ? editMode
                          ? 'Story Updated!'
                          : 'Story Created!'
                        : editMode
                          ? 'Update Failed'
                          : 'Creation Failed'}
                    </AlertTitle>
                    <AlertDescription>{submitStatus.message}</AlertDescription>
                  </Box>
                </Alert>
              )}

              {submitStatus.type === 'success' && (
                <HStack spacing={4}>
                  <Link href="/">
                    <Button leftIcon={<FaEye />} variant="outline">
                      View All Stories
                    </Button>
                  </Link>
                  <Link href={`/${formData.slug}`}>
                    <Button leftIcon={<FaEye />} colorScheme="blue" variant="outline">
                      Play This Story
                    </Button>
                  </Link>
                </HStack>
              )}
            </VStack>
          </VStack>
        </VStack>
      </Container>
    </>
  )
}

// Loading fallback component
const CreateStoryFallback: React.FC = () => (
  <Container maxW="container.lg" py={10}>
    <Loader />
  </Container>
)

// Main component with Suspense boundary and authentication guard
const CreateStoryPage: React.FC = () => {
  return (
    <AuthenticationGuard>
      <Suspense fallback={<CreateStoryFallback />}>
        <CreateStoryContent />
      </Suspense>
    </AuthenticationGuard>
  )
}

export default CreateStoryPage
