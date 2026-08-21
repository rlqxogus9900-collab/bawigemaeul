-- 바위게마을 1.3.9.4
-- 이전 버전에서 남은 반려/비활성 회원 찌꺼기 정리용입니다.
-- 승인 대기(pending) 회원과 활성 회원은 삭제하지 않습니다.

delete from public.members
where coalesce(is_active, false) = false
  and coalesce(approval_status, 'approved') = 'rejected';
