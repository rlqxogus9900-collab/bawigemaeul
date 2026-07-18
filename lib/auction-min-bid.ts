export function getTierMinimumBid(room: { tier_min_bids?: unknown; bid_step?: number }, player: { match_tier?: number | null } | null | undefined) {
  const tier = Number(player?.match_tier);
  const raw = room?.tier_min_bids;
  const map = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const configured = Number.isInteger(tier) && tier >= 1 && tier <= 5 ? Number(map[String(tier)] || 0) : 0;
  return Math.max(0, Number.isFinite(configured) ? Math.floor(configured) : 0, Number(room?.bid_step || 1));
}
