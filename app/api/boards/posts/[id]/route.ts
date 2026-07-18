import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();
  const { data: post } = await db.from("board_posts").select("id,subcategory_id,author_member_id,is_pinned").eq("id", id).maybeSingle();
  if (!post) return NextResponse.redirect(new URL("/boards", request.url), 303);
  if (user.role !== "staff" && user.id !== post.author_member_id) return NextResponse.redirect(new URL(`/boards/${id}`, request.url), 303);

  if (String(form.get("_action")) === "delete") {
    await db.from("board_comments").delete().eq("post_id", id);
    await db.from("board_posts").delete().eq("id", id);
    return NextResponse.redirect(new URL(`/boards?board=${post.subcategory_id}`, request.url), 303);
  }

  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();
  if (!title || !content) return NextResponse.redirect(new URL(`/boards/${id}/edit`, request.url), 303);
  let imageUrls: string[] = [];
  try {
    const raw = JSON.parse(String(form.get("image_urls_json") || "[]"));
    imageUrls = Array.isArray(raw) ? raw.map(String).filter(url => url.startsWith("https://")).slice(0, 5) : [];
  } catch {}
  const update:Record<string,unknown> = { title, content, image_urls: imageUrls, updated_at:new Date().toISOString() };
  if (user.role === "staff") update.is_pinned = form.get("is_pinned") === "on";
  await db.from("board_posts").update(update).eq("id", id);
  return NextResponse.redirect(new URL(`/boards/${id}`, request.url), 303);
}
