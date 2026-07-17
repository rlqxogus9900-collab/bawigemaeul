import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("member_id", user.id)
    .eq("is_read", false);

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const redirectTo = String(form.get("redirect") || "/notifications");
    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  }

  return NextResponse.json({ ok: true });
}
