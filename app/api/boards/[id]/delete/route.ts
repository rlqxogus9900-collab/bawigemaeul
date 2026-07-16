import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL('/login', request.url), 303);
  const { id } = await params;
  const form = await request.formData();
  const board = String(form.get('board') || '');
  const db = getSupabaseAdmin();
  const { data: post } = await db.from('board_posts').select('author_member_id,subcategory_id').eq('id', id).maybeSingle();
  if (!post || (user.role !== 'staff' && user.id !== post.author_member_id)) return NextResponse.redirect(new URL('/boards', request.url), 303);
  await db.from('board_posts').delete().eq('id', id);
  return NextResponse.redirect(new URL(`/boards?board=${board || post.subcategory_id}`, request.url), 303);
}
