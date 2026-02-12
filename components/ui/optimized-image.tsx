import { useState, useEffect, useMemo, useRef, memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  showSkeleton?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  /** Target display size for optimization (default: 300) */
  targetSize?: number;
  /** Disable optimization (use original image) */
  disableOptimization?: boolean;
  /** Priority loading - skip intersection observer */
  priority?: boolean;
}

// In-memory cache for loaded images to prevent re-fetching
const imageCache = new Map<string, string>();

/**
 * Optimizes Supabase Storage URLs with image transformations
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
const getOptimizedUrl = (originalUrl: string, targetSize: number, quality: number = 70): string => {
  if (!originalUrl) return originalUrl;
  
  // Only optimize Supabase storage URLs
  const isSupabaseStorage = originalUrl.includes('.supabase.co/storage/v1/object/public/');
  if (!isSupabaseStorage) return originalUrl;
  
  // Convert to render endpoint with transformations
  const optimizedUrl = originalUrl
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  
  // Add transformation parameters
  const separator = optimizedUrl.includes('?') ? '&' : '?';
  return `${optimizedUrl}${separator}width=${targetSize}&quality=${quality}&format=webp`;
};

const OptimizedImageComponent = ({
  src,
  alt = "",
  className,
  containerClassName,
  aspectRatio = "square",
  showSkeleton = true,
  onLoad,
  onError,
  targetSize = 300,
  disableOptimization = false,
  priority = false,
}: OptimizedImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Memoize optimized URL
  const optimizedSrc = useMemo(() => {
    if (disableOptimization || !src) return src;
    return getOptimizedUrl(src, targetSize, 60); // Reduced quality for faster loading
  }, [src, targetSize, disableOptimization]);
  
  // Check if already cached
  const cachedSrc = optimizedSrc ? imageCache.get(optimizedSrc) : null;
  
  const [isLoading, setIsLoading] = useState(!cachedSrc);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(cachedSrc || null);
  const [isInView, setIsInView] = useState(priority || !!cachedSrc);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "300px", // Increased preload distance
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, isInView]);

  // Load image only when in view (and not already cached)
  useEffect(() => {
    if (!isInView || !optimizedSrc || imageSrc) {
      if (!optimizedSrc) setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = imageCache.get(optimizedSrc);
    if (cached) {
      setImageSrc(cached);
      setIsLoading(false);
      onLoad?.();
      return;
    }

    // Preload the image
    const img = new Image();
    img.src = optimizedSrc;

    img.onload = () => {
      imageCache.set(optimizedSrc, optimizedSrc);
      setImageSrc(optimizedSrc);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      // Fallback to original URL if optimization fails
      if (optimizedSrc !== src && src) {
        console.warn('Optimized image failed, falling back to original:', src);
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          imageCache.set(optimizedSrc, src);
          setImageSrc(src);
          setIsLoading(false);
          onLoad?.();
        };
        fallbackImg.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          onError?.();
        };
      } else {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, optimizedSrc, src, onLoad, onError, imageSrc]);

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  }[aspectRatio];

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatioClass,
        containerClassName
      )}
    >
      {/* Skeleton loader */}
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="w-8 h-8 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">Nepodařilo se načíst</span>
          </div>
        </div>
      )}

      {/* Actual image with fade-in effect */}
      {imageSrc && !hasError && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoading ? "opacity-0" : "opacity-100",
            className
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const OptimizedImage = memo(OptimizedImageComponent);
