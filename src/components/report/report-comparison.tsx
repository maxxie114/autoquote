/**
 * ReportComparison Component
 *
 * Displays a comparison grid of all shop quotes with key metrics.
 *
 * @module components/report/report-comparison
 */

"use client";

import type { ShopQuote } from "@/lib/types/session";
import type { Shop } from "@/lib/types/session";
import { ShopQuoteCard } from "./shop-quote-card";

/**
 * Props for the ReportComparison component.
 */
export type ReportComparisonProps = {
  /** Array of shop quotes from the report */
  quotes: ShopQuote[];
  /** Array of shops for additional info */
  shops: Shop[];
  /** Shop ID of the best overall pick */
  bestOverall?: string | null;
};

/**
 * ReportComparison component displaying a grid of shop quote cards.
 *
 * @example
 * ```tsx
 * <ReportComparison
 *   quotes={report.quotes}
 *   shops={session.shops}
 *   bestOverall={report.best_pick.overall}
 * />
 * ```
 */
export function ReportComparison({
  quotes,
  shops,
  bestOverall,
}: ReportComparisonProps) {
  // Sort quotes by recommendation score (highest first)
  const sortedQuotes = [...quotes].sort(
    (a, b) => b.recommendation_score - a.recommendation_score
  );

  /**
   * Gets the shop phone number for a given shop ID.
   */
  const getShopPhone = (shopId: string): string | undefined => {
    return shops.find((s) => s.id === shopId)?.phone;
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <svg
          className="w-16 h-16 mx-auto mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-lg">No quotes to compare</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Shop Quotes</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedQuotes.map((quote) => (
          <ShopQuoteCard
            key={quote.shop_id}
            quote={quote}
            phone={getShopPhone(quote.shop_id)}
            isBestPick={quote.shop_id === bestOverall}
          />
        ))}
      </div>
    </div>
  );
}
