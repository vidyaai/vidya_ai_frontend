import { useEffect } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';

import { primaryButtonClass } from './buttonClasses';
import { LANDING_EXTERNAL_URLS, openInNewTab } from './landingCtas';

const ContactInfoModal = ({ open, onClose }) => {
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

  const handleMessageUs = () => {
    openInNewTab(LANDING_EXTERNAL_URLS.whatsapp);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#071224]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="relative mx-auto my-auto w-full max-w-[24rem] rounded-[24px] border border-white/10 bg-[#0b1730] p-5 shadow-[0_36px_120px_rgba(0,0,0,0.45)] sm:max-w-[30rem] sm:rounded-[28px] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contact modal"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white sm:right-4 sm:top-4 sm:h-9 sm:w-9"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="pr-8 sm:pr-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#43ead6]/20 bg-[#43ead6]/10 text-[#43ead6] shadow-[0_0_24px_rgba(67,234,214,0.18)]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Contact Us
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Chat directly with our founding team on Whatsapp or drop a text at
            {' '}
            <span className="font-medium text-white">+1-469-237-9220</span>.
          </p>
        </div>

        <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 sm:mt-7 sm:p-5">
          <div className="flex items-center gap-3 text-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#43ead6]">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Founding Team</p>
              <p className="text-sm text-slate-400">Available on WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-7">
          <button
            type="button"
            onClick={handleMessageUs}
            className={`${primaryButtonClass} w-full`}
          >
            Message us
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoModal;
