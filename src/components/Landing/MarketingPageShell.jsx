'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import BookDemoModal from './BookDemoModal';
import ContactInfoModal from './ContactInfoModal';
import ContactSalesModal from './ContactSalesModal';
import ContactSection from './ContactSection';
import FooterSection from './FooterSection';
import HeaderSection from './HeaderSection';

const MarketingPageShell = ({ children, showContactSection = true, mainClassName = '' }) => {
  const router = useRouter();
  const [isBookDemoModalOpen, setIsBookDemoModalOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071224] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.14),transparent_46%)]" />
      <div className="pointer-events-none absolute right-[-10rem] top-[16rem] h-[24rem] w-[24rem] rounded-full bg-[#43ead6]/10 blur-3xl" />

      <HeaderSection
        onLogin={() => router.push('/login')}
        onOpenBookDemoModal={() => setIsBookDemoModalOpen(true)}
        onOpenContactInfoModal={() => setIsContactInfoModalOpen(true)}
        isHomePage={false}
      />

      <main className={`relative pt-20 sm:pt-24 ${mainClassName}`}>{children}</main>

      {showContactSection ? (
        <ContactSection
          onOpenContactModal={() => setIsContactModalOpen(true)}
          onOpenBookDemoModal={() => setIsBookDemoModalOpen(true)}
        />
      ) : null}

      <FooterSection
        onOpenContactModal={() => setIsContactModalOpen(true)}
        isHomePage={false}
      />

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
  );
};

export default MarketingPageShell;
