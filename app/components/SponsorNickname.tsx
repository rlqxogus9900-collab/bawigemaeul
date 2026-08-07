"use client";

import { useEffect, useState } from "react";

type IconKey = "bronze" | "silver" | "gold" | "rainbow";
type IconMap = Record<string, IconKey>;
let iconCache: IconMap | null = null;
let iconPromise: Promise<IconMap> | null = null;

function normalizeNickname(value: string) {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "").replace(/#.*$/, "");
}
async function loadIcons(): Promise<IconMap> {
  if (iconCache) return iconCache;
  if (!iconPromise) iconPromise = fetch("/api/sponsors/icons", { cache: "no-store" }).then(async r => {
    const j = r.ok ? await r.json() : { icons: {} };
    iconCache = j?.icons || {};
    return iconCache!;
  }).finally(() => { iconPromise = null; });
  return iconPromise;
}
export default function SponsorNickname({ nickname, className = "" }: { nickname: string; className?: string; nameOnly?: boolean }) {
  const [icon, setIcon] = useState<IconKey | null>(null);
  useEffect(() => { let active=true; loadIcons().then(x=>{if(active)setIcon(x[normalizeNickname(nickname)]||null)}); return()=>{active=false}; }, [nickname]);
  return <span className={`sponsor-nickname-inline ${className}`.trim()}>{icon && <img src={`/assets/sponsor-icons/${icon}.png`} alt="후원 아이콘" />}<span>{nickname}</span></span>;
}
