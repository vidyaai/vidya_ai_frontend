'use client'

import { usePathname } from 'next/navigation'

import MarketingPageShell from '@/components/Landing/MarketingPageShell'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isBlogIndex = pathname === '/blog'

  return (
    <MarketingPageShell>
      {isBlogIndex ? (
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6">
          {children}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-6">
          <nav className="mb-8">
            <a
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#43ead6] transition hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to Blog
            </a>
          </nav>
          <article className="blog-content rounded-[32px] border border-[#182842] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-10">
            <style jsx global>{`
              .blog-content h1 {
                font-size: 2.5rem;
                font-weight: 800;
                color: #ffffff;
                margin-bottom: 1rem;
                line-height: 1.15;
              }
              .blog-content h2 {
                font-size: 2rem;
                font-weight: 700;
                color: #ffffff;
                margin-top: 2.2rem;
                margin-bottom: 1rem;
                line-height: 1.25;
              }
              .blog-content h3 {
                font-size: 1.5rem;
                font-weight: 700;
                color: #f8fafc;
                margin-top: 1.75rem;
                margin-bottom: 0.75rem;
                line-height: 1.35;
              }
              .blog-content h4 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #f8fafc;
                margin-top: 1.25rem;
                margin-bottom: 0.75rem;
                line-height: 1.4;
              }
              .blog-content p {
                font-size: 1.125rem;
                color: #cbd5e1;
                margin-bottom: 1.25rem;
                line-height: 1.75;
              }
              .blog-content strong,
              .blog-content b {
                font-weight: 700;
                color: #ffffff;
              }
              .blog-content a {
                color: #43ead6;
                text-decoration: underline;
                font-weight: 500;
              }
              .blog-content a:hover {
                color: #8af2e3;
              }
              .blog-content ul,
              .blog-content ol {
                margin-bottom: 1.25rem;
                padding-left: 1.5rem;
              }
              .blog-content li {
                font-size: 1.125rem;
                color: #cbd5e1;
                margin-bottom: 0.5rem;
                line-height: 1.75;
              }
              .blog-content img {
                border-radius: 1rem;
                margin: 2rem 0;
                width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
              }
              .blog-content hr {
                border-top: 1px solid rgba(255, 255, 255, 0.12);
                margin: 2rem 0;
              }
              .blog-content em {
                color: #94a3b8;
                font-style: italic;
              }
              .blog-content blockquote {
                border-left: 4px solid #43ead6;
                padding: 0.25rem 0 0.25rem 1rem;
                margin: 1.75rem 0;
                color: #cbd5e1;
                font-style: italic;
                background: rgba(67, 234, 214, 0.05);
                border-radius: 0 0.75rem 0.75rem 0;
              }
              .blog-content code {
                background-color: rgba(255, 255, 255, 0.08);
                padding: 0.125rem 0.375rem;
                border-radius: 0.375rem;
                font-size: 0.875em;
                color: #f8fafc;
              }
            `}</style>
            {children}
          </article>
        </div>
      )}
    </MarketingPageShell>
  )
}
