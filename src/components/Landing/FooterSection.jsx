import { useState } from 'react';
import Link from 'next/link';
import { Instagram, Linkedin, MessageCircle } from 'lucide-react';

import LegalInfoModal from './LegalInfoModal';
import { LANDING_EXTERNAL_URLS, LANDING_ROUTES } from './landingCtas';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'For Professors', href: LANDING_ROUTES.setUserType, type: 'page' },
      { label: 'For Students', href: LANDING_ROUTES.setUserType, type: 'page' },
      { label: 'For Institutes', type: 'contact-modal' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: LANDING_EXTERNAL_URLS.about, type: 'external', newTab: true },
      { label: 'Pricing', href: LANDING_ROUTES.pricing, type: 'page', newTab: true },
      { label: 'Contact', type: 'contact-modal' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: LANDING_ROUTES.blog, type: 'page', newTab: true },
      { label: 'Sample Papers', href: LANDING_ROUTES.samplePapers, type: 'page', newTab: true },
      { label: 'Pricing', href: LANDING_ROUTES.pricing, type: 'page', newTab: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', type: 'legal-modal' },
      { label: 'Terms of Service', type: 'legal-modal' },
      { label: 'Cookies', type: 'legal-modal' },
    ],
  },
];

const socialLinks = [
  { label: 'LinkedIn', href: LANDING_EXTERNAL_URLS.linkedin, icon: Linkedin },
  { label: 'Instagram', href: LANDING_EXTERNAL_URLS.instagram, icon: Instagram },
  { label: 'WhatsApp', href: LANDING_EXTERNAL_URLS.whatsapp, icon: MessageCircle },
];

const FooterSection = ({ onOpenContactModal, isHomePage = true }) => {
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <footer className="border-t border-[#12213a] bg-[#081325]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            {isHomePage ? (
              <button
                type="button"
                onClick={() => scrollToSection('hero')}
                className="text-left text-lg font-semibold tracking-tight text-white"
              >
                VidyaAI
              </button>
            ) : (
              <Link href={LANDING_ROUTES.home} className="text-left text-lg font-semibold tracking-tight text-white">
                VidyaAI
              </Link>
            )}
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              The campus AI layer for collaborative learning, institutional oversight, and scalable
              student support.
            </p>
            <div className="mt-6 flex items-center gap-3 text-slate-500">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a2943] bg-white/5 text-slate-400 transition hover:border-[#43ead6]/25 hover:bg-[#43ead6]/10 hover:text-[#43ead6]"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title} className="min-w-[10rem]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {column.title}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => {
                    if (link.type === 'page') {
                      return (
                        <Link
                          key={link.label}
                          href={link.href}
                          target={link.newTab ? '_blank' : undefined}
                          rel={link.newTab ? 'noopener noreferrer' : undefined}
                          className="whitespace-nowrap text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </Link>
                      );
                    }

                    if (link.type === 'external') {
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target={link.newTab ? '_blank' : undefined}
                          rel={link.newTab ? 'noopener noreferrer' : undefined}
                          className="whitespace-nowrap text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </a>
                      );
                    }

                    if (link.type === 'contact-modal') {
                      return (
                        <button
                          key={link.label}
                          type="button"
                          onClick={onOpenContactModal}
                          className="whitespace-nowrap text-left text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </button>
                      );
                    }

                    if (link.type === 'legal-modal') {
                      return (
                        <button
                          key={link.label}
                          type="button"
                          onClick={() => setActiveLegalModal(link.label)}
                          className="whitespace-nowrap text-left text-sm text-slate-300 transition hover:text-white"
                        >
                          {link.label}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={link.label}
                        type="button"
                        onClick={() => scrollToSection(link.href.replace('#', ''))}
                        className="whitespace-nowrap text-left text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#12213a]">
          <div className="mx-auto flex w-full max-w-6xl px-5 py-5 text-xs uppercase tracking-[0.16em] text-slate-500 sm:px-6">
            <p>© 2026 Vidya AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LegalInfoModal
        open={Boolean(activeLegalModal)}
        title={activeLegalModal}
        onClose={() => setActiveLegalModal(null)}
      />
    </>
  );
};

export default FooterSection;
