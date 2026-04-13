'use client';

import { useEffect, useState } from 'react';

const SupademoEmbed = ({ src, title }) => {
  const [embedSrc, setEmbedSrc] = useState(null);

  useEffect(() => {
    const separator = src.includes('?') ? '&' : '?';
    setEmbedSrc(`${src}${separator}cache_bust=${Date.now()}`);
  }, [src]);

  return (
    <div className="mt-8 -mx-7 sm:-mx-8">
      <div className="relative w-full aspect-[1.76] max-h-[80vh] overflow-hidden bg-[#223045]">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            loading="lazy"
            title={title}
            allow="clipboard-write"
            frameBorder={0}
            allowFullScreen
            className="absolute inset-0 h-full w-full origin-center transform-gpu scale-x-[1.11] scale-y-[1.02]"
          />
        ) : null}
      </div>
    </div>
  );
};

export default SupademoEmbed;
