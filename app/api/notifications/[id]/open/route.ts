import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { id } = await context.params;
  const form = await request.formData();
  const link = String(form.get("link") || "/notifications");

  await getSupabaseAdmin()
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("member_id", user.id);

  const safeLink = link.startsWith("/") && !link.startsWith("//")
    ? link
    : "/notifications";

  return NextResponse.redirect(new URL(safeLink, request.url), 303);
}
