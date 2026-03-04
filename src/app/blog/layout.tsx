'use client'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <nav className="mb-8">
          <a
            href="/blog"
            className="text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Blog
          </a>
        </nav>
        <article className="blog-content">
          <style jsx global>{`
            .blog-content h1 {
              font-size: 2.5rem;
              font-weight: 800;
              color: #111827;
              margin-bottom: 1rem;
              line-height: 1.2;
            }
            .blog-content h2 {
              font-size: 2rem;
              font-weight: 700;
              color: #111827;
              margin-top: 2rem;
              margin-bottom: 1rem;
              line-height: 1.3;
            }
            .blog-content h3 {
              font-size: 1.5rem;
              font-weight: 700;
              color: #111827;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              line-height: 1.4;
            }
            .blog-content h4 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #111827;
              margin-top: 1.25rem;
              margin-bottom: 0.75rem;
              line-height: 1.4;
            }
            .blog-content p {
              font-size: 1.125rem;
              color: #374151;
              margin-bottom: 1.25rem;
              line-height: 1.75;
            }
            .blog-content strong,
            .blog-content b {
              font-weight: 700;
              color: #111827;
            }
            .blog-content a {
              color: #4f46e5;
              text-decoration: underline;
              font-weight: 500;
            }
            .blog-content a:hover {
              color: #4338ca;
            }
            .blog-content ul,
            .blog-content ol {
              margin-bottom: 1.25rem;
              padding-left: 1.5rem;
            }
            .blog-content li {
              font-size: 1.125rem;
              color: #374151;
              margin-bottom: 0.5rem;
              line-height: 1.75;
            }
            .blog-content img {
              border-radius: 0.75rem;
              margin: 2rem 0;
              width: 100%;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            .blog-content hr {
              border-top: 2px solid #e5e7eb;
              margin: 2rem 0;
            }
            .blog-content em {
              color: #6b7280;
              font-style: italic;
            }
            .blog-content blockquote {
              border-left: 4px solid #4f46e5;
              padding-left: 1rem;
              margin: 1.5rem 0;
              color: #4b5563;
              font-style: italic;
            }
            .blog-content code {
              background-color: #f3f4f6;
              padding: 0.125rem 0.375rem;
              border-radius: 0.25rem;
              font-size: 0.875em;
              color: #111827;
            }
          `}</style>
          {children}
        </article>
      </div>
    </div>
  )
}
