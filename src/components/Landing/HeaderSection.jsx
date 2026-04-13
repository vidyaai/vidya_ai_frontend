import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import {
  LANDING_ROUTES,
} from './landingCtas';

const navItems = [
  { label: 'Problem', href: '#problem', type: 'anchor' },
  { label: 'Solution', href: '#solution', type: 'anchor' },
  { label: 'Pricing', href: LANDING_ROUTES.pricing, type: 'page', newTab: true },
  { label: 'Blog', href: LANDING_ROUTES.blog, type: 'page', newTab: true },
  { label: 'Sample Papers', href: LANDING_ROUTES.samplePapers, type: 'page', newTab: true },
  { label: 'Contact', type: 'contact' },
];

const desktopNavLinkClass =
  'relative inline-flex items-center py-2 text-sm font-medium text-slate-300 transition-all duration-200 ease-out hover:-translate-y-px hover:font-semibold hover:text-[#43ead6] hover:[text-shadow:0_0_12px_rgba(67,234,214,0.88),0_0_24px_rgba(67,234,214,0.5)] focus-visible:-translate-y-px focus-visible:font-semibold focus-visible:text-[#43ead6] focus-visible:outline-none focus-visible:[text-shadow:0_0_12px_rgba(67,234,214,0.88),0_0_24px_rgba(67,234,214,0.5)] after:pointer-events-none after:absolute after:-bottom-1.5 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-[#43ead6] after:opacity-0 after:shadow-[0_0_10px_rgba(67,234,214,0.95),0_0_24px_rgba(67,234,214,0.55)] after:transition-all after:duration-200 hover:after:w-full hover:after:opacity-100 focus-visible:after:w-full focus-visible:after:opacity-100';

const mobileNavLinkClass =
  'relative inline-flex w-fit items-center px-3 py-3 text-sm font-medium text-slate-200 transition-all duration-200 hover:text-[#43ead6] hover:[text-shadow:0_0_12px_rgba(67,234,214,0.88),0_0_24px_rgba(67,234,214,0.45)] focus-visible:text-[#43ead6] focus-visible:outline-none focus-visible:[text-shadow:0_0_12px_rgba(67,234,214,0.88),0_0_24px_rgba(67,234,214,0.45)] after:pointer-events-none after:absolute after:bottom-2 after:left-3 after:h-[2px] after:w-0 after:rounded-full after:bg-[#43ead6] after:opacity-0 after:shadow-[0_0_10px_rgba(67,234,214,0.95),0_0_24px_rgba(67,234,214,0.55)] after:transition-all after:duration-200 hover:after:w-[calc(100%-1.5rem)] hover:after:opacity-100 focus-visible:after:w-[calc(100%-1.5rem)] focus-visible:after:opacity-100';

const HeaderSection = ({ onLogin, onOpenBookDemoModal, onOpenContactInfoModal, isHomePage = true }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const getHomeAnchorHref = (href) => `${LANDING_ROUTES.home}${href}`;

  const handleBookDemo = () => {
    setMobileMenuOpen(false);
    onOpenBookDemoModal?.();
  };

  const handleContact = () => {
    setMobileMenuOpen(false);
    onOpenContactInfoModal?.();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#12213a] bg-[#071224]/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 transition hover:opacity-95">
            <img
              src="/images/vidya-ai-logo-1.png"
              alt="Vidya AI Logo"
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) =>
              item.type === 'page' ? (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.newTab ? '_blank' : undefined}
                  rel={item.newTab ? 'noopener noreferrer' : undefined}
                  className={desktopNavLinkClass}
                >
                  {item.label}
                </Link>
              ) : item.type === 'contact' ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={handleContact}
                  className={desktopNavLinkClass}
                >
                  {item.label}
                </button>
              ) : item.type === 'anchor' && !isHomePage ? (
                <Link key={item.label} href={getHomeAnchorHref(item.href)} className={desktopNavLinkClass}>
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => scrollToSection(item.href.replace('#', ''))}
                  className={desktopNavLinkClass}
                >
                  {item.label}
                </button>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={handleBookDemo}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#43ead6] transition hover:bg-white/5 hover:text-white"
            >
              Book Demo
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-[#43ead6] px-5 py-2 text-sm font-medium text-[#051224] transition hover:bg-[#43ead6]/90"
            >
              Login
            </button>
          </div>

          <button
            className="rounded-full border border-[#1a2943] bg-white/5 p-2 text-white transition hover:bg-white/10 lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#12213a] py-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) =>
                item.type === 'page' ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    target={item.newTab ? '_blank' : undefined}
                    rel={item.newTab ? 'noopener noreferrer' : undefined}
                    className={mobileNavLinkClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : item.type === 'contact' ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={handleContact}
                    className={mobileNavLinkClass}
                  >
                    {item.label}
                  </button>
                ) : item.type === 'anchor' && !isHomePage ? (
                  <Link
                    key={item.label}
                    href={getHomeAnchorHref(item.href)}
                    className={mobileNavLinkClass}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToSection(item.href.replace('#', ''))}
                    className={`${mobileNavLinkClass} text-left`}
                  >
                    {item.label}
                  </button>
                ),
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleBookDemo}
                  className="rounded-full border border-[#1a2943] bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 hover:text-white"
                >
                  Book Demo
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[#43ead6] px-6 py-3 text-sm font-medium text-[#051224] transition hover:bg-[#43ead6]/90"
                >
                  Login
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderSection;
