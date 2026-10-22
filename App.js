import { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { api, setToken } from './api';
import { ND, formatTime, hhmm, riskOf, scoreColor, statusOf, useLoop } from './common';
import EventDetail from './EventDetail';
import Landing from './Landing';
import Login from './Login';
import { C, s } from './styles';

// 숫자가 바뀌면 이전 값에서 새 값까지 올라가며 보여준다.
function useCountUp(target, ms = 900) {
  const [value, setValue] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const from = current.current;
    const start = Date.now();
    let raf;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / ms);
      current.current = Math.round(from + (target - from) * (1 - (1 - p) ** 3));
      setValue(current.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function LiveBadge({ ok }) {
  const v = useLoop(800);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] });
  return (
    <View style={s.live}>
      <Animated.View style={[s.liveDot, { backgroundColor: ok ? C.green : C.red, opacity }]} />
      <Text style={s.liveText}>{ok ? 'LIVE' : 'OFFLINE'}</Text>
    </View>
  );
}

function ErrorBanner({ message }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(v, { toValue: 1, useNativeDriver: ND }).start(); }, []);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] });
  return (
    <Animated.View style={[s.error, { opacity: v, transform: [{ translateY }] }]}>
      <Text style={s.errorText}>서버에 연결할 수 없습니다 — {message}</Text>
    </Animated.View>
  );
}

