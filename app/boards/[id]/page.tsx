import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MemberProfileLink from "@/app/components/MemberProfileLink";
import CommentActions from "./CommentActions";
import PostLikeButton from "./PostLikeButton";
import PostBookmarkButton from "./PostBookmarkButton";
import ViewCounter from "./ViewCounter";
import PollBlock from "./PollBlock";

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
      updated_at,
      post_type,
      image_urls
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

  const [
    { data: comments },
    { count: likeCount },
    { data: myLike },
    { data: myBookmark }
  ] = await Promise.all([
    db
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
      .order("created_at", { ascending: true }),
    db
      .from("board_post_likes")
      .select("id", { count: "exact", head: true })
      .eq("post_id", id),
    user
      ? db
          .from("board_post_likes")
          .select("id")
          .eq("post_id", id)
          .eq("member_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? db
          .from("board_post_bookmarks")
          .select("id")
          .eq("post_id", id)
          .eq("member_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null })
  ]);

  const canManagePost = Boolean(
    user &&
      (user.role === "staff" ||
        user.id === post.author_member_id)
  );

  const { data: poll } = post.post_type === "poll"
    ? await db
        .from("board_polls")
        .select("id,poll_type,allow_multiple,status,match_at,vote_deadline,is_auction_source")
        .eq("post_id", id)
        .maybeSingle()
    : { data: null };

  const { data: pollOptions } = poll
    ? await db
        .from("board_poll_options")
        .select("id,label,sort_order,vote_count")
        .eq("poll_id", poll.id)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const { data: myPollVotes } = poll && user
    ? await db
        .from("board_poll_votes")
        .select("option_id")
        .eq("poll_id", poll.id)
        .eq("member_id", user.id)
    : { data: [] };

  const pollDisabled = Boolean(
    poll &&
      (
        poll.status !== "open" ||
        (poll.vote_deadline && new Date(poll.vote_deadline).getTime() <= Date.now())
      )
  );

  return (
    <>
      <section className={`card board-detail-card ${post.is_pinned ? "pinned-detail" : ""}`}>
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
          <MemberProfileLink
            memberId={post.author_member_id}
            nickname={post.author_nickname}
          />
          <span>{new Date(post.created_at).toLocaleString("ko-KR")}</span>
          <ViewCounter postId={post.id} initialCount={Number(post.view_count || 0)} />
          <span>댓글 {comments?.length || 0}</span>
        </div>

        <div className="board-post-content">{post.content}</div>

        {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
          <div className="board-post-images">
            {post.image_urls.map((url: string, index: number) => (
              <a href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`}>
                <img src={url} alt={`첨부 이미지 ${index + 1}`} />
              </a>
            ))}
          </div>
        )}

        {poll && (
          <PollBlock
            postId={post.id}
            pollId={poll.id}
            pollType={poll.poll_type}
            options={(pollOptions || []) as never[]}
            selectedOptionIds={(myPollVotes || []).map(vote => vote.option_id)}
            allowMultiple={poll.allow_multiple}
            disabled={pollDisabled}
            loggedIn={Boolean(user)}
            isAuctionSource={Boolean(poll.is_auction_source)}
            matchAt={poll.match_at}
            voteDeadline={poll.vote_deadline}
            isStaff={user?.role === "staff"}
          />
        )}

        <div className="board-post-reaction">
          <PostLikeButton
            postId={post.id}
            initialCount={likeCount || 0}
            initialLiked={Boolean(myLike)}
            loggedIn={Boolean(user)}
          />
          <PostBookmarkButton
            postId={post.id}
            initialBookmarked={Boolean(myBookmark)}
            loggedIn={Boolean(user)}
          />
          {user && (
            <Link className="button board-bookmark-list-link" href="/boards/bookmarks">
              내 즐겨찾기
            </Link>
          )}
        </div>

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

      <section className="card board-comments-card" id="comments">
        <div className="board-comments-head">
          <div>
            <span>COMMENTS</span>
            <h2>댓글 <b>{comments?.length || 0}</b></h2>
          </div>
        </div>

        <div className="board-comment-list">
          {(comments || []).map((comment) => {
            const canManageComment = Boolean(
              user &&
                (user.role === "staff" ||
                  user.id === comment.author_member_id)
            );

            return (
              <article className="board-comment" key={comment.id}>
                <div className="board-comment-meta">
                  <div>
                    <MemberProfileLink
                      memberId={comment.author_member_id}
                      nickname={comment.author_nickname}
                    />
                    {comment.author_member_id === post.author_member_id && (
                      <span className="comment-author-badge">작성자</span>
                    )}
                  </div>
                  <time>
                    {new Date(comment.created_at).toLocaleString("ko-KR")}
                    {comment.updated_at !== comment.created_at && " · 수정됨"}
                  </time>
                </div>

                <p>{comment.content}</p>

                {canManageComment && (
                  <CommentActions
                    commentId={comment.id}
                    postId={post.id}
                    initialContent={comment.content}
                  />
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
