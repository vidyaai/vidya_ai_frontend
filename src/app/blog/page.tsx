import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Vidya AI',
  description: 'Educational insights and guides on using AI for teaching and learning',
}

const blogPosts = [
  {
    slug: '24-7-student-support',
    title: 'The 24/7 Student Support Crisis: Why 32.9% of Students Drop Out',
    description: 'Only 28% of learning happens during business hours. Discover why lack of 24/7 support drives dropout rates and how AI-powered assistance achieves 54% better outcomes.',
    date: 'March 2026',
    readTime: '7 min read',
  },
  {
    slug: 'course-management-revolution',
    title: 'Course Management Crisis: Professors Lose 15+ Hours Weekly to Admin Tasks',
    description: 'Discover why professors spend 15+ hours weekly on course administration and how AI-powered course management saves time while improving student outcomes.',
    date: 'March 2026',
    readTime: '6 min read',
  },
  {
    slug: 'assignment-creation-crisis',
    title: 'The Assignment Creation Crisis: How Educators Are Losing 15+ Hours Weekly',
    description: 'Explore how manual assignment creation consumes 15+ hours weekly, driving 53% of educators to burnout. Discover how AI saves 35% time while improving quality.',
    date: 'March 2026',
    readTime: '6 min read',
  },
  {
    slug: 'ai-question-paper-generation',
    title: 'How AI Saves 9+ Hours Per Week on Question Paper Generation',
    description: 'Discover how AI-powered question paper generation is saving educators up to 73% of assessment creation time while maintaining quality and academic rigor.',
    date: 'March 2026',
    readTime: '6 min read',
  },
  {
    slug: 'professors-grading-assistant',
    title: 'How Vidya AI Saves Professors 20+ Hours Per Week on Grading',
    description: 'Discover how educators are reclaiming their time for what matters most—mentoring students and advancing research—while AI handles the grading workload.',
    date: 'December 2024',
    readTime: '5 min read',
  },
  {
    slug: 'students-video-understanding',
    title: 'How Students Are Mastering Complex Topics 3x Faster with Vidya AI',
    description: 'Learn how AI-powered video interaction is transforming passive watching into active learning, helping students truly understand difficult concepts.',
    date: 'December 2024',
    readTime: '5 min read',
  },
]

export default function BlogPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#43ead6]">
        THE BLOG
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        Vidya AI Blog
      </h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
        Insights on AI-powered education for professors and students
      </p>

      <div className="mt-12 space-y-6">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block rounded-[28px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#43ead6]/35 hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-7"
          >
            <div className="mb-4 flex items-center gap-4 text-sm text-slate-400">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="mb-3 text-2xl font-semibold text-white transition-colors group-hover:text-[#43ead6]">
              {post.title}
            </h2>
            <p className="text-slate-300">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
