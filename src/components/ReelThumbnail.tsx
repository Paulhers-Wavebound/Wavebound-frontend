import React, { useState } from 'react';
import { Play } from 'lucide-react';

interface ReelThumbnailProps {
  src: string;
  className?: string;
}

const ReelThumbnail: React.FC<ReelThumbnailProps> = ({ src, className }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-orange-500/10">
        <Play className="w-12 h-12 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <video
      src={src}
      className={className}
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  );
};

export default ReelThumbnail;
