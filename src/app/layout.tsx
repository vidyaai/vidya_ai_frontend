import type { Metadata } from 'next'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyaai.co'),
  title: {
    default: 'VidyaAI - AI-Powered STEM Education Platform',
    template: '%s | VidyaAI',
  },
  description: 'Transform STEM learning with 24/7 AI tutoring and automated grading. Save 30+ hours per week for educators.',
  keywords: 'AI education, STEM learning, automated grading, AI tutor, homework assistant, video learning',
  authors: [{ name: 'VidyaAI' }],
  openGraph: {
    title: 'VidyaAI - AI-Powered STEM Education',
    description: '24/7 AI tutoring for students and automated grading for educators',
    url: 'https://vidyaai.co',
    siteName: 'VidyaAI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VidyaAI - AI STEM Education Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidyaAI - AI-Powered STEM Education',
    description: '24/7 AI tutoring for students and automated grading for educators',
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
        <link rel="icon" type="image/png" href="/logo-new.png" />
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
