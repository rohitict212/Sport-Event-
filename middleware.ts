import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const addHsts = (response: NextResponse) => {
    if (process.env.NODE_ENV === "production" && request.nextUrl.protocol === "https:") {
      response.headers.set("Strict-Transport-Security", "max-age=63072000");
    }
    return response;
  };

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "static") {
    return addHsts(NextResponse.next());
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return addHsts(
      NextResponse.json({ error: "This feature is disabled in the static demo." }, { status: 404 }),
    );
  }

  return addHsts(NextResponse.rewrite(new URL("/demo-disabled", request.url)));
}

export const config = {
  matcher: ["/", "/login", "/demo-disabled", "/api/:path*", "/dashboard/:path*", "/tournaments/:path*"],
};
