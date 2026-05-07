import {
  AlarmClock,
  AlertCircle,
  ArrowRight,
  Clock3,
  FileClock,
  GraduationCap,
  ShieldAlert,
  Users,
} from 'lucide-react';

import { LANDING_ROUTES, openInSameTab } from './landingCtas';
import { primaryButtonClass } from './buttonClasses';

const studentItems = [
  {
    title: 'Only 3 hours of support per week',
    description:
      'Most students rely on limited office hours from professors and TAs, leaving little time for one-on-one help.',
    icon: Clock3,
  },
  {
    title: 'Days to clear simple doubts',
    description:
      'Students often wait too long for answers to academic questions, slowing down learning and reducing confidence.',
    icon: AlertCircle,
  },
  {
    title: '45% submit close to deadlines',
    description:
      'When feedback and support are delayed, students fall behind and end up rushing assignments at the last minute.',
    icon: FileClock,
  },
];

const professorItems = [
  {
    title: '33 hours per week spent grading',
    description:
      'Professors and teaching assistants spend a huge amount of time on assessments instead of teaching, mentoring, and research.',
    icon: AlarmClock,
  },
  {
    title: 'Subjective and uneven evaluation',
    description:
      'Manual grading can lead to inconsistency, bias, and variation across assignments, students, and evaluators.',
    icon: ShieldAlert,
  },
  {
    title: 'Delayed outcomes for students',
    description:
      'When instructors and TAs are overloaded, feedback slows down, learning suffers, and student progress can be affected.',
    icon: Users,
  },
];

function ProblemList({ items, accentClass, edgeClass }) {
  return (
    <div className="mt-8 space-y-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            className="group relative overflow-hidden rounded-[24px] border border-[#182842] bg-[#08172d]/90 p-5 transition duration-200 hover:border-[#223556] hover:bg-[#0b1c35]"
          >
            <div
              className={`absolute inset-y-0 left-0 w-1 rounded-full opacity-50 transition group-hover:opacity-100 ${edgeClass}`}
            />
            <div className="flex gap-4">
              <div
                className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#182842] ${accentClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white sm:text-lg">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProblemActionButton({ label, className = '' }) {
  return (
    <div className={`mt-6 flex ${className}`}>
      <button
        type="button"
        onClick={() => openInSameTab(LANDING_ROUTES.setUserType)}
        className={primaryButtonClass}
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProblemPanel({
  label,
  title,
  headerIcon: HeaderIcon,
  items,
  accentClass,
  edgeClass,
  glowClass,
  mediaSrc,
  mediaAlt,
  mediaPosition = 'right',
  buttonLabel,
}) {
  const media = mediaSrc ? (
    <div className="relative overflow-hidden rounded-[30px] border border-[#182842] bg-[#071224]/80 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="relative overflow-hidden rounded-[22px]">
        <img src={mediaSrc} alt={mediaAlt || title} className="h-full w-full object-cover" />
      </div>
    </div>
  ) : null;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
      <div className={`pointer-events-none absolute h-44 w-44 rounded-full blur-3xl ${glowClass}`} />
      <div
        className={`relative grid gap-8 ${
          mediaSrc ? 'lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch' : ''
        }`}
      >
        {mediaSrc && mediaPosition === 'left' ? media : null}

        <div className={mediaSrc && mediaPosition === 'left' ? 'lg:order-2' : ''}>
          <div
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 ${accentClass}`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentClass}`}>
              <HeaderIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]">{label}</p>
              <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
            </div>
          </div>

          <ProblemList items={items} accentClass={accentClass} edgeClass={edgeClass} />

          {buttonLabel ? (
            mediaPosition === 'right' ? (
              <ProblemActionButton label={buttonLabel} className="hidden lg:flex" />
            ) : (
              <ProblemActionButton label={buttonLabel} />
            )
          ) : null}
        </div>

        {mediaSrc && mediaPosition === 'right' ? media : null}

        {buttonLabel && mediaPosition === 'right' ? (
          <ProblemActionButton label={buttonLabel} className="lg:hidden" />
        ) : null}
      </div>
    </section>
  );
}

const ProblemSection = () => {
  return (
    <section id="problem" className="scroll-mt-28 border-b border-[#12213a] bg-[#0b1730]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6]">
            THE PROBLEM
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Education is broken for everyone
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-lg">
            Students struggle to get timely academic support, while professors and teaching
            assistants are overwhelmed by grading and repetitive academic tasks. The result is a
            broken learning experience on both sides of higher education.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          <ProblemPanel
            label="FOR PROFESSORS"
            title="Grading Overload for Professors"
            headerIcon={Users}
            items={professorItems}
            accentClass="border-[#4bc2ff]/15 bg-[#4bc2ff]/10 text-[#7ed4ff]"
            edgeClass="bg-gradient-to-b from-transparent via-[#4bc2ff] to-transparent"
            glowClass="-left-12 top-8 bg-[#4bc2ff]/10"
            mediaSrc="/images/problem-professor-preview.gif"
            mediaAlt="Professor-side grading overload problem preview"
            mediaPosition="left"
            buttonLabel="Generate Assignment"
          />

          <ProblemPanel
            label="FOR STUDENTS"
            title="Limited Student Support"
            headerIcon={GraduationCap}
            items={studentItems}
            accentClass="border-[#43ead6]/15 bg-[#43ead6]/10 text-[#43ead6]"
            edgeClass="bg-gradient-to-b from-transparent via-[#43ead6] to-transparent"
            glowClass="-right-14 top-0 bg-[#43ead6]/10"
            mediaSrc="/images/problem-student-preview.gif"
            mediaAlt="Student-side academic support problem preview"
            mediaPosition="right"
            buttonLabel="Upload Lecture"
          />
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
