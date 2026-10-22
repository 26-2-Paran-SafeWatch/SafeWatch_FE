// 앱 전체 스타일. React Native 에는 CSS 파일이 없어서 이 파일이 그 역할을 한다.
// 폰에는 브라우저가 없어 CSS 를 못 읽는다. 대신 StyleSheet 를 쓰면 웹·폰 양쪽에 똑같이 적용된다.
// 문법은 CSS 와 거의 같고 이름만 camelCase 다 (background-color → backgroundColor).
import { Platform, StyleSheet } from 'react-native';

// 테슬라 앱처럼 검정 바탕에 흰 글씨를 쓰고, 색은 위험을 알릴 때만 쓴다.
export const C = {
  bg: '#000000',
  card: '#0e0e10',
  line: '#1f1f23',
  text: '#f5f5f7',
  dim: '#8a8a90',
  faint: '#4a4a50',
  red: '#e82127', // 위험 (80 이상)
  amber: '#f5a623', // 주의 (60 이상)
  blue: '#3e6ae1', // 낮음 · 미확인 표시
  green: '#30d158', // 서버 연결 정상
};

// 웹은 Inter 가 있으면 쓰고, 없으면 기기 기본 글꼴. 폰은 기본 글꼴(iOS 는 SF)로 둔다.
const font = Platform.select({ web: 'Inter, -apple-system, "Helvetica Neue", Arial, sans-serif', default: undefined });
const t = { fontFamily: font, color: C.text };

// 라벨은 영문 대문자 + 넓은 자간. 테슬라 느낌의 핵심.
const label = { ...t, color: C.dim, fontSize: 11, fontWeight: '600', letterSpacing: 3 };

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  // 웹 넓은 화면에서도 폰 폭으로 가운데 정렬
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 48 },

  // ponytail: 노치 영역은 고정 여백으로 피한다. 기기별로 어긋나면 react-native-safe-area-context 로 바꾼다.
  top: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'web' ? 28 : 60,
  },
  brand: { ...t, fontSize: 13, fontWeight: '700', letterSpacing: 7 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { ...label, fontSize: 10, letterSpacing: 2 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  userName: { ...t, color: C.dim, fontSize: 13 },
  logout: { ...label, color: C.faint, fontSize: 10, letterSpacing: 2 },

  hero: { marginTop: 44 },
  heroNum: { ...t, fontSize: 120, fontWeight: '200', lineHeight: 128, letterSpacing: -6 },
  heroLabel: { ...label, marginTop: 4 },

  stats: {
    flexDirection: 'row', marginTop: 36, paddingVertical: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: C.line },
  statNum: { ...t, fontSize: 26, fontWeight: '300' },
  statLabel: { ...label, color: C.faint, fontSize: 10, letterSpacing: 2, marginTop: 6 },

  section: { ...label, marginTop: 36, marginBottom: 14 },

  card: {
    backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.line,
    padding: 20, marginBottom: 12, overflow: 'hidden',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: C.red },

  scoreBox: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  ping: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 1.5 },
  scoreNum: { ...t, fontSize: 34, fontWeight: '200', letterSpacing: -1 },

  body: { flex: 1 },
  tag: { ...label, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, marginBottom: 5 },
  riskType: { ...t, fontSize: 18, fontWeight: '500' },
  meta: { ...t, color: C.dim, fontSize: 13, marginTop: 4 },

  pill: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  pillText: { ...t, fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  track: { height: 2, backgroundColor: C.line, borderRadius: 1, marginTop: 18, overflow: 'hidden' },
  fill: { height: 2, borderRadius: 1 },

  skeleton: { height: 118 },

  error: {
    marginTop: 20, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: C.red, backgroundColor: 'rgba(232,33,39,0.08)',
  },
  errorText: { ...t, color: '#ff6b6b', fontSize: 13 },
  empty: { ...t, color: C.dim, textAlign: 'center', marginTop: 40, letterSpacing: 1 },
});

