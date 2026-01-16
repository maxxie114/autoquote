/**
 * GlassContainer Component
 *
 * A full-page container with the gradient background for the glass UI system.
 * Use this as the root container for pages that use the glass aesthetic.
 *
 * @module components/glass/glass-container
 */

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/**
 * Props for the GlassContainer component.
 */
export type GlassContainerProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Background gradient variant.
   * - "default": Purple gradient
   * - "warm": Blue-purple gradient
   * - "cool": Deep blue gradient
   */
  variant?: "default" | "warm" | "cool";
  /**
   * Whether to apply a noise texture overlay.
   */
  noise?: boolean;
  /**
   * Child content to render inside the container.
   */
  children: ReactNode;
};

/**
 * GlassContainer component providing the gradient background for glass UI pages.
 *
 * This component should wrap the entire page content to provide
 * the dark gradient background that makes glass cards stand out.
 *
 * @example
 * ```tsx
 * <GlassContainer>
 *   <header>...</header>
 *   <main>
 *     <GlassCard>Content</GlassCard>
 *   </main>
 * </GlassContainer>
 * ```
 */
export const GlassContainer = forwardRef<HTMLDivElement, GlassContainerProps>(
  ({ className, variant = "default", noise = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen",
          variant === "default" && "gradient-bg",
          variant === "warm" && "gradient-bg-warm",
          variant === "cool" && "gradient-bg-cool",
          className
        )}
        {...props}
      >
        {noise && (
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    );
  }
);

GlassContainer.displayName = "GlassContainer";
