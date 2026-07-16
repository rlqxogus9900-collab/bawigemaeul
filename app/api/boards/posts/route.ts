import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), 303);
  const form = await request.formData();
  const subcategoryId = String(form.get("subcategory_id") || "");
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();
  if (!subcategoryId || !title || !content) return NextResponse.redirect(new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url), 303);

  const db = getSupabaseAdmin();
  const { data: board } = await db.from("board_subcategories").select("id,access_level,is_visible").eq("id", subcategoryId).maybeSingle();
  if (!board || board.is_visible === false || (board.access_level === "staff" && user.role !== "staff")) return NextResponse.redirect(new URL("/boards", request.url), 303);
  const { data: post, error } = await db.from("board_posts").insert({ subcategory_id:subcategoryId, title, content, author_member_id:user.id, author_nickname:user.nickname, is_pinned:user.role === "staff" && form.get("is_pinned") === "on" }).select("id").single();
  if (error || !post) return NextResponse.redirect(new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url), 303);
  return NextResponse.redirect(new URL(`/boards/${post.id}`, request.url), 303);
}
