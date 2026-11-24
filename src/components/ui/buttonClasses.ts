export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 shrink-0 font-semibold text-sm transition-all active:scale-95 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary hover:bg-primary-700 text-white shadow-xs',
  secondary: 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-xs',
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-xs',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 rounded-xl',
  md: 'px-5 py-2.5 rounded-xl',
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'p-2 rounded-xl',
  md: 'p-2.5 rounded-xl',
};

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  collapseLabel?: boolean;
  className?: string;
}

export function buttonClasses({
  variant = 'secondary',
  size = 'md',
  iconOnly = false,
  collapseLabel = false,
  className = '',
}: ButtonClassOptions = {}) {
  const sizing = iconOnly ? ICON_SIZES[size] : collapseLabel ? `${ICON_SIZES[size]} sm:px-4 sm:py-2.5` : SIZES[size];
  return `${BASE} ${VARIANTS[variant]} ${sizing} ${className}`.trim();
}
