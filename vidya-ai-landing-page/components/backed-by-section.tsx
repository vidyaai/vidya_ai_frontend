import Image from "next/image"

export function BackedBySection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
          Backed By
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
          <div className="flex items-center justify-center">
            <Image
              src="/images/nvidia.png"
              alt="NVIDIA"
              width={180}
              height={60}
              className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </div>
          <div className="flex items-center justify-center">
            <Image
              src="/images/aws.png"
              alt="AWS"
              width={120}
              height={60}
              className="h-12 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
