import { X } from 'lucide-react';

const legalModalCopy = {
  'Privacy Policy':
    'Our privacy policy page is being finalized. If you need this information right away, please contact the Vidya AI team.',
  'Terms of Service':
    'Our terms of service page is being finalized. If you need this information right away, please contact the Vidya AI team.',
  Cookies:
    'Our cookies information page is being finalized. If you need this information right away, please contact the Vidya AI team.',
};

const LegalInfoModal = ({ open, title, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#071224]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
      onClick={onClose}
    >
      <div
        className="relative mx-auto mt-[12vh] w-full max-w-lg rounded-[24px] border border-white/10 bg-[#0b1730] p-5 shadow-[0_36px_120px_rgba(0,0,0,0.45)] sm:rounded-[28px] sm:p-6"
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

        <h3 className="pr-10 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
          {legalModalCopy[title] ||
            'This page is being finalized. Please contact the Vidya AI team if you need this information right away.'}
        </p>
      </div>
    </div>
  );
};

export default LegalInfoModal;
