import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;
  const role = request.cookies.get("role")?.value;

  const protectedPaths = [
    "/dashboard",
    "/quotes",
    "/dealerships",
    "/approvals",
    "/users",
    "/sellers",
    "/roles",
    "/notifications",
    "/settings",
    "/inventory"
  ];

  // Redirect legacy paths
  if (path.startsWith("/admin") || path.startsWith("/dealer") || path.startsWith("/super-admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtected = protectedPaths.some(p => path.startsWith(p));

  if (path === "/login" && role) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based access control (RBAC)
    const isAdmin = role === "admin" || role === "super_admin";
    const isDealer = role === "dealer";

    if (path.startsWith("/approvals") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path.startsWith("/users") && !isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path.startsWith("/roles") && role !== "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path.startsWith("/inventory") && !isDealer && role !== "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quotes/:path*",
    "/dealerships/:path*",
    "/approvals/:path*",
    "/users/:path*",
    "/sellers/:path*",
    "/roles/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/inventory/:path*",
    "/login"
  ],
};