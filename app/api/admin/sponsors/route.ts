import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const displayName = String(form.get("display_name") || "").trim();
  const memo = String(form.get("memo") || "").trim();
  const sortOrder = Number(form.get("sort_order") || 0);
  const isVisible = form.get("is_visible") === "on";

  if (!displayName) {
    return NextResponse.redirect(new URL("/admin/sponsors?error=1", request.url), 303);
  }

  await getSupabaseAdmin().from("sponsors").insert({
    display_name: displayName,
    memo: memo || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_visible: isVisible
  });

  revalidateTag("home-summary", "max");
return NextResponse.redirect(new URL("/admin/sponsors?saved=1", request.url), 303);
}
