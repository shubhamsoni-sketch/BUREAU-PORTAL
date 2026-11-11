'use client';

import { useEffect } from 'react';
import styles from './page.module.css';

export default function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.querySelector('[data-loan-preview]');
    if (!root || !('IntersectionObserver' in window)) return;
    const targets = root.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(styles.revealed);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });
    targets.forEach((target) => observer.observe(target));
    root.classList.add(styles.motionReady);
    return () => { observer.disconnect(); root.classList.remove(styles.motionReady); };
  }, []);

  return null;
}
