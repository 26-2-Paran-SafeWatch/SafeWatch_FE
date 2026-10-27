// 앱 전체 스타일. React Native 에는 CSS 파일이 없어서 이 파일이 그 역할을 한다.
// 폰에는 브라우저가 없어 CSS 를 못 읽는다. 대신 StyleSheet 를 쓰면 웹·폰 양쪽에 똑같이 적용된다.
// 문법은 CSS 와 거의 같고 이름만 camelCase 다 (background-color → backgroundColor).
//
// 테마가 두 개다. 06:00~18:00 은 주간(밝은 색), 18:00~06:00 은 야간(검정). 아이폰 자동 다크모드처럼.
// 컴포넌트에서는 const { C, s } = useTheme(); 로 꺼내 쓴다. 시각이 바뀌면 화면이 알아서 다시 그려진다.
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

// 위험을 알리는 색은 두 테마가 같다. 색의 뜻이 시간에 따라 바뀌면 안 되므로.
export const ACCENT = {
  red: '#e82127', // 위험 (80 이상)
  amber: '#f5a623', // 주의 (60 이상)
  blue: '#3e6ae1', // 낮음 · 미확인 표시
  green: '#30d158', // 서버 연결 정상
  gray: '#8a8a90', // 무시함
};

// 야간 — 테슬라 앱처럼 검정 바탕에 흰 글씨, 색은 위험을 알릴 때만.
const DARK = {
  ...ACCENT,
  bg: '#000000', card: '#0e0e10', line: '#1f1f23',
  text: '#f5f5f7', dim: '#8a8a90', faint: '#4a4a50',
  danger: '#ff6b6b', backdrop: 'rgba(0,0,0,0.75)', shadow: null,
};

// 주간 — 애플 기본 밝은 화면 색. 흰 카드에 옅은 그림자로 바탕과 구분한다.
const LIGHT = {
  ...ACCENT,
  bg: '#f5f5f7', card: '#ffffff', line: '#e3e3e8',
  text: '#111114', dim: '#6e6e73', faint: '#a1a1a6',
  danger: '#d70015', backdrop: 'rgba(0,0,0,0.35)', shadow: '0 2px 12px rgba(0,0,0,0.06)',
};

// 웹은 Inter 가 있으면 쓰고, 없으면 기기 기본 글꼴. 폰은 기본 글꼴(iOS 는 SF)로 둔다.
const font = Platform.select({ web: 'Inter, -apple-system, "Helvetica Neue", Arial, sans-serif', default: undefined });

// 색표(C)를 받아 화면별 스타일 묶음을 만든다. 테마마다 한 번씩, 앱이 켜질 때 미리 만들어 둔다.
function build(C) {
  const t = { fontFamily: font, color: C.text };

  // 라벨은 영문 대문자 + 넓은 자간. 테슬라 느낌의 핵심.
  const label = { ...t, color: C.dim, fontSize: 11, fontWeight: '600', letterSpacing: 3 };

  const s = StyleSheet.create({
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
      padding: 20, marginBottom: 12, overflow: 'hidden', ...(C.shadow && { boxShadow: C.shadow }),
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
    errorText: { ...t, color: C.danger, fontSize: 13 },
    empty: { ...t, color: C.dim, textAlign: 'center', marginTop: 40, letterSpacing: 1 },
  });

  // 상세 화면 (EventDetail.js)
  const d = StyleSheet.create({
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
    videoMsg: { ...label, color: '#8a8a90', letterSpacing: 2 },
    videoUrl: { ...t, color: '#5a5a60', fontSize: 11, marginTop: 8 },
    rec: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
    recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.red },
    recText: { ...label, color: '#f5f5f7', fontSize: 10, letterSpacing: 2 }, // 영상 칸은 늘 검정

    info: { marginTop: 28, marginBottom: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line,
    },
    infoLabel: { ...label, color: C.faint, fontSize: 10 },
    infoValue: { ...t, fontSize: 15, fontWeight: '400' },

    actions: { flexDirection: 'row', gap: 12 },
    finalNote: { ...t, color: C.dim, fontSize: 13, textAlign: 'center', flex: 1, paddingVertical: 18 },

    retention: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingHorizontal: 4 },
    retentionDay: { ...t, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    retentionText: { ...t, color: C.dim, fontSize: 12, flex: 1 },

    backdrop: { flex: 1, backgroundColor: C.backdrop, alignItems: 'center', justifyContent: 'center', padding: 24 },
    dialog: {
      width: '100%', maxWidth: 380, backgroundColor: C.card, borderRadius: 24, padding: 24,
      borderWidth: 1, borderColor: 'rgba(232,33,39,0.4)', boxShadow: '0 0 60px rgba(232,33,39,0.25)',
    },
    dialogTitle: { ...t, fontSize: 22, fontWeight: '400', textAlign: 'center', lineHeight: 30, marginTop: 4 },
    dialogBody: { ...t, color: C.dim, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 14, marginBottom: 24 },
    btn: { height: 54, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    btnText: { ...t, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
  });

  // 소개 화면 (Landing.js) · 로그인 화면 (Login.js)
  const l = StyleSheet.create({
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
    ctaText: { ...t, color: C.bg, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

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
    formError: { ...t, color: C.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },
    submit: { height: 56, borderRadius: 14, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    submitText: { ...t, color: C.bg, fontSize: 16, fontWeight: '600' },
    switch: { ...t, color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 24 },
    switchLink: { color: C.text, fontWeight: '600' },
  });

  return { C, s, d, l };
}

export const THEMES = { dark: build(DARK), light: build(LIGHT) };
export const ThemeContext = createContext(THEMES.dark);
export const useTheme = () => useContext(ThemeContext);

const modeAt = (date) => (date.getHours() >= 6 && date.getHours() < 18 ? 'light' : 'dark');

// 지금 시각에 맞는 테마 이름. 1분마다 확인해서 06:00 / 18:00 이 되면 바뀐다.
// 웹에서는 주소 끝에 ?theme=dark 나 ?theme=light 를 붙이면 시각과 관계없이 고정된다(낮에 야간 화면 확인용).
export function useTimeMode() {
  const forced = Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('theme') : null;
  const [mode, setMode] = useState(() => modeAt(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setMode(modeAt(new Date())), 60000);
    return () => clearInterval(timer);
  }, []);
  return THEMES[forced] ? forced : mode;
}
