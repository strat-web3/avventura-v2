'use client'

import React, { useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Language, detectUserLanguage } from '@/utils/i18n'
import { IconButton, Menu, MenuButton, MenuList, MenuItem, Text, Flex, Box } from '@chakra-ui/react'
import { MdLanguage } from 'react-icons/md'

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  // Detect and set browser language on component mount
  useEffect(() => {
    try {
      // Only run on client side and if language hasn't been explicitly set
      if (typeof window !== 'undefined' && !localStorage.getItem('userLanguageExplicitlySet')) {
        const detectedLanguage = detectUserLanguage()
        console.log('Detected browser language:', detectedLanguage)

        // Only change if detected language is different from current
        if (detectedLanguage !== language) {
          setLanguage(detectedLanguage)
          console.log('Language automatically set to:', detectedLanguage)
        }
      }
    } catch (error) {
      console.error('Error in language detection:', error)
      // Fallback to French if there's any error
      if (language !== 'fr') {
        setLanguage('fr')
      }
    }
  }, [language, setLanguage]) // Include dependencies

  const handleLanguageChange = (newLang: Language) => {
    try {
      setLanguage(newLang)
      // Mark that user has explicitly chosen a language
      if (typeof window !== 'undefined') {
        localStorage.setItem('userLanguageExplicitlySet', 'true')
      }
      console.log('Language manually changed to:', newLang)
    } catch (error) {
      console.error('Error changing language:', error)
    }
  }

  const languageInfo = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'ar', name: 'العربية' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ru', name: 'Русский' },
    { code: 'pt', name: 'Português' },
    { code: 'ur', name: 'اردو' },
  ]

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Select language"
        icon={<MdLanguage size="1.2em" />}
        variant="ghost"
        size="sm"
      />
      <MenuList maxH="300px" overflowY="auto" minWidth="auto">
        {languageInfo.map(({ code, name }) => (
          <MenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            bg={language === code ? 'whiteAlpha.200' : undefined}
            _hover={{ bg: 'whiteAlpha.300' }}
          >
            <Flex align="center" justify="space-between">
              <Box>
                <Text display="inline">{name}</Text>
              </Box>
              {language === code && (
                <Text fontSize="sm" color="green.300" ml={2}>
                  ✓
                </Text>
              )}
            </Flex>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}

export default LanguageSelector
