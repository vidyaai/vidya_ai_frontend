'use client'

// Loading/error chrome shown inside the iframe while an embed session is
// being exchanged. Deliberately not `fixed inset-0` / `min-h-screen` - the
// parent page sizes the iframe to document.body.scrollHeight (useEmbedResize),
// so this should stay as small as the content it's standing in for.
export function EmbedLoading() {
  return (
    <div className="flex items-center justify-center py-16 bg-[#071224]">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#43ead6] border-t-transparent" />
    </div>
  );
}

export function EmbedError({ message }) {
  return (
    <div className="flex items-center justify-center py-16 px-6 bg-[#071224]">
      <div className="max-w-md text-center text-slate-300 bg-[#0d1f38] border border-red-900/60 rounded-lg px-6 py-5">
        <p className="text-red-400 font-medium mb-1">Could not load Vidya AI</p>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}
