import { useState, useCallback, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface NFTImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  size?: number; // icon size for placeholder
}

/**
 * NFT image component with:
 * - Placeholder when no src
 * - Error fallback (broken images)
 * - Loading state
 * - Retry on error (up to 2 times with timeout)
 * - Fixed: no flickering, placeholder only on error/loading
 */
export function NFTImage({ src, alt, className = '', size = 32 }: NFTImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    if (src) {
      setHasError(false);
      setRetryCount(0);
      setIsLoading(true);
      setIsLoaded(false);
    }
  }, [src]);

  const handleError = useCallback(() => {
    console.log('[NFTImage] Error loading:', src);
    if (retryCount < 2 && src) {
      // Retry after a delay
      setTimeout(() => {
        console.log('[NFTImage] Retrying...', retryCount + 1);
        setRetryCount(c => c + 1);
        setHasError(false);
        setIsLoading(true);
      }, 2000 * (retryCount + 1));
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [retryCount, src]);

  const handleLoad = useCallback(() => {
    console.log('[NFTImage] Loaded successfully:', src);
    setIsLoading(false);
    setHasError(false);
    setIsLoaded(true);
  }, [src]);

  // Show placeholder if no source or persistent error
  if (!src || (hasError && retryCount >= 2)) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${className}`}>
        <ImageIcon size={size} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder - hidden once image is loaded */}
      {(isLoading || !isLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <ImageIcon size={size} className="text-muted-foreground" />
        </div>
      )}
      <img
        key={retryCount} // force remount on retry
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  );
}
