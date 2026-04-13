import { useState } from 'react';

import BookDemoModal from './BookDemoModal';
import ContactSection from './ContactSection';
import ContactInfoModal from './ContactInfoModal';
import ContactSalesModal from './ContactSalesModal';
import FooterSection from './FooterSection';
import FaqSection from './FaqSection';
import HeaderSection from './HeaderSection';
import HeroSection from './HeroSection';
import KeyPerformanceMetricsSection from './KeyPerformanceMetricsSection';
import PlatformFeaturesSection from './PlatformFeaturesSection';
import ProblemSection from './ProblemSection';
import SamplePapersSection from './SamplePapersSection';
import SolutionSection from './SolutionSection';
import StudentExperienceSection from './StudentExperienceSection';
import TestimonialsSection from './TestimonialsSection';
import TrustedBySection from './TrustedBySection';

const VidyaLandingPageNew = ({ onLogin, onNavigateToLoginWithTarget }) => {
  const [isBookDemoModalOpen, setIsBookDemoModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "VidyaAI",
        "url": "https://vidyaai.co",
        "logo": "https://vidyaai.co/logo-new.png",
        "description": "AI-based grading platform and learning assistant backed by NVIDIA and AWS",
        "founder": {
          "@type": "Person",
          "name": "VidyaAI Team"
        },
        "foundingDate": "2023",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "US"
        },
        "sameAs": [
          "https://twitter.com/vidyaai",
          "https://linkedin.com/company/vidyaai"
        ],
        "brand": {
          "@type": "Brand",
          "name": "VidyaAI"
        },
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "value": "10-50"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "VidyaAI Platform",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "500",
          "bestRating": "5",
          "worstRating": "1"
        },
        "description": "World's best AI-based grading platform and learning assistant. Automated homework grading and 24/7 AI tutoring.",
        "featureList": [
          "Automated AI Grading",
          "24/7 AI Tutoring",
          "Homework Assessment",
          "Real-time Feedback",
          "Multi-format Support",
          "Analytics Dashboard"
        ],
        "screenshot": "https://vidyaai.co/og-image.png"
      },
      {
        "@type": "WebSite",
        "name": "VidyaAI",
        "url": "https://vidyaai.co",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vidyaai.co/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "ItemList",
        "name": "VidyaAI University Partners",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "item": {
              "@type": "Organization",
              "name": "University of Texas at Dallas"
            }
          },
          {
            "@type": "ListItem",
            "position": 2,
            "item": {
              "@type": "Organization",
              "name": "San Jose State University"
            }
          },
          {
            "@type": "ListItem",
            "position": 3,
            "item": {
              "@type": "Organization",
              "name": "University of Houston Clear Lake"
            }
          },
          {
            "@type": "ListItem",
            "position": 4,
            "item": {
              "@type": "Organization",
              "name": "Troy University"
            }
          },
          {
            "@type": "ListItem",
            "position": 5,
            "item": {
              "@type": "Organization",
              "name": "Santa Clara University"
            }
          }
        ]
      }
    ]
  };
  
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    }
  };

  const handleGetStarted = () => {
    if (onNavigateToLoginWithTarget) {
      onNavigateToLoginWithTarget('home');
    }
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="relative overflow-hidden bg-[#071224] text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.15),transparent_45%)]" />
        <div className="pointer-events-none absolute right-[-10rem] top-[18rem] h-[24rem] w-[24rem] rounded-full bg-[#43ead6]/10 blur-3xl" />

        <HeaderSection
          onLogin={handleLogin}
          onGetStarted={handleGetStarted}
          onOpenBookDemoModal={() => setIsBookDemoModalOpen(true)}
          onOpenContactInfoModal={() => setIsContactInfoModalOpen(true)}
        />
        <main className="pt-20 sm:pt-24">
          <HeroSection onGetStarted={handleGetStarted} onLogin={handleLogin} />
          <TrustedBySection />
          <ProblemSection />
          <SolutionSection />
          <PlatformFeaturesSection />
          <StudentExperienceSection />
          <KeyPerformanceMetricsSection />
          <TestimonialsSection />
          <SamplePapersSection />
          <FaqSection />
          <ContactSection
            onOpenContactModal={() => setIsContactModalOpen(true)}
            onOpenBookDemoModal={() => setIsBookDemoModalOpen(true)}
          />
        </main>
        <FooterSection onOpenContactModal={() => setIsContactModalOpen(true)} />
        <BookDemoModal
          open={isBookDemoModalOpen}
          onClose={() => setIsBookDemoModalOpen(false)}
        />
        <ContactInfoModal
          open={isContactInfoModalOpen}
          onClose={() => setIsContactInfoModalOpen(false)}
        />
        <ContactSalesModal
          open={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
      </div>
    </>
  );
};

export default VidyaLandingPageNew;
