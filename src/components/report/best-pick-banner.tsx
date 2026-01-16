/**
 * BestPickBanner Component
 *
 * Displays the recommended best picks at the top of the report.
 *
 * @module components/report/best-pick-banner
 */

"use client";

import type { BestPick, ShopQuote } from "@/lib/types/session";
import { GlassCard } from "@/components/glass";

/**
 * Props for the BestPickBanner component.
 */
export type BestPickBannerProps = {
  /** Best pick recommendations */
  bestPick: BestPick;
  /** Array of all quotes for name lookup */
  quotes: ShopQuote[];
};

/**
 * BestPickBanner component displaying top recommendations.
 *
 * @example
 * ```tsx
 * <BestPickBanner bestPick={report.best_pick} quotes={report.quotes} />
 * ```
 */
export function BestPickBanner({ bestPick, quotes }: BestPickBannerProps) {
  /**
   * Gets shop name by ID from quotes array.
   */
  const getShopName = (shopId: string | null): string => {
    if (!shopId) return "N/A";
    return quotes.find((q) => q.shop_id === shopId)?.shop_name ?? shopId;
  };

  /**
   * Gets shop price range by ID.
   */
  const getShopPrice = (shopId: string | null): string => {
    if (!shopId) return "-";
    const quote = quotes.find((q) => q.shop_id === shopId);
    if (!quote) return "-";
    const { low, high } = quote.price_range;
    if (low !== null && high !== null) {
      return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
    }
    if (low !== null) return `$${low.toLocaleString()}+`;
    if (high !== null) return `Up to $${high.toLocaleString()}`;
    return "Contact for quote";
  };

  /**
   * Gets shop timeframe by ID.
   */
  const getShopTimeframe = (shopId: string | null): string => {
    if (!shopId) return "-";
    const quote = quotes.find((q) => q.shop_id === shopId);
    if (!quote?.timeframe_days) return "TBD";
    return `${quote.timeframe_days} days`;
  };

  // Don't render if no recommendations
  if (!bestPick.overall && !bestPick.by_price && !bestPick.by_time) {
    return null;
  }

  return (
    <GlassCard className="best-pick-banner">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-6 h-6 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <h2 className="text-xl font-semibold text-white">Our Recommendations</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Best Overall */}
        {bestPick.overall && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <span className="text-green-400 text-sm font-medium uppercase tracking-wide">
                Best Overall
              </span>
            </div>
            <p className="text-white font-semibold text-lg">
              {getShopName(bestPick.overall)}
            </p>
            <p className="text-white/60 text-sm">
              Best balance of price, time, and quality
            </p>
          </div>
        )}

        {/* Best Price */}
        {bestPick.by_price && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-yellow-400 text-sm font-medium uppercase tracking-wide">
                Best Price
              </span>
            </div>
            <p className="text-white font-semibold text-lg">
              {getShopName(bestPick.by_price)}
            </p>
            <p className="text-white/60 text-sm">
              {getShopPrice(bestPick.by_price)}
            </p>
          </div>
        )}

        {/* Fastest */}
        {bestPick.by_time && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-blue-400 text-sm font-medium uppercase tracking-wide">
                Fastest
              </span>
            </div>
            <p className="text-white font-semibold text-lg">
              {getShopName(bestPick.by_time)}
            </p>
            <p className="text-white/60 text-sm">
              {getShopTimeframe(bestPick.by_time)}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
