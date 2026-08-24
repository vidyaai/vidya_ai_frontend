/** @type {import('next').NextConfig} */
const nextConfig = {
  // This example lives nested inside vidya_ai_frontend's own yarn workspace;
  // pin the root so Next.js doesn't try to infer it from the parent's lockfile.
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
