import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ensureStaff } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureStaff();
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();
  let imageUrls: string[] = [];
  try {
    const raw = JSON.parse(String(form.get("image_urls_json") || "[]"));
    if (Array.isArray(raw)) imageUrls = raw.filter(value => typeof value === "string").slice(0, 5);
  } catch {}

  if (String(form.get("_action") || "") === "delete") {
    await db.from("notices").delete().eq("id", id);
  } else {
    await db.from("notices").update({
      title: String(form.get("title") || "").trim(),
      content: String(form.get("content") || "").trim(),
      is_pinned: form.get("is_pinned") === "on",
      image_urls: imageUrls
    }).eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  return NextResponse.redirect(new URL("/admin/notices", request.url), 303);
}
