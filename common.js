// 목록 화면과 상세 화면이 함께 쓰는 값과 함수
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { ACCENT as C } from './styles';

// 위험 종류 → 화면 이름. 값은 AI 이벤트 스키마(SafeWatch_AI docs/event-schema.md v0.7)의 risk.types.
// 모두 NHTSA 음주운전 차로 유지 단서다. 한 이벤트에 보통 2개 이상 붙는다.
export const RISK = {
  lane_departure: { label: '차선 걸침', tag: 'LANE' },
  weaving: { label: '사행 운전', tag: 'WEAVE' },
  swerving: { label: '급격한 횡이동', tag: 'SWERVE' },
  drifting: { label: '한쪽 쏠림', tag: 'DRIFT' },
  speed_irregular: { label: '속도 불규칙', tag: 'SPEED' },
};
// 등급은 AI 가 정한다(점수 구간을 앱이 몰라도 되게). 색도 등급으로 고른다.
export const LEVEL = {
  high: { label: '위험 높음', color: C.red },
  medium: { label: '주의', color: C.amber },
  low: { label: '낮음', color: C.blue },
};
export const STATUS = {
  new: { label: '미확인', color: C.blue },
  reviewed: { label: '무시함', color: C.gray },
  reported: { label: '신고함', color: C.red },
};
export const levelOf = (e) => LEVEL[e.riskLevel] ?? LEVEL.low;
export const statusOf = (e) => STATUS[e.status] ?? { label: e.status, color: C.gray };
// 여러 단서를 한 줄로: { label: '차선 걸침 · 사행 운전', tag: 'LANE · WEAVE' }
export function riskOf(e) {
  const r = (e.riskTypes ?? []).map((t) => RISK[t] ?? { label: t, tag: t.toUpperCase() });
  return { label: r.map((x) => x.label).join(' · '), tag: r.map((x) => x.tag).join(' · ') };
}

// 판단 근거 수치(indicators) → [이름, 값] 문장. AI 는 판단에 쓴 수치만 보내므로 있는 것만 보여준다.
const INDICATOR = {
  lane_departure_duration_sec: (v) => ['차선 걸침 지속', `${v}초`],
  lane_offset_max_ratio: (v) => ['최대 차선 침범', `차로 폭의 ${Math.round(v * 100)}%`],
  direction_changes_count: (v) => ['좌우 방향 전환', `${v}회`],
  lateral_velocity_peak_mps: (v) => ['최대 횡이동 속도', `${v} m/s`],
  drift_duration_sec: (v) => ['한쪽 쏠림 지속', `${v}초`],
  // 팽창률의 역수가 최소 TTC(충돌까지 남은 시간) — AI 문서 5.1
  expansion_rate_peak_per_sec: (v) => ['최소 충돌 여유 시간', v > 0 ? `${(1 / v).toFixed(1)}초` : '-'],
};
export const reasonsOf = (e) => Object.entries(e.indicators ?? {})
  .filter(([k]) => INDICATOR[k])
  .map(([k, v]) => INDICATOR[k](v));

// 웹에는 네이티브 애니메이션 모듈이 없어서 JS 로 돌린다.
export const ND = Platform.OS !== 'web';

const pad = (n) => String(n).padStart(2, '0');
export const hhmm = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const formatTime = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${hhmm(iso)}`; };

// 0 ↔ 1 을 계속 오가는 값. 깜빡임·숨쉬기 효과에 쓴다.
export function useLoop(duration, active = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const ease = Easing.inOut(Easing.ease);
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: ease, useNativeDriver: ND }),
      Animated.timing(v, { toValue: 0, duration, easing: ease, useNativeDriver: ND }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [active]);
  return v;
}
