import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();

  if (!name) {
    return NextResponse.redirect(new URL("/admin/boards?error=1", request.url), 303);
  }

  await getSupabaseAdmin().from("board_categories").insert({
    name,
    icon: String(form.get("icon") || "💬").trim() || "💬",
    sort_order: Number(form.get("sort_order") || 0),
    access_level: form.get("access_level") === "staff" ? "staff" : "member",
    is_visible: form.get("is_visible") === "on"
  });

  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
