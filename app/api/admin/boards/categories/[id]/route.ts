import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireStaff();
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();

  if (String(form.get("_action") || "update") === "delete") {
    const { count } = await db
      .from("board_subcategories")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if ((count || 0) > 0) {
      return NextResponse.redirect(new URL("/admin/boards?error=1", request.url), 303);
    }

    await db.from("board_categories").delete().eq("id", id);
  } else {
    await db.from("board_categories").update({
      name: String(form.get("name") || "").trim(),
      icon: String(form.get("icon") || "💬").trim() || "💬",
      sort_order: Number(form.get("sort_order") || 0),
      access_level: form.get("access_level") === "staff" ? "staff" : "member",
      is_visible: form.get("is_visible") === "on"
    }).eq("id", id);
  }

  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
