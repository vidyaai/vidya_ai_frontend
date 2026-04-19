'use client';

import { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';

import { LANDING_EXTERNAL_URLS } from './landingCtas';

const BookDemoModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071224]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1730] shadow-[0_36px_120px_rgba(0,0,0,0.45)] sm:h-[min(86dvh,820px)] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Book Demo
            </h3>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Schedule a time with the Vidya AI team.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={LANDING_EXTERNAL_URLS.googleCalendar}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white sm:text-sm"
            >
              Open in New Tab
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close book demo modal"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-[#071224]">
          <iframe
            src={LANDING_EXTERNAL_URLS.googleCalendar}
            title="Book a demo with Vidya AI"
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default BookDemoModal;
