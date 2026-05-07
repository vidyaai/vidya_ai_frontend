import { SectionEyebrow } from './SectionPrimitives';

const metrics = [
  { value: '33+', label: 'Hours Saved Weekly' },
  { value: '92%', label: 'Student Satisfaction' },
  { value: '14x', label: 'Faster Feedback' },
  { value: '0', label: 'Hidden AI Incidents' },
];

const KeyPerformanceMetricsSection = () => {
  return (
    <section className="bg-[#09162c]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6">
        <SectionEyebrow>MEASURABLE PERFORMANCE</SectionEyebrow>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[28px] border border-[#182842] bg-white/[0.04] p-6"
            >
              <p className="text-4xl font-semibold tracking-tight text-[#43ead6]">
                {metric.value}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {metric.label}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyPerformanceMetricsSection;
