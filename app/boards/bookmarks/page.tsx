import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import MemberProfileLink from "@/app/components/MemberProfileLink";

export const dynamic = "force-dynamic";

type BookmarkRow = {
  id: string;
  created_at: string;
  board_posts:
    | {
        id: string;
        title: string;
        author_member_id: string | null;
        author_nickname: string;
        created_at: string;
        view_count: number;
        comment_count: number;
        like_count: number;
        post_type: string;
        is_pinned: boolean;
        board_subcategories:
          | {
              id: string;
              name: string;
              access_level: string | null;
              is_visible: boolean;
            }
          | {
              id: string;
              name: string;
              access_level: string | null;
              is_visible: boolean;
            }[]
          | null;
      }
    | {
        id: string;
        title: string;
        author_member_id: string | null;
        author_nickname: string;
        created_at: string;
        view_count: number;
        comment_count: number;
        like_count: number;
        post_type: string;
        is_pinned: boolean;
        board_subcategories:
          | {
              id: string;
              name: string;
              access_level: string | null;
              is_visible: boolean;
            }
          | {
              id: string;
              name: string;
              access_level: string | null;
              is_visible: boolean;
            }[]
          | null;
      }[]
    | null;
};

export default async function BoardBookmarksPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const { data } = await getSupabaseAdmin()
    .from("board_post_bookmarks")
    .select(`
      id,
      created_at,
      board_posts (
        id,
        title,
        author_member_id,
        author_nickname,
        created_at,
        view_count,
        comment_count,
        like_count,
        post_type,
        is_pinned,
        board_subcategories (
          id,
          name,
          access_level,
          is_visible
        )
      )
    `)
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  const bookmarks = ((data || []) as BookmarkRow[])
    .map(row => {
      const post = Array.isArray(row.board_posts)
        ? row.board_posts[0]
        : row.board_posts;
      if (!post) return null;

      const board = Array.isArray(post.board_subcategories)
        ? post.board_subcategories[0]
        : post.board_subcategories;

      if (
        !board ||
        board.is_visible === false ||
        (board.access_level === "staff" && user.role !== "staff")
      ) {
        return null;
      }

      return { ...row, post, board };
    })
    .filter(Boolean) as Array<{
      id: string;
      created_at: string;
      post: NonNullable<
        Exclude<BookmarkRow["board_posts"], Array<unknown>>
      >;
      board: {
        id: string;
        name: string;
        access_level: string | null;
        is_visible: boolean;
      };
    }>;

  return (
    <section className="card board-list-card">
      <div className="board-list-head">
        <div>
          <span>BOOKMARKS</span>
          <h1>내 즐겨찾기</h1>
          <p className="muted">
            별표로 저장한 게시글을 최근 저장한 순서로 확인합니다.
          </p>
        </div>
        <Link className="button" href="/boards">
          게시판으로
        </Link>
      </div>

      <div className="table-wrap">
        <table className="board-list-table">
          <thead>
            <tr>
              <th>게시판</th>
              <th>제목</th>
              <th>작성자</th>
              <th>조회</th>
              <th>댓글</th>
              <th>추천</th>
              <th>저장일</th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map(({ id, post, board, created_at }) => (
              <tr key={id} className={post.is_pinned ? "pinned-row" : ""}>
                <td>{board.name}</td>
                <td>
                  <Link className="board-post-link" href={`/boards/${post.id}`}>
                    <b>
                      {post.is_pinned
                        ? "📌 "
                        : post.post_type === "poll"
                          ? "📊 "
                          : ""}
                      {post.title}
                    </b>
                  </Link>
                </td>
                <td>
                  <MemberProfileLink
                    memberId={post.author_member_id}
                    nickname={post.author_nickname}
                  />
                </td>
                <td>{post.view_count || 0}</td>
                <td>{post.comment_count || 0}</td>
                <td>{post.like_count || 0}</td>
                <td>{new Date(created_at).toLocaleDateString("ko-KR")}</td>
              </tr>
            ))}

            {!bookmarks.length && (
              <tr>
                <td colSpan={7} className="muted">
                  즐겨찾기한 게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
