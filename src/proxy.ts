import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  // console.log("token", token);
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/auth"];

  // If user is not authenticated and trying to access protected routes
  if (!token && !publicPaths.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `redirect=${pathname}`;
    return NextResponse.redirect(url);
  }

  // If user is authenticated and trying to access auth pages
  if (token && publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/select", request.url));
  }

  return NextResponse.next();
}

// Configure which paths this proxy should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|$).*)"],
};
