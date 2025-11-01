import { Metadata } from 'next'
import LandingPageWrapper from './LandingPageWrapper'

export const metadata: Metadata = {
  title: 'VidyaAI - Chat with VLSI & STEM Videos to Clarify Technical Doubts',
  description: 'Paste any VLSI, chip design, or engineering video URL. Ask questions about circuit analysis, timing diagrams, and complex concepts. Get instant technical explanations for STEM subjects.',
  keywords: [
    'chat with VLSI videos',
    'chip design help',
    'circuit analysis questions',
    'STEM video tutor',
    'engineering lecture help',
    'technical doubt clearing',
    'semiconductor education',
    'VLSI learning',
    'video learning assistant',
    'engineering video chat',
    'circuit design tutorial',
    'STEM education platform',
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
    title: 'VidyaAI - Chat With VLSI & Engineering Videos',
    description: 'Chat with chip design and STEM video lectures. Ask technical questions, clarify doubts about circuits, timing diagrams, and complex engineering concepts instantly.',
    url: 'https://vidyaai.co',
    siteName: 'VidyaAI',
    images: [
      {
        url: '/vidyaai_home.png',
        width: 1200,
        height: 630,
        alt: 'VidyaAI - Chat with VLSI & STEM Videos',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VidyaAI - Chat With Engineering Videos',
    description: 'Paste VLSI & STEM video URLs. Ask technical questions. Get instant answers about chip design, circuits, and complex concepts.',
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
