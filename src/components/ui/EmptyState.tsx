import type { ReactNode } from 'react';
import { SearchX, X, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description?: ReactNode;
  action?: { label: string; onClick: () => void; icon?: ReactNode; variant?: 'primary' | 'secondary' };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  iconClassName = 'bg-gray-100 text-gray-400',
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${iconClassName}`}>
        <Icon aria-hidden="true" className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>}
      </div>
      {action && (
        <Button variant={action.variant ?? 'primary'} icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}

interface NoResultsProps {
  title?: string;
  description?: ReactNode;
  onClear?: () => void;
}

export function NoResults({
  title = 'Nenhum resultado encontrado',
  description = 'Nada corresponde à busca e aos filtros atuais.',
  onClear,
}: NoResultsProps) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={
        onClear
          ? { label: 'Limpar filtros', onClick: onClear, icon: <X className="w-4 h-4" />, variant: 'secondary' }
          : undefined
      }
    />
  );
}
