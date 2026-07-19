"use client";

import { useEffect, useState } from "react";

type IconKey = "bronze" | "silver" | "gold" | "rainbow";
type IconMap = Record<string, IconKey>;

let cachedIcons: IconMap | null = null;
let iconRequest: Promise<IconMap> | null = null;

function loadIcons() {
  if (cachedIcons) return Promise.resolve(cachedIcons);
  if (!iconRequest) {
    iconRequest = fetch("/api/sponsors/icons", { cache: "no-store" })
      .then(response => response.ok ? response.json() : { icons: {} })
      .then(result => {
        cachedIcons = result?.icons || {};
        return cachedIcons as IconMap;
      })
      .catch(() => {
        cachedIcons = {};
        return cachedIcons;
      });
  }
  return iconRequest;
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
    cachedIcons?.[nickname.trim().toLowerCase()] || null
  );

  useEffect(() => {
    let active = true;
    loadIcons().then(icons => {
      if (active) setIcon(icons[nickname.trim().toLowerCase()] || null);
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
