import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  const role = request.cookies.get("role")?.value;

  if (path === "/login" && role) {
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (role === "dealer") return NextResponse.redirect(new URL("/dealer/dashboard", request.url));
    if (role === "super_admin") return NextResponse.redirect(new URL("/super-admin/dashboard", request.url));
  }

  const isPrivate = path.startsWith("/admin") || path.startsWith("/dealer") || path.startsWith("/super-admin");

  if (isPrivate) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path.startsWith("/dealer") && role !== "dealer") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (path.startsWith("/super-admin") && role !== "super_admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    "/admin/:path*",
    "/dealer/:path*",
    "/super-admin/:path*",
    "/login"
  ],
};