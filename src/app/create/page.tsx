// src/app/create/page.tsx - Original version with background English fallback
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
  FaSave,
  FaEye,
  FaQuestionCircle,
  FaBook,
} from 'react-icons/fa'
import Link from 'next/link'

interface HomepageTranslation {
  title: string
  description: string
}

interface HomepageDisplay {
  [languageCode: string]: HomepageTranslation
}

interface StoryForm {
  slug: string
  title: string
  content: string
  homepage_display: HomepageDisplay
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文 (Chinese)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'es', name: 'Español (Spanish)' },
  { code: 'fr', name: 'Français (French)' },
  { code: 'ar', name: 'العربية (Arabic)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'ru', name: 'Русский (Russian)' },
  { code: 'pt', name: 'Português (Portuguese)' },
  { code: 'ur', name: 'اردو (Urdu)' },
]

const StoryCreator: React.FC = () => {
  const [form, setForm] = useState<StoryForm>({
    slug: '',
    title: '',
    content: '',
    homepage_display: {
      en: { title: '', description: '' },
    },
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const toast = useToast()
  const { isOpen: isPreviewOpen, onToggle: togglePreview } = useDisclosure()
  const { isOpen: isHelpOpen, onToggle: toggleHelp } = useDisclosure()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate slug
    if (!form.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    // Validate title
    if (!form.title.trim()) {
      newErrors.title = 'Title is required'
    }

    // Validate content
    if (!form.content.trim()) {
      newErrors.content = 'Story content is required'
    } else if (form.content.length < 100) {
      newErrors.content = 'Story content must be at least 100 characters long'
    }

    // Validate at least English homepage translation is provided
    if (!form.homepage_display.en?.title?.trim()) {
      newErrors['homepage_en_title'] = 'English title is required'
    }
    if (!form.homepage_display.en?.description?.trim()) {
      newErrors['homepage_en_description'] = 'English description is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors below before submitting.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    try {
      console.log('📤 Submitting story with English fallback support:', form)

      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create story')
      }

      toast({
        title: 'Success! 🎉',
        description: `Story "${form.title}" has been created and is available in ${data.availableLanguages?.length || 10} languages!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      console.log('✅ Story created with automatic language fallbacks:', data.story)

      // Reset form
      setForm({
        slug: '',
        title: '',
        content: '',
        homepage_display: {
          en: { title: '', description: '' },
        },
      })
      setErrors({})
    } catch (error) {
      console.error('Error creating story:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create story',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSlugFromTitle = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()

    setForm(prev => ({ ...prev, slug }))
  }

  const addLanguage = (languageCode: string) => {
    if (!form.homepage_display[languageCode]) {
      setForm(prev => ({
        ...prev,
        homepage_display: {
          ...prev.homepage_display,
          [languageCode]: { title: '', description: '' },
        },
      }))
    }
  }

  const removeLanguage = (languageCode: string) => {
    if (languageCode !== 'en') {
      // Only English is required now
      const newDisplay = { ...form.homepage_display }
      delete newDisplay[languageCode]
      setForm(prev => ({ ...prev, homepage_display: newDisplay }))
    }
  }

  const updateHomepageDisplay = (
    languageCode: string,
    field: 'title' | 'description',
    value: string
  ) => {
    setForm(prev => ({
      ...prev,
      homepage_display: {
        ...prev.homepage_display,
        [languageCode]: {
          ...prev.homepage_display[languageCode],
          [field]: value,
        },
      },
    }))
  }

  const availableLanguages = SUPPORTED_LANGUAGES.filter(lang => !form.homepage_display[lang.code])

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={4} align="center">
          <Heading size="xl" textAlign="center">
            🧪 Story Labs
          </Heading>
          <Text fontSize="lg" color="gray.400" textAlign="center" maxW="600px">
            Create your own interactive adventure story! Your story will be automatically available
            in all supported languages.
          </Text>
        </VStack>

        {/* Info Alert */}
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Story Creation Guidelines</AlertTitle>
            <AlertDescription>
              Your story should include educational content, clear milestones, and be appropriate
              for all ages. Stories will be playable in all supported languages through AI
              translation. English translation is required - other languages are optional and will
              automatically use English content if not provided.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Help Section */}
        <Box>
          <Button leftIcon={<FaQuestionCircle />} variant="outline" onClick={toggleHelp} mb={4}>
            {isHelpOpen ? 'Hide' : 'Show'} Story Creation Guide
          </Button>
          <Collapse in={isHelpOpen}>
            <Box
              p={6}
              border="1px"
              borderColor="blue.500"
              borderRadius="md"
              bg="blue.900"
              _dark={{ bg: 'blue.900' }}
            >
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="blue.600" _dark={{ color: 'blue.300' }}>
                  📖 How to Create a Great Story
                </Heading>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Required Sections:
                  </Text>
                  <VStack spacing={2} align="stretch" pl={4}>
                    <Text>
                      • <strong>Setting:</strong> Describe the world, time period, and environment
                    </Text>
                    <Text>
                      • <strong>Starting Scene:</strong> The opening scene where adventure begins
                    </Text>
                    <Text>
                      • <strong>Story Context:</strong> Main character and educational objectives
                    </Text>
                    <Text>
                      • <strong>Milestones:</strong> Key achievement moments in the adventure
                    </Text>
                  </VStack>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Example Template:
                  </Text>
                  <Box bg="gray.800" p={3} borderRadius="md" fontSize="sm">
                    <pre>{`# Adventure Title

## Setting
Describe the world and time period...

## Starting Scene  
You find yourself in [location]. The [sensory details]...

## Story Context
**Main Character:** Who the player is...
**Educational Objectives:**
- Learn about [topic]
- Understand [concept]

## Milestones
- **Achievement**: When [event], set action to "milestone".

## Additional Context
Detailed background information...`}</pre>
                  </Box>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Tips for Success:
                  </Text>
                  <VStack spacing={1} align="stretch" pl={4}>
                    <Text>• Start with an engaging hook</Text>
                    <Text>• Include clear learning goals</Text>
                    <Text>• Keep content age-appropriate</Text>
                    <Text>• Add rich sensory details</Text>
                    <Text>• Design for player choice and interaction</Text>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </Collapse>
        </Box>

        {/* Main Form */}
        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Box>
              <Heading size="md" mb={4}>
                📝 Basic Information
              </Heading>
              <VStack spacing={4} align="stretch">
                {/* Title */}
                <FormControl isRequired isInvalid={!!errors.title}>
                  <FormLabel>Story Title</FormLabel>
                  <Input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your story title..."
                    onBlur={() => !form.slug && generateSlugFromTitle()}
                  />
                  {errors.title && (
                    <Text color="red.500" fontSize="sm">
                      {errors.title}
                    </Text>
                  )}
                </FormControl>

                {/* Slug */}
                <FormControl isRequired isInvalid={!!errors.slug}>
                  <FormLabel>
                    URL Slug{' '}
                    <Button size="xs" variant="ghost" onClick={generateSlugFromTitle}>
                      Generate from title
                    </Button>
                  </FormLabel>
                  <Input
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="story-url-slug"
                  />
                  <Text fontSize="sm" color="gray.500">
                    Only lowercase letters, numbers, and hyphens. This will be the URL: /your-slug
                  </Text>
                  {errors.slug && (
                    <Text color="red.500" fontSize="sm">
                      {errors.slug}
                    </Text>
                  )}
                </FormControl>
              </VStack>
            </Box>

            <Divider />

            {/* Story Content */}
            <Box>
              <Heading size="md" mb={4}>
                📚 Story Content
              </Heading>
              <FormControl isRequired isInvalid={!!errors.content}>
                <FormLabel>Story Markdown Content</FormLabel>
                <Textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={`# Your Adventure Title

## Setting
Describe the world, time period, and environment where your story takes place...

## Starting Scene
You find yourself in [specific location]. Describe the opening scene with rich sensory details...

## Story Context
**Main Character:** Describe who the player is in this adventure.

**Educational Objectives:**
- Learn about [specific topic]
- Understand [key concepts]
- Experience [historical period/situation]

**Tone and Style:**
- Appropriate for [age group]
- Focus on [learning goals]

## Milestones
- **First Achievement**: When [describe event], set action to "milestone".

## Additional Context
Provide detailed background information for authentic experiences...`}
                  rows={20}
                  fontFamily="mono"
                  fontSize="sm"
                />
                <Text fontSize="sm" color="gray.500">
                  Include setting, starting scene, milestones, and any additional context. Use
                  Markdown formatting for structure.
                </Text>
                {errors.content && (
                  <Text color="red.500" fontSize="sm">
                    {errors.content}
                  </Text>
                )}
              </FormControl>

              {/* Content Preview */}
              <Button
                leftIcon={isPreviewOpen ? <FaChevronUp /> : <FaChevronDown />}
                variant="ghost"
                size="sm"
                onClick={togglePreview}
                mt={2}
              >
                {isPreviewOpen ? 'Hide' : 'Show'} Content Preview
              </Button>
              <Collapse in={isPreviewOpen}>
                <Box
                  p={4}
                  border="1px"
                  borderColor="gray.600"
                  borderRadius="md"
                  bg="gray.800"
                  mt={2}
                  maxH="400px"
                  overflowY="auto"
                >
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{form.content}</pre>
                </Box>
              </Collapse>
            </Box>

            <Divider />

            {/* Homepage Translations */}
            <Box>
              <Heading size="md" mb={4}>
                🌍 Homepage Translations
              </Heading>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Provide title and description for how your story appears on the homepage in
                different languages. English is required - other languages are optional and will
                automatically use English content if not provided.
              </Text>

              <VStack spacing={6} align="stretch">
                {Object.entries(form.homepage_display).map(([langCode, translation]) => {
                  const language = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
                  const isRequired = langCode === 'en'

                  return (
                    <Box key={langCode} p={4} border="1px" borderColor="gray.600" borderRadius="md">
                      <HStack justify="space-between" mb={3}>
                        <HStack>
                          <Badge colorScheme={isRequired ? 'red' : 'blue'}>
                            {language?.name || langCode}
                          </Badge>
                          {isRequired && (
                            <Text fontSize="xs" color="red.500">
                              (Required - Used as fallback for other languages)
                            </Text>
                          )}
                        </HStack>
                        {!isRequired && (
                          <IconButton
                            icon={<FaTrash />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => removeLanguage(langCode)}
                            aria-label={`Remove ${language?.name} translation`}
                          />
                        )}
                      </HStack>

                      <VStack spacing={3} align="stretch">
                        <FormControl
                          isRequired={isRequired}
                          isInvalid={!!errors[`homepage_${langCode}_title`]}
                        >
                          <FormLabel size="sm">Title</FormLabel>
                          <Input
                            value={translation.title}
                            onChange={e => updateHomepageDisplay(langCode, 'title', e.target.value)}
                            placeholder={`Story title in ${language?.name}...`}
                          />
                          {errors[`homepage_${langCode}_title`] && (
                            <Text color="red.500" fontSize="sm">
                              {errors[`homepage_${langCode}_title`]}
                            </Text>
                          )}
                        </FormControl>

                        <FormControl
                          isRequired={isRequired}
                          isInvalid={!!errors[`homepage_${langCode}_description`]}
                        >
                          <FormLabel size="sm">Description</FormLabel>
                          <Textarea
                            value={translation.description}
                            onChange={e =>
                              updateHomepageDisplay(langCode, 'description', e.target.value)
                            }
                            placeholder={`Brief description in ${language?.name}...`}
                            rows={2}
                          />
                          {errors[`homepage_${langCode}_description`] && (
                            <Text color="red.500" fontSize="sm">
                              {errors[`homepage_${langCode}_description`]}
                            </Text>
                          )}
                        </FormControl>
                      </VStack>
                    </Box>
                  )
                })}

                {/* Add Language */}
                {availableLanguages.length > 0 && (
                  <Box>
                    <Text fontSize="sm" mb={2}>
                      Add custom translations for additional languages (optional - will use English
                      if not provided):
                    </Text>
                    <HStack wrap="wrap" spacing={2}>
                      {availableLanguages.map(language => (
                        <Button
                          key={language.code}
                          size="sm"
                          variant="outline"
                          leftIcon={<FaPlus />}
                          onClick={() => addLanguage(language.code)}
                        >
                          {language.name}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Box>

            <Divider />

            {/* Submit */}
            <HStack spacing={4} justify="center" pt={4}>
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                leftIcon={<FaSave />}
                isLoading={loading}
                loadingText="Creating Story..."
                isDisabled={Object.keys(errors).length > 0}
              >
                Create Story
              </Button>
              <Link href="/">
                <Button variant="outline" size="lg" leftIcon={<FaEye />}>
                  View Stories
                </Button>
              </Link>
              <Button variant="ghost" size="lg" leftIcon={<FaBook />} onClick={toggleHelp}>
                Guide
              </Button>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default StoryCreator
