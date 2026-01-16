/**
 * ShopQuoteCard Component
 *
 * Displays a single shop's quote information in a card format.
 *
 * @module components/report/shop-quote-card
 */

"use client";

import type { ShopQuote } from "@/lib/types/session";
import { GlassCard } from "@/components/glass";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Props for the ShopQuoteCard component.
 */
export type ShopQuoteCardProps = {
  /** Shop quote data */
  quote: ShopQuote;
  /** Shop phone number */
  phone?: string;
  /** Whether this is the best overall pick */
  isBestPick?: boolean;
};

/**
 * ShopQuoteCard component displaying a shop's quote details.
 *
 * @example
 * ```tsx
 * <ShopQuoteCard
 *   quote={quoteData}
 *   phone="+15551234567"
 *   isBestPick={true}
 * />
 * ```
 */
export function ShopQuoteCard({ quote, phone, isBestPick }: ShopQuoteCardProps) {
  /**
   * Formats the price range for display.
   */
  const formatPriceRange = (): string => {
    const { low, high } = quote.price_range;
    if (low !== null && high !== null) {
      return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
    }
    if (low !== null) return `$${low.toLocaleString()}+`;
    if (high !== null) return `Up to $${high.toLocaleString()}`;
    return "Contact for quote";
  };

  /**
   * Gets the score color based on value.
   */
  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <GlassCard
      className={cn(
        "relative",
        isBestPick && "quote-card-best border-green-500/50"
      )}
    >
      {/* Best Pick Badge */}
      {isBestPick && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-green-500 text-white border-0">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Best Pick
          </Badge>
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {quote.shop_name}
            </h3>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="text-indigo-400 text-sm hover:underline"
              >
                {phone}
              </a>
            )}
          </div>
          <div className="text-right">
            <span className={cn("text-2xl font-bold", getScoreColor(quote.recommendation_score))}>
              {quote.recommendation_score}
            </span>
            <span className="text-white/40 text-sm">/10</span>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
            Estimated Price
          </p>
          <p className="text-2xl font-bold text-white">{formatPriceRange()}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/60 text-xs">Timeframe</p>
            <p className="text-white font-medium">
              {quote.timeframe_days
                ? `${quote.timeframe_days} days`
                : "TBD"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="text-white/60 text-xs">Inspection</p>
            <p className="text-white font-medium">
              {quote.requires_inspection ? "Required" : "Not needed"}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {quote.can_do_work ? (
            <Badge
              variant="outline"
              className="border-green-500/30 text-green-400 bg-green-500/10"
            >
              Can Do Work
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-red-500/30 text-red-400 bg-red-500/10"
            >
              Cannot Do Work
            </Badge>
          )}
        </div>

        {/* Notes */}
        {quote.notes && (
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-white/80 text-sm">{quote.notes}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
