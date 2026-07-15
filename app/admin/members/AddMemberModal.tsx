"use client";

import { useState } from "react";

export default function AddMemberModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="button primary" type="button" onClick={() => setOpen(true)}>
        + 신입 클랜원 등록
      </button>

      {open && (
        <div className="modal-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="modal-card" onMouseDown={event => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <small>NEW MEMBER</small>
                <h2>신입 클랜원 등록</h2>
              </div>
              <button className="modal-close" type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <p className="muted">초기 비밀번호는 자동으로 1234로 설정됩니다.</p>

            <form className="form" action="/api/admin/members" method="post">
              <label>
                홈페이지 닉네임
                <input name="nickname" placeholder="예: 바위게" required />
              </label>

              <label>
                Riot ID
                <input name="riot_id" placeholder="예: 바위게#KR1" required />
              </label>

              <label>
                권한
                <select name="role" defaultValue="member">
                  <option value="member">클랜원</option>
                  <option value="staff">운영진</option>
                </select>
              </label>

              <div className="modal-actions">
                <button className="button" type="button" onClick={() => setOpen(false)}>
                  취소
                </button>
                <button className="button primary">
                  초기 비밀번호 1234로 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
