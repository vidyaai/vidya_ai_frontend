import { CheckCircle2 } from 'lucide-react';

import { LANDING_ROUTES, openInSameTab } from './landingCtas';
import SupademoEmbed from './SupademoEmbed';
import { primaryButtonClass } from './buttonClasses';

const solutionItems = [
  'Socratic learning flows that encourage student reasoning',
  'Institution-aware workflows shaped around rubrics and review',
  'A single platform for support, oversight, and scale',
];

const SolutionSection = () => {
  return (
    <section id="solution" className="scroll-mt-28 border-b border-[#101b2d]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
        <div className="rounded-[32px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-7 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6]">
            THE SOLUTION
          </p>
          <h3 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            VIDYA AI is an AI built specifically for STEM education. Check out an interactive demo
            below.
          </h3>

          <SupademoEmbed
            src="https://app.supademo.com/embed/cmnr4w1sz0u77cr4j09d0svlw?embed_v=2&utm_source=embed"
            title="Create AI-Powered Assignments with VidyaAI"
          />

          <p className="mt-8 text-sm leading-7 text-slate-300 sm:text-base">
            Vidya AI combines tutoring, assessment support, curriculum insight, and structured
            governance into one campus-ready experience.
          </p>

          <div className="mt-8 grid gap-4">
            {solutionItems.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[#182842] bg-[#0d1a33] p-4"
              >
                <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#43ead6]/15 text-[#43ead6]">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => openInSameTab(LANDING_ROUTES.login)}
              className={`${primaryButtonClass} w-full sm:w-auto`}
            >
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
