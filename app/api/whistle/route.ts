import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowedCategories = new Set(["suggestion", "bug", "report", "other"]);

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") || request.headers.get("x-requested-with") === "fetch";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const user = await getSession();
    const categoryRaw = String(form.get("category") || "other");
    const category = allowedCategories.has(categoryRaw) ? categoryRaw : "other";
    const title = String(form.get("title") || "").trim().slice(0, 80);
    const content = String(form.get("content") || "").trim().slice(0, 2000);
    const imageUrl = String(form.get("image_url") || "").trim().slice(0, 500);
    const requestedAnonymous = String(form.get("is_anonymous") || "true") !== "false";
    const isAnonymous = !user || requestedAnonymous;

    if (!title || !content) {
      if (wantsJson(request)) return NextResponse.json({ ok: false, error: "제목과 내용을 입력해주세요." }, { status: 400 });
      return NextResponse.redirect(new URL("/whistle?error=empty", request.url), 303);
    }

    const { error } = await getSupabaseAdmin().from("whistle_reports").insert({
      category,
      title,
      content,
      image_url: imageUrl || null,
      is_anonymous: isAnonymous,
      display_name: isAnonymous ? null : user?.nickname || null,
      author_member_id: user?.id || null,
      status: "pending"
    });

    if (error) {
      console.error("[whistle] insert failed", error);
      const missingTable = error.code === "42P01" || /whistle_reports|relation .* does not exist/i.test(error.message || "");
      const message = missingTable
        ? "신문고 DB 테이블이 없습니다. ZIP의 추가-SQL-1.3.8.23.sql을 Supabase SQL Editor에서 실행해주세요."
        : `신문고 저장에 실패했습니다. (${error.message})`;
      if (wantsJson(request)) return NextResponse.json({ ok: false, error: message }, { status: 500 });
      return NextResponse.redirect(new URL(`/whistle?error=${missingTable ? "missing_table" : "save"}`, request.url), 303);
    }

    revalidatePath("/whistle");
    revalidatePath("/admin");
    revalidatePath("/admin/whistle");

    if (wantsJson(request)) return NextResponse.json({ ok: true });
    return NextResponse.redirect(new URL("/whistle?submitted=1", request.url), 303);
  } catch (error) {
    console.error("[whistle] unexpected error", error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    if (wantsJson(request)) return NextResponse.json({ ok: false, error: `신문고 저장에 실패했습니다. (${message})` }, { status: 500 });
    return NextResponse.redirect(new URL("/whistle?error=server", request.url), 303);
  }
}
