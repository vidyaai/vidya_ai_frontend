import { Metadata } from 'next'
import LandingPageWrapper from './(landing)/LandingPageWrapper'

export const metadata: Metadata = {
  title: 'VidyaAI - Transform STEM Learning with AI-Powered Education',
  description: 'Empower students with 24/7 AI tutoring and help educators save 30+ hours per week with automated grading. AI-powered video chat, quiz generation, and assignment management for STEM education.',
  keywords: [
    'AI education',
    'STEM learning',
    'AI tutor',
    'automated grading',
    'video learning',
    'homework assistant',
    'AI quiz generator',
    'online education',
    'STEM tutoring',
    'educational technology',
    'AI teaching assistant',
    'student learning platform',
  ],
  authors: [{ name: 'VidyaAI', url: 'https://vidyaai.co' }],
  creator: 'VidyaAI',
  publisher: 'VidyaAI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'VidyaAI - AI-Powered STEM Education Platform',
    description: '24/7 AI tutoring for students and automated grading for educators. Transform STEM learning with intelligent AI assistance.',
    url: 'https://vidyaai.co',
    siteName: 'VidyaAI',
    images: [
      {
        url: '/vidyaai_home.png',
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
    title: 'VidyaAI - Transform STEM Learning with AI',
    description: '24/7 AI tutoring for students and automated grading for educators',
    images: ['/vidyaai_home.png'],
    creator: '@vidyaai',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://vidyaai.co',
  },
}

export default function Home() {
  return <LandingPageWrapper />
}

