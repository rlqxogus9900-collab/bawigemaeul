import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import CommentDeleteButton from "./CommentDeleteButton";

export const dynamic = "force-dynamic";

export default async function BoardPostPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comment_error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await getSession();
  const db = getSupabaseAdmin();

  const { data: post } = await db
    .from("board_posts")
    .select(`
      id,
      subcategory_id,
      title,
      content,
      author_member_id,
      author_nickname,
      is_pinned,
      view_count,
      comment_count,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  const { data: board } = await db
    .from("board_subcategories")
    .select("id,name,access_level,is_visible")
    .eq("id", post.subcategory_id)
    .maybeSingle();

  if (
    !board ||
    board.is_visible === false ||
    (board.access_level === "staff" && user?.role !== "staff")
  ) {
    notFound();
  }

  const nextViewCount = Number(post.view_count || 0) + 1;
  await db
    .from("board_posts")
    .update({ view_count: nextViewCount })
    .eq("id", id);

  const { data: comments } = await db
    .from("board_comments")
    .select(`
      id,
      post_id,
      author_member_id,
      author_nickname,
      content,
      created_at,
      updated_at
    `)
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const canManagePost = Boolean(
    user && (user.role === "staff" || user.id === post.author_member_id)
  );

  return (
    <>
      <section className="card board-detail-card">
        <div className="board-detail-top">
          <div>
            <span>{post.is_pinned ? "📌 고정글" : board.name}</span>
            <h1>{post.title}</h1>
          </div>
          <Link className="button" href={`/boards?board=${board.id}`}>
            목록
          </Link>
        </div>

        <div className="board-post-meta">
          <b>{post.author_nickname}</b>
          <span>{new Date(post.created_at).toLocaleString("ko-KR")}</span>
          <span>조회 {nextViewCount}</span>
          <span>댓글 {comments?.length || 0}</span>
        </div>

        <div className="board-post-content">{post.content}</div>

        {canManagePost && (
          <div className="board-detail-actions">
            <Link className="button" href={`/boards/${post.id}/edit`}>
              수정
            </Link>
            <form action={`/api/boards/posts/${post.id}`} method="post">
              <input type="hidden" name="_action" value="delete" />
              <button className="button danger">삭제</button>
            </form>
          </div>
        )}
      </section>

      <section className="card board-comments-card">
        <div className="board-comments-head">
          <div>
            <span>COMMENTS</span>
            <h2>댓글 <b>{comments?.length || 0}</b></h2>
          </div>
        </div>

        <div className="board-comment-list">
          {(comments || []).map((comment) => {
            const canDeleteComment = Boolean(
              user &&
                (user.role === "staff" ||
                  user.id === comment.author_member_id)
            );

            return (
              <article className="board-comment" key={comment.id}>
                <div className="board-comment-meta">
                  <div>
                    <strong>{comment.author_nickname}</strong>
                    {comment.author_member_id === post.author_member_id && (
                      <span className="comment-author-badge">작성자</span>
                    )}
                  </div>
                  <time>
                    {new Date(comment.created_at).toLocaleString("ko-KR")}
                  </time>
                </div>

                <p>{comment.content}</p>

                {canDeleteComment && (
                  <form
                    action={`/api/boards/comments/${comment.id}`}
                    method="post"
                    className="board-comment-actions"
                  >
                    <input type="hidden" name="post_id" value={post.id} />
                    <CommentDeleteButton />
                  </form>
                )}
              </article>
            );
          })}

          {!comments?.length && (
            <div className="board-comment-empty">
              아직 등록된 댓글이 없습니다.
            </div>
          )}
        </div>

        {query.comment_error && (
          <div className="error">댓글 내용을 입력해주세요.</div>
        )}

        {user ? (
          <form
            className="board-comment-form"
            action="/api/boards/comments"
            method="post"
          >
            <input type="hidden" name="post_id" value={post.id} />
            <textarea
              name="content"
              rows={4}
              maxLength={1000}
              required
              placeholder="댓글을 입력하세요."
            />
            <div>
              <span>최대 1,000자</span>
              <button className="button primary" type="submit">
                댓글 등록
              </button>
            </div>
          </form>
        ) : (
          <div className="board-comment-login">
            <p>댓글을 작성하려면 로그인이 필요합니다.</p>
            <Link className="button primary" href="/login">
              로그인
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
