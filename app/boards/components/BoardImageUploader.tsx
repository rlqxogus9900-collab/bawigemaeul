"use client";

import { useRef, useState } from "react";

type Props = { initialUrls?: string[] };

export default function BoardImageUploader({ initialUrls = [] }: Props) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = 5 - urls.length;
    if (remaining <= 0) {
      setError("이미지는 최대 5장까지 등록할 수 있습니다.");
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError("");

    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
        if (file.size > 8 * 1024 * 1024) throw new Error("이미지는 한 장당 8MB 이하여야 합니다.");
        const body = new FormData();
        body.append("image", file);
        const response = await fetch("/api/boards/images", { method: "POST", body });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.url) throw new Error(result.error || "이미지 업로드에 실패했습니다.");
        uploaded.push(String(result.url));
      }
      setUrls(current => [...current, ...uploaded].slice(0, 5));
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="board-image-uploader">
      <input type="hidden" name="image_urls_json" value={JSON.stringify(urls)} />
      <div className="board-image-upload-head">
        <div><b>이미지 첨부</b><small>최대 5장 · 장당 8MB</small></div>
        <button className="button" type="button" disabled={uploading || urls.length >= 5} onClick={() => inputRef.current?.click()}>
          {uploading ? "업로드 중..." : "이미지 선택"}
        </button>
      </div>
      <input ref={inputRef} className="board-image-file-input" type="file" accept="image/*" multiple onChange={event => uploadFiles(event.target.files)} />
      {error && <p className="board-image-error">{error}</p>}
      {!!urls.length && <div className="board-image-preview-list">
        {urls.map((url, index) => <figure key={`${url}-${index}`}>
          <img src={url} alt={`첨부 이미지 ${index + 1}`} />
          <button type="button" onClick={() => setUrls(current => current.filter((_, itemIndex) => itemIndex !== index))}>삭제</button>
        </figure>)}
      </div>}
    </section>
  );
}
