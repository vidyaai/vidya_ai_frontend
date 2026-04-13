import { SectionEyebrow } from './SectionPrimitives';

const testimonials = [
  {
    quote:
      'Vidya AI helped us move from scattered experimentation to a structured campus-wide teaching strategy.',
    name: 'Dr. J Saharia',
    role: 'Dean of Learning Innovation',
  },
  {
    quote:
      'The platform gave our faculty a way to scale feedback without sacrificing academic rigor or trust.',
    name: 'Dr. D Bhatia',
    role: 'Director of Academic Technology',
  },
  {
    quote:
      'Students responded to the coaching format immediately. The experience felt supportive, not automated.',
    name: 'Dr. P Joshi',
    role: 'Student Success Lead',
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-[#1f2d46]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
        <SectionEyebrow>TESTIMONIALS</SectionEyebrow>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="rounded-[28px] border border-[#182842] bg-[#13213a] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
            >
              <p className="text-sm leading-7 text-slate-200">“{item.quote}”</p>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#43ead6]/15 font-semibold text-[#43ead6]">
                  {item.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
