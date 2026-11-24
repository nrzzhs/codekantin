import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import type { Profile } from './lib/types';
import { font, warna } from './lib/tema';
import { SimulatorProvider } from './context/SimulatorContext';
import { BankSoalProvider } from './context/BankSoalContext';
import { LayarSplash } from './components/Loading';
import LoginScreen from './screens/LoginScreen';
import NicknameScreen from './screens/NicknameScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import BerandaScreen from './screens/BerandaScreen';
import AntreanScreen from './screens/AntreanScreen';
import TumpukanScreen from './screens/TumpukanScreen';
import TebakScreen from './screens/TebakScreen';
import ProfilScreen from './screens/ProfilScreen';
import BandingkanScreen from './screens/BandingkanScreen';
import KelolaSoalScreen from './screens/KelolaSoalScreen';
import FormSoalScreen from './screens/FormSoalScreen';

// Tahan splash bawaan sampai font selesai dimuat
SplashScreen.preventAutoHideAsync().catch(() => {});

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type NamaIkon = ComponentProps<typeof Ionicons>['name'];

function IkonTab({ aktif, pasif, fokus }: { aktif: NamaIkon; pasif: NamaIkon; fokus: boolean }) {
  return (
    <View style={[styles.pilIkon, fokus && styles.pilIkonAktif]}>
      <Ionicons name={fokus ? aktif : pasif} size={24} color={fokus ? warna.hijauTua : warna.teksRedup} />
    </View>
  );
}

/** Opsi tab: ikon terisi di dalam pil hijau saat aktif, ikon garis saat tidak. */
function opsiTab(aktif: NamaIkon, pasif: NamaIkon, judul?: string): BottomTabNavigationOptions {
  return {
    ...(judul ? { title: judul } : null),
    tabBarIcon: ({ focused }) => <IkonTab aktif={aktif} pasif={pasif} fokus={focused} />,
    tabBarLabel: ({ focused, children }) => (
      <Text style={[styles.labelTab, focused ? styles.labelTabAktif : styles.labelTabPasif]}>
        {children}
      </Text>
    ),
  };
}

type TabsProps = {
  userId: string;
  email: string;
  profile: Profile;
  isGuru: boolean;
  muatProfil: () => Promise<void>;
};

function Tabs({ userId, email, profile, isGuru, muatProfil }: TabsProps) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: warna.hijauTua,
        tabBarInactiveTintColor: warna.teksRedup,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: warna.garis,
          height: 64 + insets.bottom,
        },
        tabBarItemStyle: { minHeight: 44, paddingTop: 6 },
        tabBarIconStyle: { width: 56, height: 32 },
      }}
    >
      <Tab.Screen name="Beranda" options={opsiTab('home', 'home-outline')}>
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
      <Tab.Screen name="Antrean" component={AntreanScreen} options={opsiTab('people', 'people-outline')} />
      <Tab.Screen name="Tumpukan" component={TumpukanScreen} options={opsiTab('layers', 'layers-outline')} />
      <Tab.Screen name="Tebak" options={opsiTab('locate', 'locate-outline')}>
        {() => <TebakScreen onProfilBerubah={muatProfil} />}
      </Tab.Screen>
      {isGuru && (
        <Tab.Screen name="Kelola" options={opsiTab('document-text', 'document-text-outline', 'Soal')}>
          {() => <KelolaSoalScreen userId={userId} />}
        </Tab.Screen>
      )}
      <Tab.Screen name="Profil" options={opsiTab('person', 'person-outline')}>
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

  const [fontSiap, fontGalat] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });
  // Kalau font gagal dimuat, aplikasi tetap jalan dengan font bawaan
  const fontSelesai = fontSiap || fontGalat != null;

  useEffect(() => {
    if (fontSelesai) SplashScreen.hideAsync().catch(() => {});
  }, [fontSelesai]);

  const muatProfil = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, full_name, school, grade, bio, avatar_url, total_xp, total_points, role')
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

  // Splash bawaan masih tampil selama font dimuat
  if (!fontSelesai) return null;

  function layar() {
    if (checking) return <LayarSplash />;

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
    const isGuru = profile.role === 'guru';

    return (
      <BankSoalProvider>
        <SimulatorProvider userId={userId}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Tabs" options={{ headerShown: false }}>
                {() => (
                  <Tabs
                    userId={userId}
                    email={session.user.email ?? ''}
                    profile={profile}
                    isGuru={isGuru}
                    muatProfil={() => muatProfil(userId)}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Bandingkan"
                component={BandingkanScreen}
                options={{
                  title: 'Bandingkan Stack vs Queue',
                  // Layar ini punya header sendiri dengan tombol kembali
                  headerShown: false,
                }}
              />
              {isGuru && (
                <Stack.Screen
                  name="FormSoal"
                  component={FormSoalScreen}
                  options={({ route }: { route: { params?: any } }) => ({
                    title: route.params?.soal ? 'Ubah Soal' : 'Soal Baru',
                    headerStyle: { backgroundColor: warna.latar },
                    headerShadowVisible: false,
                  })}
                />
              )}
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </SimulatorProvider>
      </BankSoalProvider>
    );
  }

  // Provider di paling luar agar layar Login, Nickname, dan Reset juga bisa membaca safe area
  return <SafeAreaProvider>{layar()}</SafeAreaProvider>;
}

const styles = StyleSheet.create({
  pilIkon: {
    width: 56,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilIkonAktif: { backgroundColor: warna.hijauMuda },
  labelTab: { fontSize: 11, marginTop: 2 },
  labelTabAktif: { fontFamily: font.tebal, color: warna.hijauTua },
  labelTabPasif: { fontFamily: font.semi, color: warna.teksRedup },
});
