import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const MAX_TILT = 7;
const FIT_MARGIN = 32;
const MIN_FIT_SCALE = 0.5;
const IDLE_AMPLITUDE = 0.35;

export const AUTH_INPUT_CLASS =
  'w-full h-12 rounded-xl text-base sm:text-[15px] border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-inner transition-shadow focus:bg-white dark:focus:bg-gray-800 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus:border-primary';

export const AUTH_PRIMARY_BUTTON_CLASS =
  'w-full h-12 rounded-xl bg-primary hover:bg-primary-700 text-white text-base font-bold shadow-[0_4px_0_0_var(--color-primary-800)] hover:shadow-[0_2px_0_0_var(--color-primary-800)] hover:translate-y-0.5 active:shadow-none active:translate-y-1 transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2';

export const AuthAlert: React.FC<{ tone: 'error' | 'success'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 text-left border ${
      tone === 'error'
        ? 'bg-danger-50 dark:bg-danger/10 border-danger/30 dark:border-danger/20 text-danger-700 dark:text-danger-300'
        : 'bg-success/10 border-success/20 text-success-700 dark:text-success-300'
    }`}
  >
    {tone === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
    <span>{children}</span>
  </div>
);

export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springCfg = { stiffness: 160, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), springCfg);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), springCfg);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgba(255,255,255,0.35), transparent 60%)`;
  const glareOpacity = useMotionValue(0);

  const [isTouch] = useState(
    () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(hover: none)').matches),
  );
  const idlePaused = useRef(false);

  useEffect(() => {
    if (reduceMotion || !isTouch) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (!idlePaused.current) {
        const t = (now - start) / 1000;
        px.set(0.5 + IDLE_AMPLITUDE * Math.sin(t * 0.9));
        py.set(0.5 + IDLE_AMPLITUDE * 0.8 * Math.cos(t * 0.7));
        glareOpacity.set(0.7);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, isTouch, px, py, glareOpacity]);

  const resetTilt = () => {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    if (e.pointerType !== 'mouse') {
      if (e.buttons === 0) return;
      idlePaused.current = true;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
    glareOpacity.set(1);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') {
      if (!(e.currentTarget.contains(document.activeElement) && document.activeElement?.tagName === 'INPUT')) {
        idlePaused.current = false;
      }
      return;
    }
    resetTilt();
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!isTouch || e.target.tagName !== 'INPUT') return;
    idlePaused.current = true;
    resetTilt();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!isTouch) return;
    const next = e.relatedTarget as HTMLElement | null;
    if (next && e.currentTarget.contains(next) && next.tagName === 'INPUT') return;
    idlePaused.current = false;
  };

  const fitRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const viewport = { width: 0, height: 0 };
    const update = () => {
      const { innerWidth, innerHeight } = window;
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (!typing || innerWidth !== viewport.width || innerHeight > viewport.height) {
        viewport.width = innerWidth;
        viewport.height = innerHeight;
      }
      const height = el.offsetHeight;
      const available = viewport.height - FIT_MARGIN;
      const scale = height > available && height > 0 ? Math.max(available / height, MIN_FIT_SCALE) : 1;
      setFit((prev) => (prev.scale === scale && prev.height === height ? prev : { scale, height }));
    };
    update();
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(el);
    return () => {
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-950 font-sans overflow-x-hidden">
      <main className="min-h-dvh flex items-center justify-center px-4 py-2">
        <div className="w-full max-w-md" style={fit.scale < 1 ? { height: fit.height * fit.scale } : undefined}>
          <div
            ref={fitRef}
            style={fit.scale < 1 ? { transform: `scale(${fit.scale})`, transformOrigin: 'top center' } : undefined}
          >
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 24, rotateX: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative w-full max-w-md"
              style={{ perspective: '1400px' }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-10 -top-10 h-40 rounded-full bg-primary/15 blur-3xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-y-5 scale-[0.9] rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 shadow-md -rotate-3"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-y-2.5 scale-[0.95] rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-md rotate-2"
              />

              <motion.div
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={reduceMotion ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 grid grid-cols-4 rounded-t-2xl overflow-hidden"
                >
                  <div className="bg-primary" />
                  <div className="bg-danger" />
                  <div className="bg-warning" />
                  <div className="bg-success" />
                </div>

                <div aria-hidden="true" className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute inset-0 mix-blend-soft-light transition-opacity duration-300"
                    style={{ background: glare, opacity: glareOpacity }}
                  />
                </div>

                <div className="relative p-6 sm:p-8 space-y-5" style={{ transformStyle: 'preserve-3d' }}>
                  {children}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};
