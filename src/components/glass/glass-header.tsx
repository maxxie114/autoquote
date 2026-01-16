/**
 * GlassHeader Component
 *
 * A navigation header component with glass styling for the AutoQuote AI app.
 *
 * @module components/glass/glass-header
 */

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import Link from "next/link";

/**
 * Props for the GlassHeader component.
 */
export type GlassHeaderProps = HTMLAttributes<HTMLElement> & {
  /**
   * Logo or brand element to display on the left.
   */
  logo?: ReactNode;
  /**
   * Navigation items or actions to display on the right.
   */
  actions?: ReactNode;
  /**
   * Whether the header should be sticky.
   */
  sticky?: boolean;
};

/**
 * GlassHeader component providing a navigation header with glass styling.
 *
 * Features a frosted glass effect with the app branding and navigation actions.
 *
 * @example
 * ```tsx
 * <GlassHeader
 *   logo={<Logo />}
 *   actions={<Button>Login</Button>}
 * />
 * ```
 */
export const GlassHeader = forwardRef<HTMLElement, GlassHeaderProps>(
  ({ className, logo, actions, sticky = true, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "w-full z-40 border-b border-white/10",
          "bg-white/5 backdrop-blur-lg",
          sticky && "sticky top-0",
          className
        )}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2">
              {logo || (
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AQ</span>
                  </div>
                  <span className="text-white font-semibold text-lg">
                    AutoQuote
                    <span className="text-indigo-400"> AI</span>
                  </span>
                </Link>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-4">{actions}</div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

GlassHeader.displayName = "GlassHeader";
