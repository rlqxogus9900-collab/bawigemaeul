"use client";

import { useEffect, useState } from "react";

type IconKey = "bronze" | "silver" | "gold" | "rainbow";
type IconMap = Record<string, IconKey>;

function normalizeNickname(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/#.*$/, "");
}

async function loadIcons(): Promise<IconMap> {
  const response = await fetch(`/api/sponsors/icons?t=${Date.now()}`, { cache: "no-store" });
  const result = response.ok ? await response.json() : { icons: {} };
  return result?.icons || {};
}

export default function SponsorNickname({
  nickname,
  className = "",
  nameOnly = false
}: {
  nickname: string;
  className?: string;
  nameOnly?: boolean;
}) {
  const [icon, setIcon] = useState<IconKey | null>(
    null
  );

  useEffect(() => {
    let active = true;
    loadIcons().then(icons => {
      if (active) setIcon(icons[normalizeNickname(nickname)] || null);
    });
    return () => { active = false; };
  }, [nickname]);

  if (nameOnly) {
    return (
      <span className={`sponsor-nickname-inline ${className}`.trim()}>
        {icon && <img src={`/assets/sponsor-icons/${icon}.png`} alt="후원 아이콘" />}
        <span>{nickname}</span>
      </span>
    );
  }

  return (
    <span className={`sponsor-nickname-inline ${className}`.trim()}>
      {icon && <img src={`/assets/sponsor-icons/${icon}.png`} alt="후원 아이콘" />}
      <span>{nickname}</span>
    </span>
  );
}
