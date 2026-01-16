/**
 * CallLogTable Component
 *
 * Displays a table of call records with status, duration, and results.
 *
 * @module components/session/call-log-table
 */

"use client";

import type { Call } from "@/lib/types/call";
import type { Shop } from "@/lib/types/session";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Props for the CallLogTable component.
 */
export type CallLogTableProps = {
  /** Array of call records */
  calls: Call[];
  /** Array of shops for name lookup */
  shops: Shop[];
};

/**
 * CallLogTable component displaying call status and results.
 *
 * @example
 * ```tsx
 * <CallLogTable calls={calls} shops={session.shops} />
 * ```
 */
export function CallLogTable({ calls, shops }: CallLogTableProps) {
  /**
   * Gets the shop name for a given shop ID.
   */
  const getShopName = (shopId: string): string => {
    return shops.find((s) => s.id === shopId)?.name ?? shopId;
  };

  /**
   * Formats duration in seconds to human-readable string.
   */
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Gets badge variant based on call status.
   */
  const getStatusBadge = (status: Call["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Completed
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">
            In Progress
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Failed
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-white/10 text-white/60 border-white/20">
            Pending
          </Badge>
        );
    }
  };

  /**
   * Formats price range from structured data.
   */
  const formatPrice = (call: Call): string => {
    const data = call.structured_data;
    if (!data?.quote_provided) return "No quote";
    if (data.price_estimate_low && data.price_estimate_high) {
      return `$${data.price_estimate_low} - $${data.price_estimate_high}`;
    }
    if (data.price_estimate_low) return `$${data.price_estimate_low}+`;
    if (data.price_estimate_high) return `Up to $${data.price_estimate_high}`;
    return "Quote provided";
  };

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No calls yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/60">Shop</TableHead>
            <TableHead className="text-white/60">Status</TableHead>
            <TableHead className="text-white/60">Duration</TableHead>
            <TableHead className="text-white/60">Quote</TableHead>
            <TableHead className="text-white/60">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((call) => (
            <TableRow
              key={`${call.session_id}-${call.shop_id}`}
              className="border-white/10 hover:bg-white/5"
            >
              <TableCell className="text-white font-medium">
                {getShopName(call.shop_id)}
              </TableCell>
              <TableCell>{getStatusBadge(call.status)}</TableCell>
              <TableCell className="text-white/70">
                {formatDuration(call.duration_seconds)}
              </TableCell>
              <TableCell className="text-white/70">
                {call.status === "COMPLETED" ? formatPrice(call) : "-"}
              </TableCell>
              <TableCell>
                {call.status === "COMPLETED" && call.transcript && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                      >
                        View Transcript
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
                      <DialogHeader>
                        <DialogTitle>
                          Call Transcript - {getShopName(call.shop_id)}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4 space-y-4">
                        {/* Summary */}
                        {call.summary && (
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-1">
                              Summary
                            </h4>
                            <p className="text-white/80 text-sm">
                              {call.summary}
                            </p>
                          </div>
                        )}

                        {/* Extracted Data */}
                        {call.structured_data && (
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-2">
                              Extracted Information
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-white/5 p-2 rounded">
                                <span className="text-white/60">
                                  Quote Provided:
                                </span>{" "}
                                <span className="text-white">
                                  {call.structured_data.quote_provided
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                              <div className="bg-white/5 p-2 rounded">
                                <span className="text-white/60">
                                  Can Do Work:
                                </span>{" "}
                                <span className="text-white">
                                  {call.structured_data.shop_can_do_work
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                              {call.structured_data.timeframe_days && (
                                <div className="bg-white/5 p-2 rounded">
                                  <span className="text-white/60">
                                    Timeframe:
                                  </span>{" "}
                                  <span className="text-white">
                                    {call.structured_data.timeframe_days} days
                                  </span>
                                </div>
                              )}
                              {call.structured_data.requires_inspection && (
                                <div className="bg-white/5 p-2 rounded">
                                  <span className="text-white/60">
                                    Requires Inspection:
                                  </span>{" "}
                                  <span className="text-white">Yes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Full Transcript */}
                        <div>
                          <h4 className="text-sm font-medium text-white/60 mb-1">
                            Full Transcript
                          </h4>
                          <div className="bg-white/5 p-4 rounded-lg max-h-64 overflow-y-auto">
                            <p className="text-white/80 text-sm whitespace-pre-wrap">
                              {call.transcript}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {call.status === "FAILED" && (
                  <span className="text-red-400 text-sm">
                    {call.ended_reason || "Call failed"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
