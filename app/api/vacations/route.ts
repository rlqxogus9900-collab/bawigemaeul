import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function redirectWithError(request: Request, code: string, detail?: string) {
  const url = new URL("/vacation", request.url);
  url.searchParams.set("error", code);
  if (detail) url.searchParams.set("detail", detail.slice(0, 180));
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData();
  const startDate = String(form.get("start_date") || "");
  const endDate = String(form.get("end_date") || "");
  const reason = String(form.get("reason") || "").trim();
  const memo = String(form.get("memo") || "").trim();

  if (!startDate || !endDate || !reason || endDate < startDate) {
    return redirectWithError(request, "invalid");
  }

  const db = getSupabaseAdmin();
  const { data: inserted, error } = await db
    .from("member_vacations")
    .insert({
      member_id: user.id,
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

  const { data: staff } = await db.from("members").select("id").eq("role", "staff").eq("is_active", true);
  if (staff?.length) {
    await db.from("notifications").insert(staff.map(row => ({
      member_id: row.id,
      type: "system",
      title: "🏖️ 새 휴가 신청",
      message: `${user.nickname}님이 ${startDate} ~ ${endDate} 휴가를 신청했습니다. 사유: ${reason}`,
      link: "/admin/vacations"
    })));
  }

  const url = new URL("/vacation", request.url);
  url.searchParams.set("saved", "1");
  return NextResponse.redirect(url, 303);
}
