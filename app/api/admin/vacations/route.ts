import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const memberId = String(form.get("member_id") || "");
  const startDate = String(form.get("start_date") || "");
  const endDate = String(form.get("end_date") || "");
  const reason = String(form.get("reason") || "").trim();
  const memo = String(form.get("memo") || "").trim();

  if (!memberId || !startDate || !endDate || !reason || endDate < startDate) {
    return NextResponse.redirect(new URL("/admin/vacations?error=invalid", request.url), 303);
  }

  const db = getSupabaseAdmin();
  const { data: member } = await db
    .from("members")
    .select("id")
    .eq("id", memberId)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) {
    return NextResponse.redirect(new URL("/admin/vacations?error=member", request.url), 303);
  }

  const { error } = await db.from("member_vacations").insert({
    member_id: memberId,
    start_date: startDate,
    end_date: endDate,
    reason,
    memo: memo || null
  });

  if (error) {
    return NextResponse.redirect(new URL("/admin/vacations?error=save", request.url), 303);
  }

  return NextResponse.redirect(new URL("/admin/vacations?saved=1", request.url), 303);
}
