import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "static") {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "This feature is disabled in the static demo." }, { status: 404 });
  }

  return NextResponse.rewrite(new URL("/demo-disabled", request.url));
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/tournaments/:path*"],
};
