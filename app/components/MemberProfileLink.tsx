"use client";

import { useEffect, useState } from "react";
import SponsorNickname from "@/app/components/SponsorNickname";

type Profile = {
  id: string;
  nickname: string;
  riot_id: string | null;
  current_tier: string | null;
  highest_tier: string | null;
  average_tier: string | null;
  match_tier: number | null;
  main_line: string | null;
  sub_line: string | null;
  role: string | null;
  activity_status: string | null;
  reference_note: string | null;
  stats: {
    winRate: number | null;
    kda: number | null;
    averageAuctionPrice: number | null;
  };
};

const roman: Record<number, string> = {
  1: "Ⅰ",
  2: "Ⅱ",
  3: "Ⅲ",
  4: "Ⅳ",
  5: "Ⅴ"
};

export default function MemberProfileLink({
  memberId,
  nickname,
  className = ""
}: {
  memberId: string | null;
  nickname: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function showProfile() {
    if (!memberId) return;
    setOpen(true);

    if (profile || loading) return;

    setLoading(true);
    setError("");

    const response = await fetch(`/api/members/${memberId}`, {
      cache: "no-store"
    });

    const result = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(result?.message || "프로필을 불러오지 못했습니다.");
      return;
    }

    setProfile(result);
  }

  if (!memberId) {
    return <SponsorNickname nickname={nickname} className={className} />;
  }

  return (
    <>
      <button
        type="button"
        className={`member-profile-link ${className}`}
        onClick={showProfile}
      >
        <SponsorNickname nickname={nickname} />
      </button>

      {open && (
        <div
          className="profile-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section
            className="member-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${nickname} 프로필`}
          >
            <button
              type="button"
              className="profile-modal-close"
              onClick={() => setOpen(false)}
              aria-label="닫기"
            >
              ×
            </button>

            {loading && (
              <div className="profile-modal-loading">
                <span>🦀</span>
                <b>프로필을 불러오는 중</b>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            {profile && (
              <>
                <header className="profile-modal-head">
                  <div className="profile-avatar">
                    {profile.nickname.slice(0, 1)}
                  </div>
                  <div>
                    <span>
                      {profile.role === "staff" ? "운영진" : "클랜원"}
                    </span>
                    <h2><SponsorNickname nickname={profile.nickname} /></h2>
                    <p>{profile.riot_id || "Riot ID 미등록"}</p>
                  </div>
                  <div className="profile-match-tier">
                    <small>내전티어</small>
                    <strong>
                      {profile.match_tier
                        ? roman[profile.match_tier]
                        : "-"}
                    </strong>
                  </div>
                </header>

                <div className="profile-info-grid">
                  <div>
                    <span>현재 티어</span>
                    <b>{profile.current_tier || "미정"}</b>
                  </div>
                  <div>
                    <span>평균 티어</span>
                    <b>{profile.average_tier || "미정"}</b>
                  </div>
                  <div>
                    <span>주라인</span>
                    <b>{profile.main_line || "미정"}</b>
                  </div>
                  <div>
                    <span>부라인</span>
                    <b>{profile.sub_line || "미정"}</b>
                  </div>
                </div>

                <div className="profile-stat-grid">
                  <div>
                    <span>내전 승률</span>
                    <strong>
                      {profile.stats.winRate === null
                        ? "집계 전"
                        : `${profile.stats.winRate}%`}
                    </strong>
                  </div>
                  <div>
                    <span>내전 KDA</span>
                    <strong>
                      {profile.stats.kda === null
                        ? "집계 전"
                        : profile.stats.kda.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span>평균 경매가</span>
                    <strong>
                      {profile.stats.averageAuctionPrice === null
                        ? "집계 전"
                        : profile.stats.averageAuctionPrice}
                    </strong>
                  </div>
                </div>

                <footer className="profile-modal-footer">
                  <div>
                    <span>활동 상태</span>
                    <b>
                      {profile.activity_status === "active"
                        ? "활동"
                        : profile.activity_status === "inactive"
                          ? "비활동"
                          : "미정"}
                    </b>
                  </div>
                  {profile.reference_note && <p>{profile.reference_note}</p>}
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
