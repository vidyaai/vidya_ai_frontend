import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, MessageSquare, User, X } from 'lucide-react';

const FieldLabel = ({ children }) => {
  return (
    <label className="block pl-1 text-sm font-semibold leading-none text-white sm:text-base">
      {children}
    </label>
  );
};

const ContactSalesModal = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const resetForm = () => {
    setFormData({ name: '', email: '', message: '' });
    setSending(false);
    setSubmitStatus(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setSubmitStatus(null);

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_3qtt4eu';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_xgigp3g';
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '15XEZx-YXn86POgyR';

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        { publicKey },
      );

      setSubmitStatus('success');
      window.setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitStatus('error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        resetForm();
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#071224]/82 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4"
      onClick={handleClose}
    >
      <div
        className="relative mx-auto my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-[24rem] overflow-y-auto rounded-[24px] border border-white/10 bg-[#0b1730] p-4 shadow-[0_36px_120px_rgba(0,0,0,0.45)] sm:max-w-lg sm:rounded-[28px] sm:p-5 lg:max-w-xl lg:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close contact sales modal"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white sm:right-4 sm:top-4 sm:h-9 sm:w-9"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="max-w-xl pr-8 sm:pr-10">
          <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Contact Sales
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            Get in touch with our team to learn more about Vidya AI
          </p>
        </div>

        {submitStatus === 'success' && (
          <div
            className="mt-5 rounded-[18px] border border-[#43ead6]/30 bg-[#43ead6]/10 px-4 py-3 text-sm text-[#8af2e3] sm:mt-6"
            aria-live="polite"
          >
            Message sent successfully. We&apos;ll get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div
            className="mt-5 rounded-[18px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:mt-6"
            aria-live="polite"
          >
            We couldn&apos;t send your message right now. Please try again in a moment.
          </div>
        )}

        <form className="mt-6 space-y-4 sm:mt-7 sm:space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <FieldLabel>Name *</FieldLabel>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-5 sm:h-5 sm:w-5" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                className="h-12 w-full rounded-[16px] border border-white/10 bg-[#0f1d39] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#43ead6]/50 sm:h-14 sm:rounded-[18px] sm:pl-12 sm:pr-5 sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Email *</FieldLabel>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:left-5 sm:h-5 sm:w-5" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="h-12 w-full rounded-[16px] border border-white/10 bg-[#0f1d39] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#43ead6]/50 sm:h-14 sm:rounded-[18px] sm:pl-12 sm:pr-5 sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>Message *</FieldLabel>
            <div className="relative">
              <MessageSquare className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400 sm:left-5 sm:top-5 sm:h-5 sm:w-5" />
              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us about your needs..."
                rows={4}
                className="min-h-28 w-full resize-y rounded-[16px] border border-white/10 bg-[#0f1d39] pl-11 pr-4 pt-3.5 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#43ead6]/50 sm:min-h-32 sm:rounded-[18px] sm:pl-12 sm:pr-5 sm:pt-4 sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={sending}
              className="h-11 rounded-[14px] border border-white/10 bg-white/5 px-4 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white sm:min-w-32 sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-transparent bg-[#43ead6] px-4 py-3 text-sm font-medium text-[#051224] transition hover:bg-[#43ead6]/90 sm:min-w-40 sm:w-auto sm:text-base"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactSalesModal;