// 상세 화면 (EventDetail.js)
export const d = StyleSheet.create({
  // 목록 위에 겹쳐 띄운다. 목록은 그대로 남아 있어서 돌아오면 스크롤 위치가 유지된다.
  screen: { ...StyleSheet.absoluteFillObject, backgroundColor: C.bg },
  back: { ...label, color: C.text, fontSize: 12 },

  head: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 36, marginBottom: 24 },
  title: { ...t, fontSize: 30, fontWeight: '300' },
  score: { ...t, fontSize: 64, fontWeight: '200', lineHeight: 68, letterSpacing: -3 },

  video: {
    width: '100%', aspectRatio: 16 / 9, backgroundColor: '#050506', borderRadius: 20,
    borderWidth: 1, borderColor: C.line, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  videoView: { ...StyleSheet.absoluteFillObject },
  videoFail: { alignItems: 'center', paddingHorizontal: 24 },
  videoMsg: { ...label, color: C.dim, letterSpacing: 2 },
  videoUrl: { ...t, color: C.faint, fontSize: 11, marginTop: 8 },
  rec: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
  recText: { ...label, color: C.text, fontSize: 10, letterSpacing: 2 },

  info: { marginTop: 28, marginBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line,
  },
  infoLabel: { ...label, color: C.faint, fontSize: 10 },
  infoValue: { ...t, fontSize: 15, fontWeight: '400' },

  actions: { flexDirection: 'row', gap: 12 },
  btn: { height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { ...t, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
});

// 소개 화면 (Landing.js) · 로그인 화면 (Login.js)
export const l = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, overflow: 'hidden', justifyContent: 'center' },
  glow: { position: 'absolute' },
  center: { alignItems: 'center', paddingHorizontal: 24 },

  eyebrow: { ...label, textAlign: 'center' },
  headline: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, marginTop: 18, maxWidth: 640 },
  word: { ...t, fontSize: 52, fontWeight: '300', lineHeight: 64, letterSpacing: -1.5 },
  accent: { color: C.red, fontWeight: '500', textShadowColor: 'rgba(232,33,39,0.6)', textShadowRadius: 24 },
  sub: { ...t, color: C.dim, fontSize: 16, lineHeight: 26, textAlign: 'center', marginTop: 22 },

  ctaWrap: { marginTop: 44, alignItems: 'center', justifyContent: 'center' },
  ctaRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 1, borderColor: C.text },
  cta: { backgroundColor: C.text, borderRadius: 999, paddingHorizontal: 40, paddingVertical: 18 },
  ctaText: { ...t, color: '#000', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  features: { flexDirection: 'row', marginTop: 64 },
  feature: { alignItems: 'center', paddingHorizontal: 20 },
  featureLine: { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: C.faint },
  featureTag: { ...label, color: C.faint, fontSize: 9, letterSpacing: 2.5 },
  featureLabel: { ...t, fontSize: 13, marginTop: 6 },

  footer: { ...label, color: C.faint, fontSize: 9, letterSpacing: 2.5, textAlign: 'center', position: 'absolute', bottom: 28, left: 0, right: 0 },

  form: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: 24 },
  formBack: { position: 'absolute', top: -80, left: 24 },
  formTitle: { ...t, fontSize: 40, fontWeight: '300', textAlign: 'center', marginTop: 10, marginBottom: 36 },
  field: { marginBottom: 16 },
  fieldLabel: { ...label, color: C.faint, fontSize: 10, marginBottom: 8 },
  input: {
    ...t, fontSize: 16, height: 54, paddingHorizontal: 18, borderRadius: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.line, outlineStyle: 'none',
  },
  inputFocused: { borderColor: C.text },
  formError: { ...t, color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  submit: { height: 56, borderRadius: 14, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText: { ...t, color: '#000', fontSize: 16, fontWeight: '600' },
  switch: { ...t, color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 24 },
  switchLink: { color: C.text, fontWeight: '600' },
});
