// 이벤트를 눌렀을 때 오른쪽에서 밀려 들어오는 상세 화면. 영상 + 감지 정보 + 신고·무시 버튼.
// 영상 보관·파기 규칙은 서버가 지킨다(노션 9,10주차). 이 화면은 남은 기간을 보여주고 파기 전에 경고만 한다.
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { api } from './api';
import { ND, formatTime, levelOf, reasonsOf, riskOf, statusOf, useLoop } from './common';
import { useTheme } from './styles';

// "15초 · 1280x720 · 블러 처리됨"
const clipSummary = (c) => [c.duration_sec && `${c.duration_sec}초`, c.resolution, c.blurred && '블러 처리됨']
  .filter(Boolean).join(' · ');

function Video({ event }) {
  const { d } = useTheme();
  // 웹 브라우저는 소리 있는 영상의 자동재생을 막아서 음소거로 시작한다. 컨트롤에서 소리를 켤 수 있다.
  const player = useVideoPlayer(event.videoUrl ?? null, (p) => { p.loop = true; p.muted = true; p.play(); });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const blink = useLoop(600);
  const failed = !event.videoUrl || status === 'error';
  const deleted = !!event.videoDeletedAt;

  return (
    <View style={d.video}>
      {!failed && <VideoView player={player} style={d.videoView} contentFit="contain" nativeControls />}
      {/* 블랙박스 화면처럼 왼쪽 위에 녹화 표시와 감지 시각 */}
      <View style={d.rec} pointerEvents="none">
        <Animated.View style={[d.recDot, { opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [1, 0.15] }) }]} />
        <Text style={d.recText}>REC · {formatTime(event.detectedAt)}</Text>
      </View>
      {status === 'loading' && !failed && <Text style={d.videoMsg}>LOADING</Text>}
      {deleted && (
        <View style={d.videoFail}>
          <Text style={d.videoMsg}>영상이 파기되었습니다</Text>
          <Text style={d.videoUrl}>{formatTime(event.videoDeletedAt)} 파기 · 보관 정책에 따라 복구할 수 없습니다</Text>
        </View>
      )}
      {/* 영상 주소가 아직 없음 = 전송 방식(AI 문서 1장)이 정해지기 전이거나, 정차 후 업로드를 기다리는 중 */}
      {!event.videoUrl && !deleted && (
        <View style={d.videoFail}>
          <Text style={d.videoMsg}>{event.clip ? '영상 업로드 대기 중' : '영상 없음'}</Text>
          {event.clip && <Text style={d.videoUrl}>{clipSummary(event.clip)}</Text>}
        </View>
      )}
      {event.videoUrl && status === 'error' && (
        <View style={d.videoFail}>
          <Text style={d.videoMsg}>영상을 불러올 수 없습니다</Text>
          <Text style={d.videoUrl} numberOfLines={1}>{event.videoUrl}</Text>
        </View>
      )}
    </View>
  );
}

// 왜 위험하다고 판단했는지. AI 가 보낸 판단 근거 수치를 문장으로 보여준다(신고서에도 쓸 수 있는 내용).
function Reasons({ event }) {
  const { s, d } = useTheme();
  const reasons = reasonsOf(event);
  if (reasons.length === 0) return null;
  const window = event.indicators?.observation_window_sec;
  return (
    <>
      <Text style={s.section}>WHY · 판단 근거{window ? ` (최근 ${window}초 관측)` : ''}</Text>
      <View style={[d.info, { marginTop: 0 }]}>
        {reasons.map(([label, value]) => <Info key={label} label={label} value={value} />)}
      </View>
    </>
  );
}

// 영상 아래 "D-13 · 11/9 14:03 자동 파기 예정". 사흘 이하로 남으면 빨갛게.
function Retention({ event }) {
  const { C, d } = useTheme();
  if (!event.videoExpiresAt) return null;
  const days = Math.max(0, Math.ceil((new Date(event.videoExpiresAt) - Date.now()) / 86400000));
  const urgent = days <= 3;
  return (
    <View style={d.retention}>
      <Text style={[d.retentionDay, urgent && { color: C.red }]}>D-{days}</Text>
      <Text style={d.retentionText}>{formatTime(event.videoExpiresAt)} 자동 파기 예정 · 영상은 2주간만 보관됩니다</Text>
    </View>
  );
}

// 무시 전 경고. 가운데로 튀어나오며 뜬다.
function ConfirmPurge({ visible, onCancel, onConfirm }) {
  const { C, s, d } = useTheme();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 8, useNativeDriver: ND }).start();
    }
  }, [visible]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={d.backdrop} onPress={onCancel}>
        {/* 카드 안을 눌렀을 때는 닫히지 않게 이벤트를 여기서 멈춘다 */}
        <Pressable onPress={() => {}}>
          <Animated.View style={[d.dialog, { opacity: pop, transform: [{ scale }] }]}>
            <Text style={[s.tag, { color: C.red, textAlign: 'center' }]}>WARNING</Text>
            <Text style={d.dialogTitle}>신고하지 않으면{'\n'}영상이 파기됩니다</Text>
            <Text style={d.dialogBody}>
              무시하면 이 이벤트의 영상이 즉시 삭제되며 되돌릴 수 없습니다.{'\n'}
              신고가 필요하다면 먼저 신고해 주세요.
            </Text>
            <View style={d.actions}>
              <ActionButton title="취소" color={C.dim} onPress={onCancel} />
              <ActionButton title="파기하고 무시" color={C.red} filled onPress={onConfirm} />
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Info({ label, value }) {
  const { d } = useTheme();
  return (
    <View style={d.infoRow}>
      <Text style={d.infoLabel}>{label}</Text>
      <Text style={d.infoValue}>{value}</Text>
    </View>
  );
}

function ActionButton({ title, color, filled, busy, onPress }) {
  const { d } = useTheme();
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
  const { C, s, d } = useTheme();
  const { width } = useWindowDimensions();
  const slide = useRef(new Animated.Value(0)).current;
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const level = levelOf(event);
  const color = level.color;
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
            <Text style={[s.pillText, { color: status.color }]}>{status.label}</Text>
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
        <Retention event={event} />
        <Reasons event={event} />

        <View style={d.info}>
          <Info label="LEVEL" value={level.label} />
          <Info label="SPEED" value={event.speedKmh != null ? `${Math.round(event.speedKmh)} km/h (내 차)` : '-'} />
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
              <ActionButton title="무시" color={C.dim} busy={busy === 'reviewed'} onPress={() => setConfirming(true)} />
            </>
          ) : event.status === 'reviewed' ? (
            // 영상이 이미 파기돼서 되돌려도 의미가 없다
            <Text style={d.finalNote}>무시한 이벤트입니다 · 영상은 파기되었습니다</Text>
          ) : (
            <ActionButton title="미확인으로 되돌리기" color={C.dim} busy={busy === 'new'} onPress={() => setStatus('new')} />
          )}
        </View>
      </ScrollView>
      <ConfirmPurge
        visible={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); setStatus('reviewed'); }}
      />
    </Animated.View>
  );
}
