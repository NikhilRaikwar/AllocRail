import type { NextRequest } from "next/server";
import { updateSession } from "@/app/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
};
