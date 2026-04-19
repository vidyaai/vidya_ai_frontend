import { X } from 'lucide-react';

import { LEGAL_LAST_UPDATED, legalPages } from './legalPageContent';

const toSectionId = (sectionTitle) =>
  sectionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const modalContentByTitle = {
  'Privacy Policy': legalPages.privacyPolicy,
  'Terms of Use': legalPages.termsOfUse,
  'Cookie Policy': legalPages.cookiePolicy,
};

const LegalInfoModal = ({ open, title, onClose }) => {
  if (!open) {
    return null;
  }

  const content = modalContentByTitle[title];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071224]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="relative mx-auto mt-[4vh] flex max-h-[92vh] w-full max-w-5xl flex-col rounded-[24px] border border-white/10 bg-[#0b1730] shadow-[0_36px_120px_rgba(0,0,0,0.45)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title} modal`}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-white/10 px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#43ead6]">
            Legal
          </p>
          <h3 className="mt-3 pr-10 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {content?.title || title}
          </h3>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Last updated {LEGAL_LAST_UPDATED}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
            {content?.intro ||
              'This policy is being finalized. Please contact the VidyaAI team if you need this information right away.'}
          </p>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {content ? (
            <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
              <aside className="lg:sticky lg:top-0 lg:self-start">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Sections
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    {content.sections.map((section) => (
                      <a
                        key={section.title}
                        href={`#${toSectionId(section.title)}`}
                        className="text-sm leading-6 text-slate-300 transition hover:text-white"
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="space-y-8">
                {content.sections.map((section) => (
                  <section key={section.title} id={toSectionId(section.title)} className="scroll-mt-24">
                    <h4 className="text-xl font-semibold tracking-tight text-white">
                      {section.title}
                    </h4>

                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                        {paragraph}
                      </p>
                    ))}

                    {section.items?.length ? (
                      <ul className="mt-4 space-y-3 pl-5 text-sm leading-7 text-slate-300 sm:text-base">
                        {section.items.map((item) => (
                          <li key={item} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-300 sm:text-base">
              This policy is being finalized. Please contact the VidyaAI team if you need this
              information right away.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalInfoModal;
