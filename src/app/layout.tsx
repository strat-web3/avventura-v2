'use client'

import { Inter } from 'next/font/google'
import './globals.css'
import ContextProvider from '@/context'
import Header from '@/components/Header'
import { Box } from '@chakra-ui/react'
import { metadata } from './metadata'
import { LanguageProvider } from '@/context/LanguageContext'
import { usePathname } from 'next/navigation'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()

  // Check if we're on a story page (matches /[storyName] pattern)
  // We exclude the root path and other known routes
  const isStoryPage =
    pathname !== '/' &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/new') &&
    !pathname.startsWith('/wallet') &&
    !pathname.startsWith('/referral') &&
    !pathname.startsWith('/subscribe') &&
    pathname.split('/').length === 2 // Single level path like /montpellier

  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider>
          <LanguageProvider>
            {!isStoryPage && <Header />}
            <Box pt={'72px'}>{children}</Box>
          </LanguageProvider>
        </ContextProvider>
      </body>
    </html>
  )
}
