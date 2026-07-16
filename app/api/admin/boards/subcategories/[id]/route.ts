import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
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
    await db.from("board_posts").delete().eq("subcategory_id", id);
    await db.from("board_subcategories").delete().eq("id", id);
  } else {
    await db.from("board_subcategories").update({
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim() || null,
      sort_order: Number(form.get("sort_order") || 0),
      access_level: form.get("access_level") === "staff" ? "staff" : "member",
      is_visible: form.get("is_visible") === "on"
    }).eq("id", id);
  }

  revalidateTag("board-menu", "max");
  return NextResponse.redirect(new URL("/admin/boards?saved=1", request.url), 303);
}
