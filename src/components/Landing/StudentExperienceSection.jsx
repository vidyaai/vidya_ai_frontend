import { BookOpen, Bot, GraduationCap, MessageSquare, Sparkles, Users } from 'lucide-react';

import { SectionEyebrow, SectionTitle } from './SectionPrimitives';

const studentPillars = [
  {
    title: '24/7 AI Research Assistant',
    description:
      'Give students a companion for drafting, questioning, and deepening understanding beyond office hours.',
    icon: Bot,
  },
  {
    title: 'Personalized Socratic Tutoring',
    description:
      'Guide each learner with adaptive prompts that encourage reasoning instead of passive answers.',
    icon: GraduationCap,
  },
  {
    title: 'Feedback That Keeps Up',
    description:
      'Return formative feedback faster so students can improve while the material is still fresh.',
    icon: MessageSquare,
  },
];

const StudentExperienceSection = () => {
  return (
    <section id="students" className="border-y border-[#12213a]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <SectionEyebrow>STUDENT EXPERIENCE</SectionEyebrow>
            <div className="mt-4">
              <SectionTitle>Never Study Alone Again</SectionTitle>
            </div>
            <div className="mt-8 space-y-5">
              {studentPillars.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <div key={pillar.title} className="flex gap-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#43ead6]/12 text-[#43ead6]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[28px] border border-[#182842] bg-white/[0.04] p-6 sm:col-span-2">
              <div className="flex items-center gap-3 text-[#43ead6]">
                <Sparkles className="h-5 w-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                  Adaptive coaching
                </p>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">
                Move from static study tools to guided academic dialogue.
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Help students unpack lectures, ask better follow-up questions, and stay engaged with
                course material in a more active learning loop.
              </p>
            </article>

            <article className="rounded-[28px] border border-[#182842] bg-[#0d1a33] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 text-[#43ead6]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">Context-aware help</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Provide course-specific support instead of generic chatbot replies.
              </p>
            </article>

            <article className="rounded-[28px] border border-[#4f6b4a] bg-[linear-gradient(180deg,#b7c98f_0%,#7fa96f_100%)] p-6 text-[#13211b]">
              <div className="flex items-center justify-between">
                <Users className="h-10 w-10" />
                <div className="rounded-full bg-white/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  Always on
                </div>
              </div>
              <p className="mt-20 text-sm font-semibold uppercase tracking-[0.18em]">
                Support beyond office hours
              </p>
              <p className="mt-2 max-w-[14rem] text-sm leading-6">
                Extend access to academic guidance between classes, deadlines, and revision sessions.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentExperienceSection;
