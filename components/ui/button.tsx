import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]',
          {
            'bg-foreground text-background hover:bg-foreground/90 shadow-subtle hover:shadow-card':
              variant === 'default',
            'border border-border bg-transparent text-foreground hover:bg-muted hover:border-foreground/20':
              variant === 'outline',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors':
              variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === 'destructive',
          },
          {
            'h-8 px-3.5 text-[13px]': size === 'default',
            'h-7 px-2.5 text-xs': size === 'sm',
            'h-10 px-5 text-sm': size === 'lg',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };
