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
 * FadeIn animation wrapper component
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setIsVisible(true), Math.max(0, delay * 1000));
    return () => window.clearTimeout(id);
  }, [delay]);

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
