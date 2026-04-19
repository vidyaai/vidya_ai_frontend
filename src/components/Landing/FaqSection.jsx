import { ChevronDown } from 'lucide-react';

import { SectionEyebrow } from './SectionPrimitives';

const faqs = [
  {
    question: 'Does Vidya AI replace professors?',
    answer:
      'No. The platform is designed to support teaching teams, not replace them. It helps with routine work, structured guidance, and faster feedback while educators stay in control.',
    open: true,
  },
  {
    question: 'How do you handle hallucinations?',
    answer:
      'We design around grounded academic workflows, human review, and institution-specific guardrails.',
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="scroll-mt-28 border-y border-[#12213a]">
      <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6">
        <SectionEyebrow>FREQUENTLY ASKED QUESTIONS</SectionEyebrow>

        <div className="mt-8 space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              open={item.open}
              className="group rounded-[24px] border border-[#182842] bg-white/[0.04] px-5 py-4"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-white sm:text-base">
                <span>{item.question}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-300 transition group-open:rotate-180">
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>
              <p className="pt-4 text-sm leading-7 text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
