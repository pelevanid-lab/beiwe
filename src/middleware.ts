import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameHasLocale =
    pathname.startsWith("/en/") ||
    pathname === "/en" ||
    pathname.startsWith("/tr/") ||
    pathname === "/tr";

  if (pathnameHasLocale) return;

  // Simplest default to tr
  const locale = "tr";
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.svg$).*)"],
};
