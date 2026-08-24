import { useState } from 'react'
import VidyaEmbed from './VidyaEmbed.jsx'

export default function App() {
  const [mode, setMode] = useState('demo')

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 16px' }}>
      <h1>Vidya AI &mdash; React Embed Test</h1>
      <p>This page stands in for a third-party React site embedding Vidya AI via an iframe.</p>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setMode('demo')}>Demo mode</button>
        <button onClick={() => setMode('auth')}>Authenticated mode</button>
      </div>
      {mode === 'demo' ? <VidyaEmbed demo /> : <VidyaEmbed query="v=dQw4w9WgXcQ" />}
    </div>
  )
}
