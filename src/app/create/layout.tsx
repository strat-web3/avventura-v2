import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Adventure | Avventura',
  description: 'Create your own interactive text-based adventure story',

  openGraph: {
    title: 'Create Adventure | Avventura',
    description: 'Create your own interactive text-based adventure story',
    url: 'https://v2.avventura.fun/create',
    siteName: 'Avventura',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Avventura - Create Your Own Adventure',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Create Adventure | Avventura',
    description: 'Create your own interactive text-based adventure story',
    images: ['/huangshan.png'],
    creator: '@julienbrg',
  },

  keywords: ['adventure', 'storytelling', 'interactive fiction', 'create', 'text-based game'],
  authors: [{ name: 'Julien', url: 'https://github.com/julienbrg' }],
}

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
