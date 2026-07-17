import { getSupabaseAdmin } from "@/lib/supabase-admin";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  nickname: string;
  riot_id: string | null;
  main_line: string | null;
  sub_line: string | null;
  match_tier: number | null;
  current_tier: string | null;
};

type AuctionRow = {
  member_id: string | null;
  nickname: string;
  sold_price: number | null;
};

export default async function StatsPage() {
  const db = getSupabaseAdmin();

  const [{ data: rawMembers }, { data: rawAuctionPlayers }, { count: totalMatches }] = await Promise.all([
    db
      .from("members")
      .select("id,nickname,riot_id,main_line,sub_line,match_tier,current_tier")
      .eq("is_active", true)
      .order("nickname", { ascending: true }),
    db
      .from("auction_players")
      .select("member_id,nickname,sold_price")
      .eq("status", "sold")
      .not("sold_price", "is", null),
    db
      .from("regular_match_results")
      .select("id", { count: "exact", head: true })
  ]);

  const members = (rawMembers || []) as MemberRow[];
  const auctionPlayers = (rawAuctionPlayers || []) as AuctionRow[];
  const priceMap = new Map<string, number[]>();

  for (const player of auctionPlayers) {
    const key = player.member_id || `nickname:${player.nickname}`;
    if (typeof player.sold_price !== "number") continue;
    priceMap.set(key, [...(priceMap.get(key) || []), player.sold_price]);
  }

  const memberStats = members.map(member => {
    const prices = priceMap.get(member.id) || priceMap.get(`nickname:${member.nickname}`) || [];
    return {
      id: member.id,
      nickname: member.nickname,
      riotId: member.riot_id || "",
      mainLine: member.main_line || "미정",
      subLine: member.sub_line || "미정",
      matchTier: member.match_tier,
      soloTier: member.current_tier || "미정",
      auctionCount: prices.length,
      averagePrice: prices.length ? Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length) : null,
      highestPrice: prices.length ? Math.max(...prices) : null
    };
  });

  const allPrices = auctionPlayers
    .map(player => player.sold_price)
    .filter((price): price is number => typeof price === "number");

  return (
    <StatsClient
      members={memberStats}
      totalMatches={totalMatches || 0}
      auctionPlayerCount={allPrices.length}
      overallAveragePrice={allPrices.length ? Math.round(allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length) : null}
    />
  );
}
