// 로그인 · 회원가입 화면. 아래 문구를 누르면 두 모드가 바뀐다.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { api, setToken } from './api';
import { ND } from './common';
import { C, l, d } from './styles';

function Field({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={l.field}>
      <Text style={l.fieldLabel}>{label}</Text>
      <TextInput
        style={[l.input, focused && l.inputFocused]}
        placeholderTextColor={C.faint}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

export default function Login({ onBack, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const enter = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const signup = mode === 'signup';

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, []);

  // 실패하면 입력칸이 좌우로 흔들린다
  const doShake = () => Animated.sequence(
    [12, -12, 8, -8, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 60, useNativeDriver: ND })),
  ).start();

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const creds = { email: email.trim(), password };
      // 가입이 끝나면 같은 값으로 바로 로그인까지 해서 한 번에 들어간다
      if (signup) await api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ ...creds, displayName: name.trim() || null }) });
      const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(creds) });
      setToken(res.accessToken);
      onLogin(res.user);
    } catch (e) {
      setError(e.message);
      doShake();
      setBusy(false);
    }
  };

  const switchMode = () => { setMode(signup ? 'login' : 'signup'); setError(null); };
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <KeyboardAvoidingView style={l.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[l.form, { opacity: enter, transform: [{ translateY }] }]}>
        <Pressable onPress={onBack} hitSlop={12} style={l.formBack}>
          <Text style={d.back}>‹  BACK</Text>
        </Pressable>

        <Text style={l.eyebrow}>{signup ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</Text>
        <Text style={l.formTitle}>{signup ? '회원가입' : '로그인'}</Text>

        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          {signup && <Field label="NAME" placeholder="이름 (선택)" value={name} onChangeText={setName} />}
          <Field label="EMAIL" placeholder="you@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Field
            label="PASSWORD"
            placeholder={signup ? '8자 이상' : '비밀번호'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            returnKeyType="go"
          />
        </Animated.View>

        {error && <Text style={l.formError}>{error}</Text>}

        <Pressable onPress={submit} disabled={busy}>
          {({ pressed }) => (
            <View style={[l.submit, (pressed || busy) && { opacity: 0.7 }]}>
              <Text style={l.submitText}>{busy ? '잠시만요…' : signup ? '가입하고 시작하기' : '로그인'}</Text>
            </View>
          )}
        </Pressable>

        <Pressable onPress={switchMode} hitSlop={8}>
          <Text style={l.switch}>
            {signup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
            <Text style={l.switchLink}>{signup ? '로그인' : '회원가입'}</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
