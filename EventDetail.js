// 이벤트를 눌렀을 때 오른쪽에서 밀려 들어오는 상세 화면. 영상 + 감지 정보 + 신고·무시 버튼.
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api } from './api';
import { ND, formatTime, riskOf, scoreColor, statusOf, useLoop } from './common';
import { C, s, d } from './styles';

function Video({ event }) {
  // 웹 브라우저는 소리 있는 영상의 자동재생을 막아서 음소거로 시작한다. 컨트롤에서 소리를 켤 수 있다.
  const player = useVideoPlayer(event.videoUrl ?? null, (p) => { p.loop = true; p.muted = true; p.play(); });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const blink = useLoop(600);
  const failed = !event.videoUrl || status === 'error';

  return (
    <View style={d.video}>
      {!failed && <VideoView player={player} style={d.videoView} contentFit="contain" nativeControls />}
      {/* 블랙박스 화면처럼 왼쪽 위에 녹화 표시와 감지 시각 */}
      <View style={d.rec} pointerEvents="none">
        <Animated.View style={[d.recDot, { opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }) }]} />
        <Text style={d.recText}>REC · {formatTime(event.detectedAt)}</Text>
      </View>
      {status === 'loading' && !failed && <Text style={d.videoMsg}>LOADING</Text>}
      {failed && (
        <View style={d.videoFail}>
          <Text style={d.videoMsg}>영상을 불러올 수 없습니다</Text>
          <Text style={d.videoUrl} numberOfLines={1}>{event.videoUrl ?? '영상 주소 없음'}</Text>
        </View>
      )}
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={d.infoRow}>
      <Text style={d.infoLabel}>{label}</Text>
      <Text style={d.infoValue}>{value}</Text>
    </View>
  );
}

function ActionButton({ title, color, filled, busy, onPress }) {
  const press = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(press, { toValue: v, speed: 40, bounciness: 6, useNativeDriver: ND }).start();
  return (
    <Pressable style={{ flex: 1 }} disabled={busy} onPress={onPress} onPressIn={() => to(0.95)} onPressOut={() => to(1)}>
      <Animated.View style={[d.btn, { borderColor: color, backgroundColor: filled ? color : 'transparent', transform: [{ scale: press }] }]}>
        <Text style={[d.btnText, { color: filled ? '#fff' : color }]}>{busy ? '처리 중…' : title}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function EventDetail({ event, onBack, onChange }) {
  const { width } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const color = scoreColor(event.riskScore);
  const risk = riskOf(event);
  const status = statusOf(event);

  const close = () => Animated.timing(slide, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: ND }).start(onBack);

  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
    // 안드로이드 뒤로가기 버튼
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => sub.remove();
  }, []);

  const setStatus = async (next) => {
    setBusy(next);
    setError(null);
    try {
      onChange(await api(`/api/events/${event.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });

  return (
    <Animated.View style={[d.screen, { transform: [{ translateX }] }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <Pressable onPress={close} hitSlop={12}>
            <Text style={d.back}>‹  BACK</Text>
          </Pressable>
          <View style={[s.pill, { borderColor: status.color }]}>
            <Text style={[s.pillText, { color: status.color === C.faint ? C.dim : status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={d.head}>
          <View style={s.body}>
            <Text style={[s.tag, { color }]}>{risk.tag}</Text>
            <Text style={d.title}>{risk.label}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[d.score, { color }]}>{event.riskScore}</Text>
            <Text style={s.statLabel}>RISK SCORE</Text>
          </View>
        </View>

        <Video event={event} />

        <View style={d.info}>
          <Info label="PLATE" value={event.plateNumber ?? '번호판 미인식'} />
          <Info label="DETECTED" value={formatTime(event.detectedAt)} />
          <Info label="RECEIVED" value={formatTime(event.receivedAt)} />
          <Info
            label="LOCATION"
            value={event.latitude != null ? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}` : '위치 없음'}
          />
          <Info label="DEVICE" value={event.deviceId.slice(0, 8).toUpperCase()} />
        </View>

        {error && <Text style={[s.errorText, { marginBottom: 12 }]}>{error}</Text>}

        <View style={d.actions}>
          {event.status === 'new' ? (
            <>
              <ActionButton title="신고하기" color={C.red} filled busy={busy === 'reported'} onPress={() => setStatus('reported')} />
              <ActionButton title="무시" color={C.dim} busy={busy === 'reviewed'} onPress={() => setStatus('reviewed')} />
            </>
          ) : (
            <ActionButton title="미확인으로 되돌리기" color={C.dim} busy={busy === 'new'} onPress={() => setStatus('new')} />
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}
