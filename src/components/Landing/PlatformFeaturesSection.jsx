import { BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react';

import { FeatureCard, SectionEyebrow, SectionTitle } from './SectionPrimitives';

const scholarshipFeatures = [
  {
    title: 'Automated Grading',
    description:
      'Streamline repetitive evaluation work so faculty can focus on richer student guidance.',
    icon: CheckCircle2,
  },
  {
    title: 'Curriculum Analytics',
    description:
      'Surface course-level learning patterns and reveal where students need stronger support.',
    icon: BarChart3,
  },
  {
    title: 'Integrity Guard',
    description:
      'Layer review tools and transparent AI workflows into the academic process from day one.',
    icon: ShieldCheck,
  },
];

const PlatformFeaturesSection = () => {
  return (
    <section id="product" className="bg-[#101c35]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
        <SectionEyebrow>PLATFORM FEATURES</SectionEyebrow>
        <div className="mt-4">
          <SectionTitle>Redefining Scholarship Efficiency</SectionTitle>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {scholarshipFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformFeaturesSection;
