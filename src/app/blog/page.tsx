import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Vidya AI',
  description: 'Educational insights and guides on using AI for teaching and learning',
}

const blogPosts = [
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
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Vidya AI Blog</h1>
      <p className="text-gray-600 text-lg mb-12">
        Insights on AI-powered education for professors and students
      </p>

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-all hover:shadow-xl hover:shadow-indigo-500/10"
          >
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3 hover:text-indigo-600 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-600">{post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
