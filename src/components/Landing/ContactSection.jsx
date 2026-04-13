import { primaryButtonClass, secondaryButtonClass } from './buttonClasses';

const ContactSection = ({ onOpenContactModal, onOpenBookDemoModal }) => {
  return (
    <section id="contact" className="scroll-mt-28 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <div className="rounded-[36px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-12 text-center shadow-[0_28px_80px_rgba(0,0,0,0.22)] sm:px-10">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Ready to Evolve Your Institution?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Join forward-looking universities exploring how the future of teaching,
            collaboration, and academic support can live in one platform.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={onOpenContactModal} className={primaryButtonClass}>
              Bring Vidya AI to Campus
            </button>
            <button
              type="button"
              onClick={onOpenBookDemoModal}
              className={secondaryButtonClass}
            >
              Schedule a Consultation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
