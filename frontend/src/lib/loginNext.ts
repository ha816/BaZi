// 로그인 필수 화면(시운·궁합·분석 캡션)에서 /join으로 보낼 때 돌아올 경로를 잠깐 기억한다.
// URL에 ?next= 로 싣지 않고 sessionStorage에 둔다 (같은 탭 안에서만, 로그인 직후 한 번 쓰고 지움).
const KEY = "kkachi_login_next";

export function setLoginNext(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // 저장 불가 환경(시크릿 모드 등)이면 로그인 후 홈으로
  }
}

/** 로그인 직후 한 번만 꺼내 쓴다. 상대 경로만 허용(open redirect 방지), 없으면 "/" */
export function takeLoginNext(): string {
  let v = "";
  try {
    v = sessionStorage.getItem(KEY) ?? "";
    sessionStorage.removeItem(KEY);
  } catch {
    // 무시
  }
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}
