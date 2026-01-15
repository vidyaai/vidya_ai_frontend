import Image from "next/image"

export function TrustedBySection() {
  const universities = [
    { name: "UT Dallas", url: "https://www.utdallas.edu/", logo: "/images/utd.png" },
    { name: "UHCL", url: "https://www.uhcl.edu/", logo: "/images/uhcl.png" },
    { name: "SJSU", url: "https://www.sjsu.edu/", logo: "/images/sjsu.png" },
    { name: "Troy University", url: "https://www.troy.edu/", logo: "/images/troy.jpg" },
    { name: "Santa Clara University", url: "https://www.scu.edu/", logo: "/images/scu.png" },
  ]

  const duplicatedUniversities = [...universities, ...universities, ...universities]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
          Trusted By Professors from:
        </h2>

        <div className="relative">
          <div className="flex gap-12 animate-scroll items-center">
            {duplicatedUniversities.map((university, index) => (
              <a
                key={index}
                href={university.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <Image
                  src={university.logo}
                  alt={university.name}
                  width={120}
                  height={60}
                  className="h-12 w-auto object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
