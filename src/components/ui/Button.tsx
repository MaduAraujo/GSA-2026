import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonClasses, type ButtonClassOptions } from './buttonClasses';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<ButtonClassOptions, 'iconOnly'> {
  icon?: ReactNode;
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant,
  size,
  collapseLabel,
  className,
  icon,
  loading = false,
  disabled,
  type = 'button',
  children,
  ref,
  ...rest
}: ButtonProps) {
  const iconNode = loading ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : icon;
  const iconOnly = !children;
  if (import.meta.env.DEV && iconOnly && !rest['aria-label'] && !rest['aria-labelledby']) {
    console.warn('Button: icon-only buttons need an aria-label so screen readers can announce them.');
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, iconOnly, collapseLabel, className })}
      {...rest}
    >
      {iconNode}
      {children && (collapseLabel ? <span className="hidden sm:inline">{children}</span> : children)}
    </button>
  );
}
