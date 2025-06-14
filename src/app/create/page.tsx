'use client'

import React, { useState } from 'react'
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
} from '@chakra-ui/react'
import {
  FaPlus,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaRobot,
  FaEdit,
  FaSave,
  FaEye,
  FaLanguage,
} from 'react-icons/fa'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'

interface LanguageContent {
  title: string
  description: string
}

interface StoryFormData {
  slug: string
  title: string
  content: string
  homepage_display: Record<string, LanguageContent>
}

interface ClaudeEditorResponse {
  output?: string
  model?: string
  network?: string
  txHash?: string
  explorerLink?: string
  sessionId?: string
  usage?: {
    input_tokens: number
    cache_creation_input_tokens: number
    cache_read_input_tokens: number
    output_tokens: number
    service_tier: string
  }
  error?: string
}

const CreateStoryPage: React.FC = () => {
  const { language } = useLanguage()
  const t = useTranslation()
  const toast = useToast()

  // Main form state
  const [formData, setFormData] = useState<StoryFormData>({
    slug: '',
    title: '',
    content: '',
    homepage_display: {
      en: { title: '', description: '' },
    },
  })

  // Claude editor state
  const [claudeInstructions, setClaudeInstructions] = useState('')
  const [claudeResponse, setClaudeResponse] = useState<ClaudeEditorResponse | null>(null)
  const [isClaudeLoading, setIsClaudeLoading] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(
    null
  )
  const { isOpen: isLanguagesOpen, onToggle: onLanguagesToggle } = useDisclosure()

  // Supported languages
  const supportedLanguages = [
    { code: 'en', name: 'English', required: true },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ar', name: 'العربية' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ru', name: 'Русский' },
    { code: 'pt', name: 'Português' },
    { code: 'ur', name: 'اردو' },
  ]

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Handle form input changes
  const handleInputChange = (field: keyof StoryFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'title' && { slug: generateSlug(value) }),
    }))
  }

  // Handle homepage display changes
  const handleHomepageDisplayChange = (
    langCode: string,
    field: keyof LanguageContent,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      homepage_display: {
        ...prev.homepage_display,
        [langCode]: {
          ...prev.homepage_display[langCode],
          [field]: value,
        },
      },
    }))
  }

  // Add language to homepage display
  const addLanguage = (langCode: string) => {
    if (!formData.homepage_display[langCode]) {
      setFormData(prev => ({
        ...prev,
        homepage_display: {
          ...prev.homepage_display,
          [langCode]: { title: '', description: '' },
        },
      }))
    }
  }

  // Remove language from homepage display
  const removeLanguage = (langCode: string) => {
    if (langCode === 'en') return // Don't allow removing English

    setFormData(prev => {
      const newHomepageDisplay = { ...prev.homepage_display }
      delete newHomepageDisplay[langCode]
      return {
        ...prev,
        homepage_display: newHomepageDisplay,
      }
    })
  }

  // Handle Claude editor request
  const handleClaudeRequest = async () => {
    if (!claudeInstructions.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter instructions for Claude before sending.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsClaudeLoading(true)
    setClaudeResponse(null)

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('message', claudeInstructions)
      formData.append('model', 'anthropic')
      formData.append('sessionId', '')
      formData.append('walletAddress', '')
      formData.append('context', 'rukh')
      formData.append('data', '')
      formData.append('file', '')

      const response = await fetch('https://rukh.w3hc.org/ask', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: ClaudeEditorResponse = await response.json()
      setClaudeResponse(data)

      toast({
        title: 'Claude Response Received',
        description: 'Story instructions have been processed by Claude.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Claude request failed:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setClaudeResponse({ error: errorMessage })

      toast({
        title: 'Claude Request Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsClaudeLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!formData.slug || !formData.title || !formData.content) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Title and Content).',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!formData.homepage_display.en?.title || !formData.homepage_display.en?.description) {
      toast({
        title: 'Validation Error',
        description: 'English title and description are required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitResult({
          success: true,
          message: `Story "${formData.title}" has been saved successfully!`,
        })

        toast({
          title: 'Story Created',
          description: `Your story "${formData.title}" is now available to play.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })

        // Reset form
        setFormData({
          slug: '',
          title: '',
          content: '',
          homepage_display: {
            en: { title: '', description: '' },
          },
        })
      } else {
        throw new Error(data.error || 'Failed to save story')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setSubmitResult({
        success: false,
        message: errorMessage,
      })

      toast({
        title: 'Save Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={4} align="center">
          <Heading as="h1" size="xl" textAlign="center">
            Create Your Story
          </Heading>
          <Text textAlign="center" color="gray.500" maxW="2xl">
            Design an interactive adventure that will be available in 10 languages. Use Claude to
            help craft your story instructions, then build your complete adventure.
          </Text>
        </VStack>

        {/* Claude Editor Section */}
        <Box>
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="md" color="blue.400">
              <HStack>
                <FaRobot />
                <Text>Edit your story instructions with Claude</Text>
              </HStack>
            </Heading>

            <Text fontSize="sm" color="gray.500">
              Get help from Claude to refine your story concept, structure, and educational content.
            </Text>

            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel>Instructions for Claude</FormLabel>
                <Textarea
                  value={claudeInstructions}
                  onChange={e => setClaudeInstructions(e.target.value)}
                  placeholder="Example: Help me create a story about ancient Egypt that teaches kids about hieroglyphs and daily life in ancient times. Make it educational but fun for 8-year-olds..."
                  rows={4}
                  resize="vertical"
                />
              </FormControl>

              <HStack>
                <Button
                  leftIcon={<FaRobot />}
                  colorScheme="blue"
                  onClick={handleClaudeRequest}
                  isLoading={isClaudeLoading}
                  loadingText="Sending to Claude..."
                  disabled={!claudeInstructions.trim()}
                >
                  Send to Claude
                </Button>
              </HStack>

              {/* Claude Response Display */}
              {claudeResponse && (
                <Box>
                  {claudeResponse.error ? (
                    <Alert status="error">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Claude Request Failed</AlertTitle>
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
                            <FaRobot color="#4299E1" />
                            <Text fontWeight="bold" color="blue.400">
                              Claude&apos;s Response
                            </Text>
                          </HStack>
                          {claudeResponse.usage && (
                            <Badge variant="outline" colorScheme="blue" fontSize="xs">
                              {claudeResponse.usage.output_tokens} tokens
                            </Badge>
                          )}
                        </HStack>

                        {claudeResponse.output && (
                          <Box>
                            <Text whiteSpace="pre-wrap" fontSize="sm">
                              {claudeResponse.output}
                            </Text>
                          </Box>
                        )}

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

        <Divider />

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
              />
            </FormControl>

            <FormControl>
              <FormLabel>
                Story Slug{' '}
                <Text as="span" fontSize="sm" color="gray.500">
                  (auto-generated)
                </Text>
              </FormLabel>
              <Input
                value={formData.slug}
                onChange={e => handleInputChange('slug', e.target.value)}
                placeholder="story-slug"
                isReadOnly
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
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
                    onClick={onLanguagesToggle}
                  />
                </HStack>
              </FormLabel>

              <Collapse in={isLanguagesOpen}>
                <VStack spacing={4} mt={4}>
                  {/* Current Languages */}
                  {Object.entries(formData.homepage_display).map(([langCode, content]) => {
                    const langInfo = supportedLanguages.find(l => l.code === langCode)
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
                              <Text fontWeight="bold">
                                {langInfo?.name || langCode.toUpperCase()}
                              </Text>
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
                              />
                            )}
                          </HStack>

                          <FormControl isRequired={isRequired}>
                            <FormLabel size="sm">Title</FormLabel>
                            <Input
                              value={content.title}
                              onChange={e =>
                                handleHomepageDisplayChange(langCode, 'title', e.target.value)
                              }
                              placeholder={`Story title in ${langInfo?.name || langCode}`}
                              size="sm"
                            />
                          </FormControl>

                          <FormControl isRequired={isRequired}>
                            <FormLabel size="sm">Description</FormLabel>
                            <Textarea
                              value={content.description}
                              onChange={e =>
                                handleHomepageDisplayChange(langCode, 'description', e.target.value)
                              }
                              placeholder={`Brief description in ${langInfo?.name || langCode}`}
                              rows={2}
                              size="sm"
                              resize="vertical"
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
                      {supportedLanguages
                        .filter(lang => !formData.homepage_display[lang.code])
                        .map(lang => (
                          <Button
                            key={lang.code}
                            leftIcon={<FaPlus />}
                            size="sm"
                            variant="outline"
                            onClick={() => addLanguage(lang.code)}
                          >
                            {lang.name}
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
              loadingText="Saving Story..."
              disabled={
                !formData.title ||
                !formData.content ||
                !formData.homepage_display.en?.title ||
                !formData.homepage_display.en?.description
              }
            >
              Create Story
            </Button>

            {submitResult && (
              <Alert status={submitResult.success ? 'success' : 'error'}>
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    {submitResult.success ? 'Story Created!' : 'Creation Failed'}
                  </AlertTitle>
                  <AlertDescription>{submitResult.message}</AlertDescription>
                </Box>
              </Alert>
            )}

            {submitResult?.success && (
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
  )
}

export default CreateStoryPage
