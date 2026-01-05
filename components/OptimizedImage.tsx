import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  lazy = true,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const getOptimizedSrc = (originalSrc: string) => {
    // If using a CDN like Cloudinary, you can add transformations
    // For local images, you might want to serve different sizes
    if (originalSrc.includes('cloudinary')) {
      return originalSrc.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    }
    return originalSrc;
  };

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className}`}>
        <span className="text-slate-400 text-sm">Image failed to load</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder */}
      {placeholder === 'blur' && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {isInView && (
        <img
          src={getOptimizedSrc(src)}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={lazy ? 'lazy' : 'eager'}
        />
      )}

      {/* Loading spinner */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

// WebP format support detector
export const useWebPSupport = () => {
  const [supportsWebP, setSupportsWebP] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const webpData = canvas.toDataURL('image/webp');
    const supportsWebP = webpData.indexOf('data:image/webp') === 0;
    setSupportsWebP(supportsWebP);
  }, []);

  return supportsWebP;
};

// Picture component with format fallback
export const AdaptiveImage: React.FC<Omit<OptimizedImageProps, 'src'> & { webpSrc?: string; jpgSrc: string }> = ({
  webpSrc,
  jpgSrc,
  ...props
}) => {
  const supportsWebP = useWebPSupport();
  const src = webpSrc && supportsWebP ? webpSrc : jpgSrc;

  return <OptimizedImage {...props} src={src} />;
};
