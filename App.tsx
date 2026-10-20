import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import NicknameScreen from './screens/NicknameScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

type Profile = { nickname: string; total_xp: number; total_points: number };

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [showReset, setShowReset] = useState(false);

  const muatProfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, total_xp, total_points')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await muatProfil(data.session.user.id);
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) muatProfil(newSession.user.id);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, [muatProfil]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showReset) {
    return <ResetPasswordScreen onDone={() => setShowReset(false)} />;
  }

  if (!session) return <LoginScreen onForgot={() => setShowReset(true)} />;

  if (!profile) {
    return (
      <NicknameScreen
        userId={session.user.id}
        onSaved={() => muatProfil(session.user.id)}
      />
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Halo, {profile.nickname} 👋</Text>
      <Text>⭐ {profile.total_points} poin · ⚡ {profile.total_xp} XP</Text>
      <TouchableOpacity style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Keluar</Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#FFF8E7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  button: { backgroundColor: '#DC2626', borderRadius: 12, padding: 12, marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600' },
});