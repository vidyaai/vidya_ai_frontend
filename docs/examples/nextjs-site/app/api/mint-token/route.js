import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

// This route runs on YOUR server, so VIDYA_EMBED_SECRET never reaches the
// browser. In a real app, derive `sub`/`name`/`role` from your own
// authenticated session (e.g. `getServerSession()`) instead of trusting a
// query param like this demo does.
export async function GET(request) {
  const secret = process.env.VIDYA_EMBED_SECRET
  const issuer = process.env.VIDYA_EMBED_ISSUER || 'xyz_learn'

  if (!secret) {
    return NextResponse.json(
      { error: 'VIDYA_EMBED_SECRET is not set - copy .env.local.example to .env.local' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') === 'professor' ? 'professor' : 'student'

  const token = jwt.sign(
    {
      sub: 'nextjs-demo-user',
      name: 'Demo User',
      role,
    },
    secret,
    {
      algorithm: 'HS256',
      issuer,
      audience: 'vidyaai-embed',
      expiresIn: '5m',
    }
  )

  return NextResponse.json({ token })
}
