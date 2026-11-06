import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'quiet'
  | 'dangerQuiet'
  | 'danger'
  | 'dangerSoft'
  | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * One geometry for every button in the portal. The 12px corner is shared by
 * buttons, tabs, and filter chips so the interface reads as a single system.
 * Pill shapes are reserved for badges and the mobile nav indicator.
 */
const RADIUS = 'rounded-xl';

const base =
  `inline-flex items-center justify-center gap-2 ${RADIUS} font-bold transition-all duration-200 ` +
  'disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-3 ' +
  'focus-visible:outline-pine active:translate-x-[2px] active:translate-y-[2px]';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-pine text-white hover:bg-pine-deep shadow-subtle hover:shadow-card',
  secondary:
    'bg-white text-forest border border-line hover:border-leaf hover:bg-mist shadow-subtle',
  ghost: 'bg-transparent text-forest hover:bg-mint',
  quiet:
    'bg-white text-muted border border-line hover:border-leaf hover:text-forest',
  dangerQuiet:
    'bg-white text-muted border border-line hover:border-[#f1cccc] hover:bg-rejected-bg hover:text-rejected-ink',
  danger: 'bg-[#9c3f3f] text-white hover:bg-[#853333] shadow-subtle',
  dangerSoft:
    'bg-rejected-bg text-rejected-ink border border-[#f1cccc] hover:bg-[#f7dede]',
  gold: 'bg-gold text-[#4a3a12] hover:bg-[#efbb60] shadow-subtle',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3.5 py-2 text-[0.75rem]',
  md: 'min-h-11 px-5 py-2.5 text-sm',
  lg: 'min-h-12 px-6 py-3 text-[0.9375rem]',
};

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
