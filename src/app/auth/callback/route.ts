import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL;
  if (!appUrl || !hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/?auth=unconfigured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", appUrl));
  }
  return NextResponse.redirect(new URL("/?auth=failed", appUrl));
}
