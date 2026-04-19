export function SectionEyebrow({ children, className = '' }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6] ${className}`}>
      {children}
    </p>
  );
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl ${className}`}>
      {children}
    </h2>
  );
}

export function FeatureCard({ icon: Icon, title, description, className = '' }) {
  return (
    <article
      className={`rounded-[28px] border border-[#182842] bg-white/[0.04] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)] ${className}`}
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#43ead6]/12 text-[#43ead6]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
    </article>
  );
}
