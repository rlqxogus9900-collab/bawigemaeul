import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const form = await request.formData();
  const subcategoryId = String(form.get("subcategory_id") || "");
  const title = String(form.get("title") || "").trim();
  const content = String(form.get("content") || "").trim();
  const postType = String(form.get("post_type") || "normal");
  const pollType = String(form.get("poll_type") || "general");

  if (!subcategoryId || !title || !content) {
    return NextResponse.redirect(
      new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url),
      303
    );
  }

  const db = getSupabaseAdmin();
  const { data: board } = await db
    .from("board_subcategories")
    .select("id,access_level,is_visible")
    .eq("id", subcategoryId)
    .maybeSingle();

  if (
    !board ||
    board.is_visible === false ||
    (board.access_level === "staff" && user.role !== "staff")
  ) {
    return NextResponse.redirect(new URL("/boards", request.url), 303);
  }

  const { data: post, error } = await db
    .from("board_posts")
    .insert({
      subcategory_id: subcategoryId,
      title,
      content,
      author_member_id: user.id,
      author_nickname: user.nickname,
      is_pinned: user.role === "staff" && form.get("is_pinned") === "on",
      post_type: postType === "poll" ? "poll" : "normal"
    })
    .select("id")
    .single();

  if (error || !post) {
    return NextResponse.redirect(
      new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url),
      303
    );
  }

  if (postType === "poll") {
    const isRegularMatch = pollType === "regular_match";
    let options: string[] = [];

    if (isRegularMatch) {
      options = ["참가", "불참", "미정"];
    } else {
      try {
        const raw = JSON.parse(String(form.get("poll_options_json") || "[]"));
        options = Array.isArray(raw)
          ? raw.map(item => String(item).trim()).filter(Boolean).slice(0, 10)
          : [];
      } catch {
        options = [];
      }
    }

    if (options.length < 2) {
      await db.from("board_posts").delete().eq("id", post.id);
      return NextResponse.redirect(
        new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url),
        303
      );
    }

    const matchAt = String(form.get("match_at") || "");
    const voteDeadline = String(form.get("vote_deadline") || "");

    const { data: poll, error: pollError } = await db
      .from("board_polls")
      .insert({
        post_id: post.id,
        poll_type: isRegularMatch ? "regular_match" : "general",
        allow_multiple: !isRegularMatch && form.get("allow_multiple") === "on",
        match_at: isRegularMatch && matchAt ? new Date(matchAt).toISOString() : null,
        vote_deadline: isRegularMatch && voteDeadline ? new Date(voteDeadline).toISOString() : null,
        status: "open"
      })
      .select("id")
      .single();

    if (pollError || !poll) {
      await db.from("board_posts").delete().eq("id", post.id);
      return NextResponse.redirect(
        new URL(`/boards/new?board=${subcategoryId}&error=1`, request.url),
        303
      );
    }

    await db.from("board_poll_options").insert(
      options.map((label, index) => ({
        poll_id: poll.id,
        label,
        sort_order: index
      }))
    );
  }

  return NextResponse.redirect(new URL(`/boards/${post.id}`, request.url), 303);
}
