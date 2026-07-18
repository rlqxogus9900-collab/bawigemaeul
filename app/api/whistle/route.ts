import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const allowedCategories = new Set(["suggestion", "bug", "report", "other"]);

function wantsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

export async function POST(request: Request) {
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
    if (wantsJson(request)) {
      return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/whistle?error=empty", request.url), 303);
  }

  const { data, error } = await getSupabaseAdmin().from("whistle_reports").insert({
    category,
    title,
    content,
    image_url: imageUrl || null,
    is_anonymous: isAnonymous,
    display_name: isAnonymous ? null : user?.nickname || null,
    author_member_id: user?.id || null,
    status: "pending"
  }).select("id").single();

  if (error || !data) {
    console.error("whistle insert failed", error);
    if (wantsJson(request)) {
      return NextResponse.json({ error: "신문고 저장에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/whistle?error=save", request.url), 303);
  }

  revalidatePath("/whistle");
  revalidatePath("/admin");
  revalidatePath("/admin/whistle");
  if (wantsJson(request)) {
    return NextResponse.json({ ok: true, id: data.id });
  }
  return NextResponse.redirect(new URL("/whistle?submitted=1", request.url), 303);
}
