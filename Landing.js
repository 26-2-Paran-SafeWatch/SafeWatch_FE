// 앱을 열면 처음 보이는 소개 화면. 검정 바탕 위로 빨강·파랑 빛이 천천히 떠다닌다.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { ND, useLoop } from './common';
import { l } from './styles';

// 떠다니는 빛 한 덩이. 작은 원에 큰 그림자를 줘서 번지게 만든다.
function Glow({ color, size, top, left, dx, dy, duration }) {
  const v = useLoop(duration);
  const move = (d) => v.interpolate({ inputRange: [0, 1], outputRange: [-d, d] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[l.glow, {
        width: size, height: size, borderRadius: size / 2, top, left, backgroundColor: color,
        boxShadow: `0 0 ${size * 1.2}px ${size * 0.8}px ${color}`,
        transform: [{ translateX: move(dx) }, { translateY: move(dy) }],
      }]}
    />
  );
}

// 마운트되면 delay 뒤에 아래에서 떠오르며 나타난다.
function Rise({ delay, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 800, delay, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, []);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

const HEADLINE = [
  { word: '앞차의' },
  { word: '위험을', accent: true },
  { word: '먼저' },
  { word: '봅니다' },
];
const FEATURES = [
  { tag: 'DETECT', label: '실시간 감지' },
  { tag: 'ALERT', label: '즉시 알림' },
  { tag: 'REPORT', label: '원클릭 신고' },
];

export default function Landing({ onStart }) {
  const ring = useLoop(1400);
  const press = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(press, { toValue: v, speed: 40, bounciness: 8, useNativeDriver: ND }).start();
  const wordsDone = 300 + HEADLINE.length * 140;

  return (
    <View style={l.screen}>
      <Glow color="rgba(232,33,39,0.45)" size={180} top="18%" left="8%" dx={40} dy={30} duration={6000} />
      <Glow color="rgba(62,106,225,0.45)" size={200} top="48%" left="62%" dx={50} dy={40} duration={7500} />
      <Glow color="rgba(140,60,200,0.30)" size={140} top="70%" left="18%" dx={30} dy={45} duration={9000} />

      <View style={l.center}>
        <Rise delay={100}>
          <Text style={l.eyebrow}>EDGE AI · 위험운전 감지</Text>
        </Rise>

        {/* 제목은 단어 하나씩 차례로 떠오른다 */}
        <View style={l.headline}>
          {HEADLINE.map((h, i) => (
            <Rise key={h.word} delay={300 + i * 140}>
              <Text style={[l.word, h.accent && l.accent]}>{h.word}</Text>
            </Rise>
          ))}
        </View>

        <Rise delay={wordsDone}>
          <Text style={l.sub}>
            차량 카메라와 Edge AI가 전방 차량의 음주·난폭운전을{'\n'}실시간으로 감지하고, 위험을 바로 알려드립니다.
          </Text>
        </Rise>

        <Rise delay={wordsDone + 200} style={l.ctaWrap}>
          {/* 버튼 뒤에서 퍼져 나가는 빛 테두리 */}
          <Animated.View
            pointerEvents="none"
            style={[l.ctaRing, {
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [{ scaleX: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                { scaleY: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
            }]}
          />
          <Pressable onPress={onStart} onPressIn={() => to(0.95)} onPressOut={() => to(1)}>
            <Animated.View style={[l.cta, { transform: [{ scale: press }] }]}>
              <Text style={l.ctaText}>시작하기  →</Text>
            </Animated.View>
          </Pressable>
        </Rise>

        <Rise delay={wordsDone + 500} style={l.features}>
          {FEATURES.map((f, i) => (
            <View key={f.tag} style={[l.feature, i > 0 && l.featureLine]}>
              <Text style={l.featureTag}>{f.tag}</Text>
              <Text style={l.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </Rise>
      </View>

      <Text style={l.footer}>SAFEWATCH · 2026 아주대 파란학기</Text>
    </View>
  );
}
