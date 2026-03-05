import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, maybeLocale, ...rest] = pathname.split("/");

  if (routing.locales.includes(maybeLocale as "en" | "zh")) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = rest.length > 0 ? `/${rest.join("/")}` : "/";
    return NextResponse.redirect(nextUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
