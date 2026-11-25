import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  accent: string;
}

interface FeatureCarouselProps {
  items: FeatureItem[];
  autoplayMs?: number;
}

const SWIPE_THRESHOLD = 40;

export const FEATURE_CARD_CLASS =
  'relative text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 overflow-hidden';

export const FeatureCardContent: React.FC<FeatureItem> = ({ icon: Icon, title, description, accent }) => (
  <>
    <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} aria-hidden="true" />
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
      style={{ backgroundColor: `${accent}1A`, color: accent }}
    >
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
    {typeof description === 'string' ? (
      <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    ) : (
      <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</div>
    )}
  </>
);

export const FeatureCarousel: React.FC<FeatureCarouselProps> = ({ items, autoplayMs = 4500 }) => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const count = items.length;

  const go = useCallback((delta: number) => setActive((a) => (a + delta + count) % count), [count]);

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const id = window.setInterval(() => go(1), autoplayMs);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, count, autoplayMs, go]);

  const offsetOf = (i: number) => {
    let d = (i - active + count) % count;
    if (d > count / 2) d -= count;
    return d;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStart.current === null) return;
    const dx = e.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
  };

  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 220, damping: 26, mass: 0.9 };

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Módulos do Hub"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => (pointerStart.current = null)}
        className="relative h-72 sm:h-80 select-none touch-pan-y"
        style={{ perspective: '1200px' }}
      >
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {items.map(({ icon: Icon, title, description, accent }, i) => {
            const d = offsetOf(i);
            const abs = Math.abs(d);
            const visible = abs <= 2;
            const isActive = d === 0;
            return (
              <div
                key={title}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ zIndex: 10 - abs, transformStyle: 'preserve-3d' }}
              >
                <motion.button
                  type="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-hidden={!isActive}
                  aria-label={isActive ? undefined : `Ver ${title}`}
                  onClick={() => !isActive && setActive(i)}
                  onKeyDown={handleKeyDown}
                  initial={false}
                  animate={{
                    x: `${d * 58}%`,
                    z: -abs * 140,
                    rotateY: d * -32,
                    scale: isActive ? 1 : 1 - abs * 0.1,
                    opacity: visible ? 1 - abs * 0.28 : 0,
                  }}
                  whileHover={isActive && !reduceMotion ? { y: -6, rotateX: 4 } : undefined}
                  transition={spring}
                  className={`${FEATURE_CARD_CLASS} w-60 sm:w-72 ${
                    visible ? 'pointer-events-auto' : 'pointer-events-none'
                  } ${isActive ? 'shadow-xl cursor-default' : 'shadow-md cursor-pointer'} outline-none focus-visible:ring-2 focus-visible:ring-primary/50`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <FeatureCardContent icon={Icon} title={title} description={description} accent={accent} />
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Módulo anterior"
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {items.map(({ title, accent }, i) => (
            <button
              key={title}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ir para ${title}`}
              aria-current={i === active ? 'true' : undefined}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === active ? 24 : 8,
                backgroundColor: i === active ? accent : 'var(--color-gray-300)',
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo módulo"
          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <p className="sr-only" aria-live={paused ? 'polite' : 'off'}>
        {`${items[active]?.title}: ${active + 1} de ${count}`}
      </p>
    </div>
  );
};
