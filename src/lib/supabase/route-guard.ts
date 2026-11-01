/** Route prefixes that require an authenticated user. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes that an authenticated user should be redirected away from. */
const AUTH_ROUTES = ["/login"];

type GuardInput = {
  pathname: string;
  isAuthenticated: boolean;
};

/**
 * Pure routing decision for auth. Returns the path to redirect to, or
 * null to allow the request through. Kept free of Next/Supabase types so
 * it can be unit-tested in isolation and reused by the middleware.
 */
export function resolveAuthRedirect({
  pathname,
  isAuthenticated,
}: GuardInput): string | null {
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isAuthenticated && isProtected) {
    return "/login";
  }

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  if (isAuthenticated && isAuthRoute) {
    return "/dashboard";
  }

  return null;
}
