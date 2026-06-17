import { useEffect, useRef, useState } from 'react'

// Origin of YOUR running Vidya AI frontend (https://vidyaai.co in production).
const VIDYA_BASE = 'http://localhost:3000'

// Stand-in for YOUR backend's token-minting endpoint - see ../mint-server.js.
// A real customer backend mints this after checking its own login session.
const MINT_SERVER = 'http://localhost:4001/mint-token?sub=react-demo-user'

export default function VidyaEmbed({ path = '/embed/chat', demo = false, query = '' }) {
  const frameRef = useRef(null)
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setSrc(null)
    setError(null)

    async function load() {
      if (demo) {
        setSrc(`${VIDYA_BASE}${path}?demo=true${query ? '&' + query : ''}`)
        return
      }
      try {
        const res = await fetch(MINT_SERVER)
        if (!res.ok) throw new Error(`mint-server returned ${res.status}`)
        const { token } = await res.json()
        if (!cancelled) setSrc(`${VIDYA_BASE}${path}?token=${token}${query ? '&' + query : ''}`)
      } catch (err) {
        if (!cancelled) setError(`${err.message}. Is mint-server.js running on port 4001?`)
      }
    }

    load()
    return () => { cancelled = true }
  }, [path, demo, query])

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== VIDYA_BASE) return
      if (e.data && e.data.type === 'vidya-resize' && frameRef.current) {
        frameRef.current.style.height = `${e.data.height}px`
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (error) return <div style={{ color: 'crimson' }}>{error}</div>
  if (!src) return <div>Loading Vidya AI...</div>

  return (
    <iframe
      ref={frameRef}
      src={src}
      title="Vidya AI"
      style={{ width: '100%', border: 0, height: 600, borderRadius: 8 }}
      allow="microphone; camera; clipboard-write"
    />
  )
}
