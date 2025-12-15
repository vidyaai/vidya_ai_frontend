import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-gray-300 mb-6 mt-8">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold text-gray-200 mb-4 mt-6">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-medium text-gray-300 mb-3 mt-5">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-400 mb-4 leading-relaxed text-lg">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside text-gray-400 mb-4 space-y-2 ml-4">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside text-gray-400 mb-4 space-y-2 ml-4">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-gray-400">{children}</li>
    ),
    a: ({ href, children }) => (
      <a href={href} className="text-cyan-500 hover:text-cyan-400 underline transition-colors">
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-cyan-600 pl-4 italic text-gray-500 my-4">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-200">{children}</strong>
    ),
    ...components,
  }
}
