'use client'

import { useEffect, useRef, useState } from 'react'

const VIDYA_BASE = process.env.NEXT_PUBLIC_VIDYA_BASE_URL || 'http://localhost:3000'

export default function Home() {
  const [mode, setMode] = useState('demo')
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(null)
  const frameRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setSrc(null)
    setError(null)

    async function load() {
      if (mode === 'demo') {
        setSrc(`${VIDYA_BASE}/embed/chat?demo=true`)
        return
      }
      try {
        const res = await fetch('/api/mint-token')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || `mint-token returned ${res.status}`)
        if (!cancelled) setSrc(`${VIDYA_BASE}/embed/chat?token=${data.token}&v=dQw4w9WgXcQ`)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [mode])

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== VIDYA_BASE) return
      if (e.data?.type === 'vidya-resize' && frameRef.current) {
        frameRef.current.style.height = `${e.data.height}px`
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 16px' }}>
      <h1>Vidya AI &mdash; Next.js Embed Test</h1>
      <p>This page stands in for a third-party Next.js site embedding Vidya AI via an iframe.</p>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('demo')}>Demo mode</button>
        <button onClick={() => setMode('auth')}>Authenticated mode</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {src && (
        <iframe
          ref={frameRef}
          src={src}
          title="Vidya AI"
          style={{ width: '100%', border: 0, height: 600, borderRadius: 8 }}
          allow="microphone; camera; clipboard-write"
        />
      )}
    </main>
  )
}
