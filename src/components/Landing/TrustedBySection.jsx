const universities = [
  { name: 'Trusted institution 1', logo: '/images/t-1.png' },
  { name: 'Trusted institution 2', logo: '/images/t-2.png' },
  { name: 'Trusted institution 3', logo: '/images/t-3.png' },
  { name: 'Trusted institution 4', logo: '/images/t-4.png' },
  { name: 'Trusted institution 5', logo: '/images/t-5.png' },
];

const duplicatedUniversities = [...universities, ...universities];

const TrustedBySection = () => {
  return (
    <section
      id="platform"
      className="overflow-hidden border-y border-[#12213a] bg-[#09162c] py-12 sm:py-14"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">
        <p className="text-center text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-400">
          Trusted by forward-thinking institutions and research ecosystems
        </p>

        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="animate-scroll flex w-max items-center gap-8 sm:gap-12">
            {duplicatedUniversities.map((university, index) => (
              <div
                key={`${university.logo}-${index}`}
                className="flex h-20 w-[9.5rem] flex-shrink-0 items-center justify-center rounded-3xl border border-[#182842] bg-white/[0.03] px-6 sm:h-24 sm:w-[11rem]"
                aria-hidden={index >= universities.length}
              >
                <img
                  src={university.logo}
                  alt={university.name}
                  className="h-10 w-full object-contain sm:h-12"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
