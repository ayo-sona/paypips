import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const selectedOrg = request.cookies.get("selectedOrgId")?.value;
  const { pathname } = request.nextUrl;

  //   // If user is not authenticated and trying to access protected routes
  //   if (!token && !pathname.startsWith("/auth")) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = "/auth/login";
  //     url.search = `redirect=${pathname}`;
  //     return NextResponse.redirect(url);
  //   }

  //   // If user is authenticated but hasn't selected an org and is not on org select page
  //   if (token && !selectedOrg && !pathname.startsWith("/organization")) {
  //     return NextResponse.redirect(new URL("/organization/select", request.url));
  //   }

  //   // If user is on login page but already authenticated
  //   if (token && pathname.startsWith("/auth")) {
  //     return NextResponse.redirect(new URL("/organization/select", request.url));
  //   }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