function Stat({ value, label }) {
  return (
    <View style={s.stat}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Header({ events, error, user, onLogout }) {
  const list = events ?? [];
  const unreviewed = useCountUp(list.filter((e) => e.status === 'new').length);
  const total = useCountUp(list.length);
  const max = useCountUp(list.reduce((m, e) => Math.max(m, e.riskScore), 0));
  return (
    <View>
      <View style={s.top}>
        <Text style={s.brand}>SAFEWATCH</Text>
        <LiveBadge ok={!error} />
      </View>
      <View style={s.userRow}>
        <Text style={s.userName}>{user.displayName ?? user.email}</Text>
        <Pressable onPress={onLogout} hitSlop={8}>
          <Text style={s.logout}>LOGOUT</Text>
        </Pressable>
      </View>
      {error && <ErrorBanner message={error} />}
      <View style={s.hero}>
        <Text style={s.heroNum}>{unreviewed}</Text>
        <Text style={s.heroLabel}>미확인 위험 · UNREVIEWED</Text>
      </View>
      <View style={s.stats}>
        <Stat value={total} label="TOTAL" />
        <View style={s.statDivider} />
        <Stat value={max} label="MAX RISK" />
        <View style={s.statDivider} />
        {/* 서버가 받은 시각 최신순으로 주므로 첫 번째가 가장 최근 */}
        <Stat value={list[0] ? hhmm(list[0].detectedAt) : '--:--'} label="LAST" />
      </View>
      <Text style={s.section}>RECENT EVENTS</Text>
    </View>
  );
}

function Skeleton() {
  const v = useLoop(700);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  return [0, 1, 2].map((i) => <Animated.View key={i} style={[s.card, s.skeleton, { opacity }]} />);
}

// fresh: 화면을 연 뒤에 새로 들어온 이벤트. 맨 위로 미끄러져 들어오며 빨갛게 번쩍인다.
function EventCard({ event, index, fresh, onPress }) {
  const enter = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(fresh ? 0.35 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const color = scoreColor(event.riskScore);
  const risk = riskOf(event);
  const status = statusOf(event);
  // 위험도 높은데 아직 확인 안 한 것만 숨쉬듯 빛난다
  const hot = event.riskScore >= 80 && event.status === 'new';
  const pulse = useLoop(1000, hot);

  useEffect(() => {
    const delay = fresh ? 0 : Math.min(index, 8) * 90; // 처음 열 때 위에서부터 차례로
    const out = Easing.out(Easing.cubic);
    Animated.timing(enter, { toValue: 1, duration: 550, delay, easing: out, useNativeDriver: ND }).start();
    Animated.timing(bar, { toValue: event.riskScore, duration: 1100, delay: delay + 250, easing: out, useNativeDriver: false }).start();
    if (fresh) Animated.timing(flash, { toValue: 0, duration: 1800, useNativeDriver: ND }).start();
  }, []);

  const pressTo = (toValue) => Animated.spring(press, { toValue, speed: 40, bounciness: 6, useNativeDriver: ND }).start();
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [fresh ? -30 : 28, 0] });

  return (
    <Pressable onPress={onPress} onPressIn={() => pressTo(0.97)} onPressOut={() => pressTo(1)}>
      <Animated.View style={[s.card, { opacity: enter, transform: [{ translateY }, { scale: press }] }]}>
        <Animated.View pointerEvents="none" style={[s.flash, { opacity: flash }]} />
        <View style={s.cardRow}>
          <View style={s.scoreBox}>
            {hot && (
              <Animated.View
                style={[s.ping, {
                  borderColor: color,
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) }],
                }]}
              />
            )}
            <Text style={[s.scoreNum, { color }]}>{event.riskScore}</Text>
          </View>
          <View style={s.body}>
            <Text style={[s.tag, { color }]}>{risk.tag}</Text>
            <Text style={s.riskType}>{risk.label}</Text>
            <Text style={s.meta}>{event.plateNumber ?? '번호판 미인식'} · {formatTime(event.detectedAt)}</Text>
          </View>
          <View style={[s.pill, { borderColor: status.color }]}>
            <Text style={[s.pillText, { color: status.color === C.faint ? C.dim : status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={s.track}>
          <Animated.View
            style={[s.fill, { backgroundColor: color, width: bar.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function Events({ user, onLogout }) {
  const [events, setEvents] = useState(null); // null = 아직 한 번도 못 받음 (로딩 중)
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState(null); // 상세 화면에 띄운 이벤트 id
  const known = useRef(null); // 지금까지 받은 이벤트 id
  const fresh = useRef(new Set()); // 첫 로딩 이후에 새로 생긴 id

  const load = useCallback(async () => {
    try {
      const data = await api('/api/events');
      if (known.current) data.forEach((e) => !known.current.has(e.id) && fresh.current.add(e.id));
      known.current = new Set(data.map((e) => e.id));
      setEvents(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    // ponytail: 5초마다 다시 받아오는 방식. FCM 푸시가 붙으면 푸시 받을 때만 받아오도록 바꾼다.
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const opened = events?.find((e) => e.id === openId);

  return (
    <View style={s.screen}>
      <FlatList
        data={events ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item, index }) => (
          <EventCard event={item} index={index} fresh={fresh.current.has(item.id)} onPress={() => setOpenId(item.id)} />
        )}
        ListHeaderComponent={<Header events={events} error={error} user={user} onLogout={onLogout} />}
        ListEmptyComponent={events === null
          ? !error && <Skeleton />
          : <Text style={s.empty}>아직 감지된 위험이 없습니다.</Text>}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.dim} />}
      />
      {/* 목록에서 찾아 넘기므로 5초 갱신으로 상태가 바뀌어도 상세 화면에 반영된다 */}
      {opened && (
        <EventDetail
          event={opened}
          onBack={() => setOpenId(null)}
          onChange={(updated) => setEvents((list) => list.map((e) => (e.id === updated.id ? updated : e)))}
        />
      )}
    </View>
  );
}

// 화면 순서: 소개 → 로그인 → 이벤트 목록
export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('landing'); // 로그인 전: 'landing' | 'login'

  const logout = () => { setToken(null); setUser(null); setScreen('landing'); };

  return (
    <>
      {user ? <Events user={user} onLogout={logout} />
        : screen === 'login' ? <Login onBack={() => setScreen('landing')} onLogin={setUser} />
        : <Landing onStart={() => setScreen('login')} />}
      <StatusBar style="light" />
    </>
  );
}
