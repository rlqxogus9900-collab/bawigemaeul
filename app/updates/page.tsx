import Link from "next/link";

export const revalidate = 3600;

const updates = [
  {
    version: "1.3.7.2",
    date: "2026.07.17",
    title: "게시판 기본 기능과 명단 삭제",
    items: [
      "게시글 작성, 상세보기, 수정, 삭제 추가",
      "제목과 작성자 검색 및 조회수 표시",
      "운영진 고정글 설정 추가",
      "명단 설정에 안전한 계정 삭제 버튼 추가"
    ]
  },
  {
    version: "1.3.7.1",
    date: "2026.07.17",
    title: "홈 화면 배치 및 메뉴 반응 개선",
    items: [
      "바위게 사진과 메인 문구를 홈 이동 영역으로 변경",
      "바위게 사진 옆에 후원 목록 배치",
      "기존 후원 카드 자리에 최신 업데이트 1개 표시",
      "클랜원 수 위치와 글씨 크기 개선",
      "현재 탭을 다시 누를 때 상단 로딩 게이지가 뜨지 않도록 수정"
    ]
  },
  {
    version: "1.3.6.6",
    date: "2026.07.17",
    title: "왼쪽 메뉴 가독성 개선",
    items: [
      "대분류와 소분류 글씨 확대",
      "열림과 닫힘 표시를 위아래 삼각형으로 변경"
    ]
  },
  {
    version: "1.3.6.3",
    date: "2026.07.17",
    title: "홈 화면 및 속도 개선",
    items: [
      "홈 화면 전면 리뉴얼",
      "클랜 메뉴에 업데이트 페이지 추가",
      "왼쪽 게시판 메뉴 5분 캐시 적용",
      "메뉴 클릭 즉시 로딩 표시",
      "불필요한 DB 재조회 감소"
    ]
  },
  {
    version: "1.3.6.2",
    date: "2026.07.17",
    title: "왼쪽 메뉴 통합",
    items: [
      "클랜 기능도 대분류·소분류 방식으로 통일",
      "클랜·내전·게임 정보·클랜 운영 그룹 추가"
    ]
  },
  {
    version: "1.3.6.1",
    date: "2026.07.17",
    title: "네이버 카페형 게시판 메뉴",
    items: [
      "관리자가 만든 게시판이 왼쪽 메뉴에 자동 반영",
      "메뉴 표시 여부와 운영진 전용 권한 설정 추가"
    ]
  },
  {
    version: "1.3.6",
    date: "2026.07.16",
    title: "게시판 분류 시스템",
    items: [
      "게시판 대분류·소분류 추가",
      "운영진 게시판 관리 기능 추가"
    ]
  },
  {
    version: "1.3.5.2",
    date: "2026.07.16",
    title: "명단 UI 및 내전티어 개선",
    items: [
      "관리자 전용 명단 이동",
      "명단 설정 카드형 편집",
      "내전티어 로마 숫자 적용"
    ]
  },
  {
    version: "1.3.2",
    date: "2026.07.15",
    title: "후원 목록",
    items: [
      "홈 후원자 목록",
      "운영진 후원 관리"
    ]
  }
];

export default function UpdatesPage() {
  return (
    <>
      <section className="updates-hero">
        <div>
          <span>BAWIGEMAEUL CHANGELOG</span>
          <h1>업데이트</h1>
          <p>바위게마을 홈페이지에 새로 추가되거나 변경된 내용을 확인합니다.</p>
        </div>
        <Link href="/" className="button primary">홈으로 돌아가기</Link>
      </section>

      <section className="updates-timeline">
        {updates.map(update => (
          <article className="update-entry" key={update.version}>
            <div className="update-version">
              <strong>v{update.version}</strong>
              <span>{update.date}</span>
            </div>
            <div className="update-content">
              <h2>{update.title}</h2>
              <ul>
                {update.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
