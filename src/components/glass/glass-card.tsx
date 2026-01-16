/**
 * GlassCard Component
 *
 * A frosted glass-style card component for the AutoQuote AI glass UI system.
 * Supports multiple variants for different visual emphasis levels.
 *
 * @module components/glass/glass-card
 */

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

/**
 * Props for the GlassCard component.
 */
export type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Visual variant of the card.
   * - "default": Standard glass card with medium opacity
   * - "elevated": Higher contrast with stronger shadow
   * - "subtle": Lower opacity for secondary content
   */
  variant?: "default" | "elevated" | "subtle";
  /**
   * Whether to include padding. Defaults to true.
   */
  padding?: boolean;
  /**
   * Child content to render inside the card.
   */
  children: ReactNode;
};

/**
 * GlassCard component providing a frosted glass aesthetic.
 *
 * Uses backdrop-filter for the blur effect and semi-transparent backgrounds.
 * The gradient overlay creates a subtle highlight effect.
 *
 * @example
 * ```tsx
 * <GlassCard>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </GlassCard>
 *
 * <GlassCard variant="elevated">
 *   <h2>Important Content</h2>
 * </GlassCard>
 *
 * <GlassCard variant="subtle" padding={false}>
 *   <CustomContent />
 * </GlassCard>
 * ```
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", padding = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card",
          padding && "p-6",
          variant === "elevated" && "glass-card-elevated",
          variant === "subtle" && "glass-card-subtle",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
