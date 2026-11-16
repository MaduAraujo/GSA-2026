import { useEffect } from 'react';

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    const targets = [document.body, document.getElementById('app-scroll')].filter((el): el is HTMLElement => !!el);
    const previous = targets.map((el) => el.style.overflow);
    targets.forEach((el) => (el.style.overflow = 'hidden'));
    return () => targets.forEach((el, i) => (el.style.overflow = previous[i] ?? ''));
  }, [active]);
}
