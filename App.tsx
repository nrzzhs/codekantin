import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { Profile } from './lib/types';
import { warna } from './lib/tema';
import LoginScreen from './screens/LoginScreen';
import NicknameScreen from './screens/NicknameScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import BerandaScreen from './screens/BerandaScreen';
import AntreanScreen from './screens/AntreanScreen';
import TumpukanScreen from './screens/TumpukanScreen';
import TebakScreen from './screens/TebakScreen';
import ProfilScreen from './screens/ProfilScreen';
import BandingkanScreen from './screens/BandingkanScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Ikon({ emoji, fokus }: { emoji: string; fokus: boolean }) {
  return <Text style={{ fontSize: 20, opacity: fokus ? 1 : 0.5 }}>{emoji}</Text>;
}

type TabsProps = {
  userId: string;
  email: string;
  profile: Profile;
  muatProfil: () => Promise<void>;
};

function Tabs({ userId, email, profile, muatProfil }: TabsProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C2410C',
        tabBarStyle: { backgroundColor: '#FFFDF9' },
      }}
    >
      <Tab.Screen
        name="Beranda"
        options={{ tabBarIcon: ({ focused }) => <Ikon emoji="🏠" fokus={focused} /> }}
      >
        {() => (
          <BerandaScreen
            nickname={profile.nickname}
            avatarUrl={profile.avatar_url}
            points={profile.total_points}
            xp={profile.total_xp}
            onRefresh={muatProfil}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Antrean"
        component={AntreanScreen}
        options={{ tabBarIcon: ({ focused }) => <Ikon emoji="🧾" fokus={focused} /> }}
      />
      <Tab.Screen
        name="Tumpukan"
        component={TumpukanScreen}
        options={{ tabBarIcon: ({ focused }) => <Ikon emoji="🍽️" fokus={focused} /> }}
      />
      <Tab.Screen
        name="Tebak"
        component={TebakScreen}
        options={{ tabBarIcon: ({ focused }) => <Ikon emoji="🎯" fokus={focused} /> }}
      />
      <Tab.Screen
        name="Profil"
        options={{ tabBarIcon: ({ focused }) => <Ikon emoji="👤" fokus={focused} /> }}
      >
        {() => (
          <ProfilScreen
            userId={userId}
            email={email}
            profile={profile}
            onUpdated={muatProfil}
            onLogout={() => supabase.auth.signOut()}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [showReset, setShowReset] = useState(false);

  const muatProfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, full_name, school, grade, bio, avatar_url, total_xp, total_points')
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

  // Harus sebelum cek session, karena verifikasi kode membuat sesi login otomatis
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

  const userId = session.user.id;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" options={{ headerShown: false }}>
            {() => (
              <Tabs
                userId={userId}
                email={session.user.email ?? ''}
                profile={profile}
                muatProfil={() => muatProfil(userId)}
              />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Bandingkan"
            component={BandingkanScreen}
            options={{
              title: 'Bandingkan Stack vs Queue',
              headerStyle: { backgroundColor: warna.latar },
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: warna.latar, alignItems: 'center', justifyContent: 'center' },
});