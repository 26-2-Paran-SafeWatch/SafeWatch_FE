// 백엔드 서버 주소. EC2 를 껐다 켜면 IP 가 바뀌므로 여기 한 곳만 고친다.
// 코드를 안 고치고 바꾸려면 실행할 때 덮어쓴다:  EXPO_PUBLIC_API_URL=http://새주소:8080 npx expo start
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://3.34.130.6:8080';

// 서버에 요청을 보내고 JSON 을 돌려준다.
// 실패하면 서버가 보낸 사유 문구(detail)를 그대로 에러로 던진다 — 화면에 그대로 띄우면 된다.
export async function api(path, options = {}) {
  const res = await fetch(API_URL + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* JSON 이 아닌 응답 */ }
  if (!res.ok) throw new Error(body?.detail ?? `요청 실패 (${res.status})`);
  return body;
}
