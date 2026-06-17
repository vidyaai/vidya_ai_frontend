'use client'

import { useEffect } from 'react';

// Reports document height to the parent window so the host page's iframe
// (see docs/embed-integration.md) can resize itself to fit content.
export function useEmbedResize() {
  useEffect(() => {
    const send = () => {
      window.parent.postMessage(
        {
          type: 'vidya-resize',
          height: document.body.scrollHeight,
        },
        '*'
      );
    };

    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.body);

    // Belt-and-suspenders for layout changes a ResizeObserver might miss
    // (e.g. font swaps, late-loading images that don't change box size immediately).
    const interval = setInterval(send, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
}
