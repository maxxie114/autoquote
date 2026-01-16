/**
 * NavHeader Component
 *
 * Main navigation header for the AutoQuote AI application.
 * Displays branding and authentication state.
 *
 * @module components/layout/nav-header
 */

"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0";
import { Button } from "@/components/ui/button";
import { GlassHeader } from "@/components/glass";

/**
 * NavHeader component providing the main navigation bar.
 *
 * Features:
 * - AutoQuote AI branding with logo
 * - Authentication state display (login/logout)
 * - User avatar when logged in
 *
 * Note: In Auth0 SDK v4, routes have changed from /api/auth/* to /auth/*
 *
 * @example
 * ```tsx
 * <NavHeader />
 * ```
 */
export function NavHeader() {
  const { user, isLoading } = useUser();

  return (
    <GlassHeader
      actions={
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="h-8 w-20 bg-white/10 animate-pulse rounded" />
          ) : user ? (
            <>
              {/* User Info */}
              <div className="flex items-center gap-3">
                {user.picture && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={user.picture}
                    alt={user.name || "User avatar"}
                    className="w-8 h-8 rounded-full border border-white/20"
                  />
                )}
                <span className="text-white/80 text-sm hidden sm:inline">
                  {user.name || user.email}
                </span>
              </div>

              {/* Dashboard Link */}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Link href="/session/new">New Quote</Link>
              </Button>

              {/* Logout - Auth0 SDK v4 uses /auth/logout instead of /api/auth/logout */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Link href="/auth/logout">Logout</Link>
              </Button>
            </>
          ) : (
            /* Login Button - Auth0 SDK v4 uses /auth/login instead of /api/auth/login */
            <Button
              asChild
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <Link href="/auth/login">Login</Link>
            </Button>
          )}
        </div>
      }
    />
  );
}
