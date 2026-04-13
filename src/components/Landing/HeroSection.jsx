import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { LANDING_ROUTES } from './landingCtas';
import { primaryButtonClass, secondaryButtonClass } from './buttonClasses';

const HeroSection = ({ onLogin }) => {
  return (
    <section id="hero" className="relative scroll-mt-28 overflow-hidden bg-[#071224]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(67,234,214,0.16),transparent_48%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-[10rem] h-[20rem] w-[20rem] rounded-full bg-[#43ead6]/10 blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-[#43ead6]/20 bg-[#43ead6]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#43ead6]">
            AI Tutoring Reinvented
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[4.25rem]">
            Empowering the
            <span className="block text-[#43ead6]">Next Generation</span>
            of Higher Education
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Vidya AI brings academic rigor into a collaborative AI workspace designed for
            professors, institutions, and the students they serve.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onLogin} className={primaryButtonClass}>
              Try For Free
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              href={LANDING_ROUTES.samplePapers}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButtonClass}
            >
              Sample Papers
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[36px] bg-[#43ead6]/12 blur-2xl" />
          <div className="relative overflow-hidden rounded-[36px] border border-white/12 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
            <img
              src="/images/vidya-ai-hero-preview.gif"
              alt="Vidya AI hero product preview"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
