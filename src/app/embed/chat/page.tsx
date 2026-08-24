'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import ImprovedYoutubePlayer from '@/components/Chat/ImprovedYouTubePlayer'
import { useEmbedSession } from '@/hooks/useEmbedSession'
import { useEmbedResize } from '@/hooks/useEmbedResize'
import { EmbedLoading, EmbedError } from '@/components/Embed/EmbedStatus'

function EmbedChatContent() {
  useEmbedResize()
  const searchParams = useSearchParams()
  const session = useEmbedSession()
  const [selectedVideo, setSelectedVideo] = useState(null)

  // `v`/`type` in the URL win over whatever the handoff token pre-selected,
  // so a host page can deep-link to a specific video on top of a shared token.
  const videoId = searchParams.get('v') || session.videoId
  const sourceType = searchParams.get('type') || 'youtube'

  useEffect(() => {
    if (session.status !== 'ready') return
    if (!videoId) {
      setSelectedVideo(null)
      return
    }
    setSelectedVideo({
      videoId,
      sourceType,
      source: sourceType === 'youtube'
        ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=https://vidyaai.co&controls=0`
        : '',
      title: '',
      videoUrl: ''
    })
  }, [session.status, videoId, sourceType])

  if (session.status === 'loading') return <EmbedLoading />
  if (session.status === 'error') return <EmbedError message={session.error} />

  return (
    <div className="bg-zinc-950 px-4 py-4">
      <ImprovedYoutubePlayer selectedVideo={selectedVideo} embed />
    </div>
  )
}

export default function EmbedChatRoute() {
  return (
    <Suspense fallback={<EmbedLoading />}>
      <EmbedChatContent />
    </Suspense>
  )
}
