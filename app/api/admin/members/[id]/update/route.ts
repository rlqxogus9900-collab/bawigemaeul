import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireStaff();
  const { id } = await params;
  const form = await request.formData();

  const nickname = String(form.get("nickname") || "").trim();
  const riotId = String(form.get("riot_id") || "").trim();
  const role = form.get("role") === "staff" ? "staff" : "member";
  const isActive = form.get("is_active") === "true";

  if (!nickname || !riotId.includes("#")) {
    return NextResponse.redirect(new URL("/admin/members?error=invalid", request.url), 303);
  }

  if (currentUser.id === id && (!isActive || role !== "staff")) {
    return NextResponse.redirect(new URL("/admin/members?error=self", request.url), 303);
  }

  const db = getSupabaseAdmin();
  const { data: duplicate } = await db
    .from("members")
    .select("id")
    .or(`nickname.eq.${nickname},riot_id.eq.${riotId}`)
    .neq("id", id)
    .limit(1);

  if (duplicate?.length) {
    return NextResponse.redirect(new URL("/admin/members?error=duplicate", request.url), 303);
  }

  const { error } = await db
    .from("members")
    .update({
      nickname,
      riot_id: riotId,
      role,
      is_active: isActive
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(new URL("/admin/members?error=1", request.url), 303);
  }

  return NextResponse.redirect(new URL("/admin/members?saved=1", request.url), 303);
}
