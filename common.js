// 목록 화면과 상세 화면이 함께 쓰는 값과 함수
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { ACCENT as C } from './styles';

// 서버 값(DB CHECK 제약과 같은 값) → 화면에 보일 이름과 영문 태그
export const RISK = {
  drunk_suspect: { label: '음주 의심', tag: 'DUI' },
  lane_departure: { label: '차선 이탈', tag: 'LANE' },
  sudden_accel: { label: '급가속', tag: 'ACCEL' },
  swerving: { label: '사행 운전', tag: 'SWERVE' },
};
export const STATUS = {
  new: { label: '미확인', color: C.blue },
  reviewed: { label: '무시함', color: C.gray },
  reported: { label: '신고함', color: C.red },
};
export const riskOf = (e) => RISK[e.riskType] ?? { label: e.riskType, tag: 'RISK' };
export const statusOf = (e) => STATUS[e.status] ?? { label: e.status, color: C.gray };

// 웹에는 네이티브 애니메이션 모듈이 없어서 JS 로 돌린다.
export const ND = Platform.OS !== 'web';

export function scoreColor(score) {
  if (score >= 80) return C.red;
  if (score >= 60) return C.amber;
  return C.blue;
}

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
