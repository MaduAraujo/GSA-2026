import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const TONES = {
  primary: { circle: 'bg-primary/10', icon: 'text-primary' },
  warning: { circle: 'bg-warning-600/10', icon: 'text-warning-600' },
} as const;

interface PageIntroProps {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  headingId: string;
  title: string;
  tagline?: string;
  description?: ReactNode;
}

export function PageIntro({ icon: Icon, tone = 'primary', headingId, title, tagline, description }: PageIntroProps) {
  const colors = TONES[tone];
  return (
    <div className="text-center">
      <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${colors.circle}`}>
        <Icon aria-hidden="true" className={`h-7 w-7 ${colors.icon}`} />
      </div>
      <h1 id={headingId} className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      {tagline && <p className="mt-3 text-lg font-semibold text-primary">{tagline}</p>}
      {description && <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>}
    </div>
  );
}
