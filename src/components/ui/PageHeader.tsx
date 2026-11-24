import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ icon: Icon, iconClassName = 'text-primary', title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Icon aria-hidden="true" className={`w-6 h-6 shrink-0 ${iconClassName}`} />
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}
