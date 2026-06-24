import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // ── Banned routes — nobody gets in, auth or not ───────────────────────────
  const bannedRoutes = [
    "/dataset/github-new",
    "/dataset/hn-new",
    "/dataset/reddit-new",
    "/dataset/reddit-edit",
    "/alternate/view-reddit",
    "/alternate/reddit-data",
  ];

  const isBanned = bannedRoutes.some((route) => pathname.startsWith(route));
    if (isBanned) {
  return NextResponse.redirect(
    new URL(session ? "/dashboard" : "/auth", request.url)
    );
}

  // ── Protected routes — must be logged in ─────────────────────────────────
  const protectedRoutes = [
    "/dashboard",
    "/notifications",
    "/settings",
    "/pricing",
    "/dataset/amazon-new",
    "/dataset/web-new",
    "/dataset/web-edit",
    "/dataset/amazon-edit",
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth).*)",
  ],
};