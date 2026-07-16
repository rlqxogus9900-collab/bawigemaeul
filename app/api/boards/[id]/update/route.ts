import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL('/login', request.url), 303);
  const { id } = await params;
  const form = await request.formData();
  const db = getSupabaseAdmin();
  const { data: post } = await db.from('board_posts').select('author_member_id,subcategory_id,is_pinned').eq('id', id).maybeSingle();
  if (!post || (user.role !== 'staff' && user.id !== post.author_member_id)) return NextResponse.redirect(new URL('/boards', request.url), 303);
  const subcategoryId = String(form.get('subcategory_id') || post.subcategory_id);
  const title = String(form.get('title') || '').trim();
  const content = String(form.get('content') || '').trim();
  const returnBoard = String(form.get('return_board') || subcategoryId);
  if (!title || !content) return NextResponse.redirect(new URL(`/boards/${id}/edit?board=${returnBoard}&error=1`, request.url), 303);
  await db.from('board_posts').update({ subcategory_id:subcategoryId, title, content, is_pinned:user.role === 'staff' ? form.get('is_pinned') === 'on' : post.is_pinned, updated_at:new Date().toISOString() }).eq('id', id);
  return NextResponse.redirect(new URL(`/boards/${id}?board=${subcategoryId}`, request.url), 303);
}
