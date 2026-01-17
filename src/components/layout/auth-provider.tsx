/**
 * Auth0 Provider Component
 *
 * This component wraps the application to provide Auth0 authentication context.
 * In Auth0 SDK v4, the Auth0Provider is OPTIONAL but can be used to provide
 * an initial user during server rendering for the useUser() hook.
 *
 * @module components/layout/auth-provider
 */

"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { ReactNode, JSX } from "react";

/**
 * Props for the AuthProvider component.
 */
export type AuthProviderProps = {
  /**
   * Child components to wrap with authentication context.
   */
  children: ReactNode;
};

/**
 * Authentication Provider Component
 *
 * Wraps the application with Auth0 authentication context provider.
 * This enables the useUser() hook to access user information throughout
 * the client-side application.
 *
 * Note: In Auth0 SDK v4, this provider is optional. Authentication is primarily
 * handled by the middleware. This provider is useful when you need access to
 * user information via the useUser() hook in client components.
 *
 * @param props - Component props containing children to wrap
 * @returns JSX element wrapping children with Auth0Provider
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { AuthProvider } from '@/components/layout/auth-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  return <Auth0Provider>{children}</Auth0Provider>;
}
