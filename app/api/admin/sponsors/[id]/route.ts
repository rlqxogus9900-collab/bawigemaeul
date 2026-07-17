import { revalidateTag } from "next/cache";
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
  const action = String(form.get("_action") || "update");
  const db = getSupabaseAdmin();

  if (action === "delete") {
    await db.from("sponsors").delete().eq("id", id);
  } else {
    const displayName = String(form.get("display_name") || "").trim();
    if (!displayName) {
      return NextResponse.redirect(new URL("/admin/sponsors?error=1", request.url), 303);
    }

    await db.from("sponsors").update({
      display_name: displayName,
      memo: String(form.get("memo") || "").trim() || null,
      sort_order: Number(form.get("sort_order") || 0),
      is_visible: form.get("is_visible") === "on"
    }).eq("id", id);
  }

  revalidateTag("home-summary", "max");
return NextResponse.redirect(new URL("/admin/sponsors?saved=1", request.url), 303);
}
