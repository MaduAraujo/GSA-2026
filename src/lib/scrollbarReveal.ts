const VISIBLE_CLASS = 'is-scrolling';
const HIDE_DELAY_MS = 900;

const timers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

function handleScroll(event: Event) {
  const target = event.target;
  if (!(target instanceof Element) || !target.classList.contains('scrollbar-reveal')) return;
  target.classList.add(VISIBLE_CLASS);
  const pending = timers.get(target);
  if (pending) clearTimeout(pending);
  timers.set(
    target,
    setTimeout(() => {
      target.classList.remove(VISIBLE_CLASS);
      timers.delete(target);
    }, HIDE_DELAY_MS),
  );
}

export function installScrollbarReveal(root: Document = document): () => void {
  root.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  return () => root.removeEventListener('scroll', handleScroll, { capture: true });
}
