// 백엔드 서버 주소 (도메인 + https, 2026-11-19). 바꿀 일이 생기면 여기 한 곳만 고친다.
// 코드를 안 고치고 바꾸려면 실행할 때 덮어쓴다:  EXPO_PUBLIC_API_URL=https://새주소 npx expo start
// 웹 배포 빌드는 EXPO_PUBLIC_API_URL="" 로 만든다 → 화면과 같은 주소의 /api 로 요청 (nginx 가 넘겨줌)
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://safewatch.co.kr';

// 로그인하면 받은 토큰. 이후 요청에 자동으로 붙는다.
// ponytail: 메모리에만 둔다 → 앱을 끄면 로그아웃. 로그인 유지가 필요하면 expo-secure-store 에 저장.
let token = null;
export const setToken = (t) => { token = t; };

// 로그인한 상태에서 서버가 401 을 주면(토큰 만료 2시간, 위조 등) 부를 함수. App 이 로그인 화면으로 연결한다.
// 로그인 화면의 "비밀번호 틀림" 401 은 토큰이 없을 때라 여기 걸리지 않는다.
let onExpired = () => {};
export const setOnExpired = (fn) => { onExpired = fn; };

// 서버에 요청을 보내고 JSON 을 돌려준다.
// 실패하면 서버가 보낸 사유 문구를 그대로 에러로 던진다 — 화면에 그대로 띄우면 된다.
// 입력값 검증 실패(400)는 detail 이 뭉뚱그린 문구라, 칸별 사유(errors)의 첫 번째를 쓴다.
export async function api(path, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* JSON 이 아닌 응답 */ }
  if (res.status === 401 && token) {
    token = null;
    onExpired();
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요');
  }
  if (!res.ok) {
    const fieldError = body?.errors && Object.values(body.errors)[0];
    throw new Error(fieldError ?? body?.detail ?? `요청 실패 (${res.status})`);
  }
  return body;
}
