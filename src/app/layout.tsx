import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyaai.co'),
  title: {
    default: 'VidyaAI - AI Grading Platform & Learning Assistant',
    template: '%s | VidyaAI',
  },
  description: 'World\'s best AI-based grading platform and learning assistant. Save 33+ hours weekly with automated grading. 24/7 AI tutoring for students. Trusted by 500+ universities. Backed by NVIDIA & AWS.',
  keywords: [
    'AI grading platform',
    'automated grading system',
    'AI learning assistant',
    'AI tutoring platform',
    'homework grading AI',
    'AI education platform',
    'intelligent tutoring system',
    'AI teaching assistant',
    'automated assessment',
    'AI for professors',
    'AI for students',
    'educational technology',
    'AI homework helper',
    'smart grading software',
    'AI academic assistant',
  ],
  authors: [{ name: 'VidyaAI' }],
  creator: 'VidyaAI',
  publisher: 'VidyaAI',
  openGraph: {
    title: 'VidyaAI - AI Grading Platform & Learning Assistant',
    description: 'Transform education with AI-powered learning and automated grading. Save 33+ hours weekly. Backed by NVIDIA & AWS.',
    url: 'https://vidyaai.co',
    siteName: 'VidyaAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VidyaAI - AI-Based Grading Platform and Learning Assistant',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidyaAI - AI Grading & Learning Platform',
    description: 'AI-based automated grading & 24/7 learning assistant. Backed by NVIDIA & AWS.',
    creator: '@vidyaai',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo-new-2.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
