import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const categoryId = String(form.get("category_id") || "");
  const name = String(form.get("name") || "").trim();

  if (!categoryId || !name) {
    return NextResponse.redirect(new URL("/admin/boards?error=1", request.url), 303);
  }

  await getSupabaseAdmin().from("board_subcategories").insert({
    category_id: categoryId,
    name,
    description: String(form.get("description") || "").trim() || null,
    sort_order: Number(form.get("sort_order") || 0),
    access_level: form.get("access_level") === "staff" ? "staff" : "member",
    is_visible: form.get("is_visible") === "on"
  });

  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
