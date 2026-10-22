// 백엔드 서버 주소. EC2 를 껐다 켜면 IP 가 바뀌므로 여기 한 곳만 고친다.
// 코드를 안 고치고 바꾸려면 실행할 때 덮어쓴다:  EXPO_PUBLIC_API_URL=http://새주소:8080 npx expo start
// 웹 배포 빌드는 EXPO_PUBLIC_API_URL="" 로 만든다 → 화면과 같은 주소의 /api 로 요청 (nginx 가 넘겨줌)
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://3.34.130.6:8080';

// 로그인하면 받은 토큰. 이후 요청에 자동으로 붙는다.
// ponytail: 메모리에만 둔다 → 앱을 끄면 로그아웃. 로그인 유지가 필요하면 expo-secure-store 에 저장.
let token = null;
export const setToken = (t) => { token = t; };

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
  if (!res.ok) {
    const fieldError = body?.errors && Object.values(body.errors)[0];
    throw new Error(fieldError ?? body?.detail ?? `요청 실패 (${res.status})`);
  }
  return body;
}
