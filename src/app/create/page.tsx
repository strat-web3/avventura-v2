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
  FaEdit,
  FaSave,
  FaEye,
  FaLanguage,
} from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const CreateStoryPage: React.FC = () => {
  const [formData, setFormData] = useState<StoryFormData>({
    slug: '',
    title: '',
    content: '',
    homepage_display: {
      en: { title: '', description: '' },
      fr: { title: '', description: '' },
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [claudePrompt, setClaudePrompt] = useState('')
  const [claudeResponse, setClaudeResponse] = useState<any>(null)
  const [isSendingToClaude, setIsSendingToClaude] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const { isOpen: isLanguagesOpen, onToggle: onToggleLanguages } = useDisclosure()
  const toast = useToast()
  const router = useRouter()

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
      ...(field === 'title' && { slug: generateSlug(value) }),
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
      // Create the story generation prompt
      const storyGenerationPrompt = `You are a creative story writer and adventure game designer. The user wants you to create an interactive text-based adventure story based on their prompt.

Your task is to generate a complete story specification that follows this exact JSON format:

\`\`\`json
{
  "slug": "story-url-slug",
  "title": "Story Title",
  "content": "# Story Title\\n\\n## Setting\\n\\n[Detailed setting description]\\n\\n## Starting Scene\\n\\n[Opening scene description]\\n\\n## Story Context\\n\\n**Main Character:** [Character description]\\n\\n**Educational Objectives:**\\n- [Learning objective 1]\\n- [Learning objective 2]\\n- [Learning objective 3]\\n\\n**Tone and Style:**\\n- [Style guideline 1]\\n- [Style guideline 2]\\n\\n## Milestones\\n\\n- **Achievement**: When [milestone condition], set action to \\"milestone\\".\\n\\n## Additional Context\\n\\n[Additional story context, historical information, character details, etc.]",
  "homepage_display": {
    "en": { 
      "title": "English Story Title", 
      "description": "Engaging English description of the story" 
    },
    "fr": { 
      "title": "Titre de l'Histoire en Français", 
      "description": "Description engageante de l'histoire en français" 
    },
    "es": { 
      "title": "Título de la Historia en Español", 
      "description": "Descripción atractiva de la historia en español" 
    },
    "zh": { 
      "title": "中文故事标题", 
      "description": "中文故事的吸引人描述" 
    },
    "hi": { 
      "title": "हिंदी कहानी शीर्षक", 
      "description": "हिंदी में कहानी का आकर्षक विवरण" 
    },
    "ar": { 
      "title": "عنوان القصة بالعربية", 
      "description": "وصف جذاب للقصة بالعربية" 
    },
    "bn": { 
      "title": "বাংলা গল্পের শিরোনাম", 
      "description": "বাংলায় গল্পের আকর্ষণীয় বর্ণনা" 
    },
    "ru": { 
      "title": "Название истории на русском", 
      "description": "Увлекательное описание истории на русском" 
    },
    "pt": { 
      "title": "Título da História em Português", 
      "description": "Descrição envolvente da história em português" 
    },
    "ur": { 
      "title": "اردو کہانی کا عنوان", 
      "description": "اردو میں کہانی کی دلکش تفصیل" 
    }
  }
}
\`\`\`

IMPORTANT GUIDELINES:
1. The "content" field should be a detailed markdown document with proper sections
2. Make the story educational and engaging
3. Include specific milestones that trigger when certain story events happen
4. Provide translations for all 10 supported languages in homepage_display
5. The slug should be URL-friendly (lowercase, hyphens only)
6. Make the story historically accurate if it involves real events/people
7. Keep the tone appropriate for all ages
8. Return ONLY the JSON object, no other text

User's story prompt: "${claudePrompt}"

Generate a complete story specification now:`

      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('message', storyGenerationPrompt)
      formData.append('model', 'anthropic')
      formData.append('sessionId', '')
      formData.append('walletAddress', '')
      formData.append('context', 'avventura')
      formData.append('data', '')
      formData.append('file', '')

      // Use the proxy endpoint (works in both local and Netlify)
      const response = await fetch('/api/proxy/claude/ask', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setClaudeResponse(data)

      // Try to parse the JSON from Claude's response and auto-fill the form
      if (data.output) {
        try {
          // Clean the response (remove markdown code blocks if present)
          const cleanResponse = data.output.replace(/```json\s*|\s*```/g, '').trim()
          const storyData = JSON.parse(cleanResponse)

          // Validate the response has required fields
          if (storyData.slug && storyData.title && storyData.content) {
            setFormData({
              slug: storyData.slug,
              title: storyData.title,
              content: storyData.content,
              homepage_display: storyData.homepage_display || {
                en: { title: storyData.title, description: 'Adventure awaits!' },
              },
            })

            toast({
              title: 'Story Generated & Form Pre-filled!',
              description:
                'Claude has generated your story and pre-filled the form. Review and save when ready.',
              status: 'success',
              duration: 5000,
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
          console.log('Could not parse Claude response for auto-fill:', parseError)
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
      setIsSendingToClaude(false)
    }
  }

  // Submit form to save story
  const handleSubmit = async () => {
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
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: `Story "${result.story.title}" has been created successfully!`,
        })

        toast({
          title: 'Story Created',
          description: `"${result.story.title}" is now available`,
          status: 'success',
          duration: 5000,
        })

        // Redirect to homepage after a delay
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to create story',
        })
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Network error: Failed to save story',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableLanguages = Object.keys(LANGUAGE_NAMES).filter(
    lang => !Object.keys(formData.homepage_display).includes(lang)
  )

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" mb={4}>
            Create Your Own Story
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Generate stories manually or with the help of our faithful assistant
          </Text>
        </Box>

        {/* Claude Generation Section */}
        <Box>
          <VStack spacing={4} align="stretch">
            <Heading as="h2" size="md" color="blue.400">
              <HStack>
                <FaEdit />
                <Text>Generate with Rukh AI</Text>
              </HStack>
            </Heading>

            <Text fontSize="sm" color="gray.500">
              Describe your story idea and Rukh will generate a complete adventure with multilingual
              content.
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
                />
              </FormControl>

              <HStack>
                <Button
                  leftIcon={<FaEdit />}
                  colorScheme="blue"
                  onClick={handleClaudeRequest}
                  isLoading={isSendingToClaude}
                  loadingText="Generating..."
                  disabled={!claudePrompt.trim()}
                >
                  Generate Story
                </Button>
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
                          ✅ Form has been pre-filled with the generated story. Review the content
                          below and make any adjustments needed.
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
                    onClick={onToggleLanguages}
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

            {submitStatus.type && (
              <Alert status={submitStatus.type}>
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    {submitStatus.type === 'success' ? 'Story Created!' : 'Creation Failed'}
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
  )
}

export default CreateStoryPage
