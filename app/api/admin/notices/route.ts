import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { notifyAllActiveMembers } from "@/lib/notifications";

export async function POST(request: Request) {
  await ensureStaff();
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();
  let imageUrls: string[] = [];
  try {
    const raw = JSON.parse(String(form.get("image_urls_json") || "[]"));
    if (Array.isArray(raw)) imageUrls = raw.filter(value => typeof value === "string").slice(0, 5);
  } catch {}

  if (title && content) {
    const { data: notice } = await getSupabaseAdmin()
      .from("notices")
      .insert({
        title,
        content,
        is_pinned: form.get("is_pinned") === "on",
        image_urls: imageUrls
      })
      .select("id")
      .single();

    if (notice) {
      await notifyAllActiveMembers({
        type: "notice",
        title: `새 공지: ${title}`,
        message: content,
        link: "/notices"
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  return NextResponse.redirect(new URL("/admin/notices", request.url), 303);
}
