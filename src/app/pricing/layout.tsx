import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Avventura | Fair & Transparent Story Creation',
  description:
    'Start free with 1 story. Upgrade to $10/month for unlimited story creation with pay-as-you-consume model. 20% off for education and prevention organizations.',

  openGraph: {
    title: 'Pricing - Avventura | Fair & Transparent Story Creation',
    description:
      'Start free with 1 story. Upgrade to $10/month for unlimited story creation with pay-as-you-consume model. 20% off for education and prevention organizations.',
    url: 'https://v2.avventura.fun/pricing',
    siteName: 'Avventura',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Avventura Pricing - Start Free, Upgrade When Ready',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Pricing - Avventura | Fair & Transparent Story Creation',
    description:
      'Start free with 1 story. Upgrade to $10/month for unlimited story creation with pay-as-you-consume model.',
    images: ['/huangshan.png'],
    creator: '@julienbrg',
  },

  keywords: [
    'avventura pricing',
    'story creation pricing',
    'interactive fiction subscription',
    'pay as you consume',
    'story creator tools',
    'education discount',
    'fair pricing model',
  ],
  authors: [{ name: 'Julien', url: 'https://github.com/julienbrg' }],
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
