import { Metadata } from 'next'
import LandingPageWrapper from './LandingPageWrapper'

export const metadata: Metadata = {
  title: 'VidyaAI - World\'s Best AI Learning Assistant & AI-Based Grading Platform',
  description: 'Transform education with AI-powered learning assistant and automated grading platform. Save 33+ hours weekly for professors. 24/7 AI tutoring for students. Backed by NVIDIA & AWS. Join 500+ universities.',
  keywords: [
    'AI based grading platform',
    'world\'s best AI learning assistant',
    'automated grading system',
    'AI homework grading',
    'AI tutoring platform',
    'AI education platform',
    'automated assessment tool',
    'AI powered education',
    'AI grading software',
    'intelligent tutoring system',
    'AI teaching assistant',
    'automated homework grading',
    'AI learning companion',
    'educational AI platform',
    'AI for professors',
    'AI for students',
    'STEM AI tutor',
    'AI assignment grading',
    'artificial intelligence education',
    'smart grading system',
    'AI academic assistant',
    'online AI tutor',
    'AI based learning platform',
    'automated education platform',
    'AI homework helper',
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
    title: 'VidyaAI - AI Learning Assistant & Automated Grading Platform',
    description: 'The world\'s most advanced AI-based grading platform and learning assistant. Save 33+ hours weekly. Trusted by professors from UT Dallas, SJSU, UHCL. Backed by NVIDIA & AWS.',
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
    title: 'VidyaAI - AI Grading Platform & Learning Assistant',
    description: 'AI-based automated grading & 24/7 learning assistant. Save time, improve outcomes. Backed by NVIDIA & AWS.',
    images: ['/twitter-image.png'],
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
  category: 'Education Technology',
}

export default function Home() {
  return <LandingPageWrapper />
}
