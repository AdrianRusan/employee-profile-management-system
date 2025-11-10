'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';

interface FadeInProps {
  children: ReactNode;
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Animation duration (in seconds) */
  duration?: number;
  /** Direction to slide from */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Additional class name */
  className?: string;
}

/**
 * Hook to detect if user prefers reduced motion
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Initialize from media query on mount (only runs once)
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * FadeIn animation wrapper component
 * Respects prefers-reduced-motion preference for accessibility
 *
 * @example
 * <FadeIn direction="up">
 *   <Card>Content</Card>
 * </FadeIn>
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  direction = 'none',
  className,
}: FadeInProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // If user prefers reduced motion, start visible
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    // Don't set timeout if reduced motion is preferred or already visible
    if (prefersReducedMotion || isVisible) {
      return;
    }

    const id = window.setTimeout(() => setIsVisible(true), Math.max(0, delay * 1000));
    return () => window.clearTimeout(id);
  }, [delay, prefersReducedMotion, isVisible]);

  // Update visibility when reduced motion preference changes
  useEffect(() => {
    if (prefersReducedMotion && !isVisible) {
      // Use queueMicrotask to defer the setState to avoid cascading renders
      queueMicrotask(() => setIsVisible(true));
    }
  }, [prefersReducedMotion, isVisible]);

  const initialTransform = useMemo(() => {
    switch (direction) {
      case 'up':
        return 'translate3d(0, 20px, 0)';
      case 'down':
        return 'translate3d(0, -20px, 0)';
      case 'left':
        return 'translate3d(20px, 0, 0)';
      case 'right':
        return 'translate3d(-20px, 0, 0)';
      case 'none':
      default:
        return 'translate3d(0, 0, 0)';
    }
  }, [direction]);

  const easing = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

  // If reduced motion is preferred or content is visible, show without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : initialTransform,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}s`,
        transitionTimingFunction: easing,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
