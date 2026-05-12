'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string; // Image source (optional)
  variant?: 'dark' | 'light' | 'mark';
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image
  width?: number;
  height?: number;
  className?: string; // Additional classes
  imageClassName?: string;
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  src,
  variant = 'dark',
  iconName = 'SparklesIcon',
  size = 40,
  width,
  height,
  className = '',
  imageClassName = '',
  onClick,
}: AppLogoProps) {
  const logoSrc = useMemo(() => {
    if (src) return src;
    if (variant === 'light') return '/assets/images/credit-trust-logo-light.svg';
    if (variant === 'mark') return '/assets/images/credit-trust-mark.svg';
    return '/assets/images/credit-trust-logo.svg';
  }, [src, variant]);

  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Show image if src provided, otherwise show icon */}
      {logoSrc ? (
        <AppImage
          src={logoSrc}
          alt="Credit Trust Logo"
          width={width ?? Math.round(size * 3.1)}
          height={height ?? size}
          className={`flex-shrink-0 object-contain ${imageClassName}`}
          priority={true}
          unoptimized={logoSrc.endsWith('.svg')}
        />
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
    </div>
  );
});

export default AppLogo;
