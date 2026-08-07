import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function redirectWithError(request: Request, code: string, detail?: string) {
  const url = new URL("/admin/vacations", request.url);
  url.searchParams.set("error", code);
  if (detail) url.searchParams.set("detail", detail.slice(0, 180));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  await requireStaff();
  const form = await request.formData();
  const memberId = String(form.get("member_id") || "");
  const startDate = String(form.get("start_date") || "");
  const endDate = String(form.get("end_date") || "");
  const reason = String(form.get("reason") || "").trim();
  const memo = String(form.get("memo") || "").trim();

  if (!memberId || !startDate || !endDate || !reason || endDate < startDate) {
    return redirectWithError(request, "invalid");
  }

  const db = getSupabaseAdmin();
  const { data: member, error: memberError } = await db
    .from("members")
    .select("id,nickname")
    .eq("id", memberId)
    .eq("is_active", true)
    .maybeSingle();

  if (memberError) {
    return redirectWithError(request, "member_lookup", memberError.message);
  }
  if (!member) {
    return redirectWithError(request, "member");
  }

  const { data: inserted, error } = await db
    .from("member_vacations")
    .insert({
      member_id: memberId,
      start_date: startDate,
      end_date: endDate,
      reason,
      memo: memo || null
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return redirectWithError(request, "save", error?.message || "휴가 저장 결과를 확인하지 못했습니다.");
  }

  const url = new URL("/admin/vacations", request.url);
  url.searchParams.set("saved", "1");
  url.searchParams.set("member", member.nickname);
  return NextResponse.redirect(url, 303);
}
