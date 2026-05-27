import 'react-native-gesture-handler';

import { useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';
import { DrDoseWordmark } from '../../components/DrDoseWordmark';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/build/react-navigation/drawer';
import { useAuth } from '../../hooks/useAuth';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { OnboardingModal } from '../../components/OnboardingModal';
import { isOnboardingDone } from '../../lib/settings';
import { fetchMedicationsWithStatus } from '../../lib/medications';
import { useReminderBootstrap } from '../../hooks/useReminderBootstrap';

function Hamburger({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open navigation menu"
      style={styles.iconButton}
    >
      <Text style={styles.iconText}>≡</Text>
    </Pressable>
  );
}

function Plus({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add medication"
      style={[styles.iconButton, styles.plusButton]}
    >
      <Text style={[styles.iconText, styles.plusText]}>＋</Text>
    </Pressable>
  );
}

function HeaderTitle({ pageTitle }: { pageTitle: string }) {
  return (
    <View style={styles.titleWrap}>
      <DrDoseWordmark />
      <Text style={styles.pageTitle}>{pageTitle}</Text>
    </View>
  );
}

function DrawerContent(props: Parameters<typeof DrawerItemList>[0]) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerScroll,
        { paddingTop: Math.max(insets.top, spacing.md), paddingBottom: insets.bottom + spacing.md },
      ]}
    >
      <View style={styles.drawerHeader}>
        <ProfileAvatar user={user} size="lg" />
        <View style={styles.drawerUser}>
          <Text style={styles.drawerSignedIn}>Signed in</Text>
          <Text style={styles.drawerEmail} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
        </View>
      </View>

      <DrawerItemList {...props} />

      <Pressable
        onPress={async () => {
          await signOut();
          props.navigation.closeDrawer();
          router.replace('/login');
        }}
        style={styles.signOutRow}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useReminderBootstrap(user?.id);

  useEffect(() => {
    if (!user) return;
    let active = true;

    void (async () => {
      const done = await isOnboardingDone(user.id);
      if (done) return;
      const meds = await fetchMedicationsWithStatus(user.id);
      if (!active) return;
      if (meds.length > 0) {
        const { setOnboardingDone } = await import('../../lib/settings');
        await setOnboardingDone(user.id);
        return;
      }
      setShowOnboarding(true);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const titleByRoute: Record<string, string> = {
    index: 'Today',
    history: 'History',
    tracking: 'Tracking',
    wellness: 'Wellness',
    streaks: 'Streaks',
    account: 'My account',
    'medical-records': 'Medical records',
    help: 'Help & safety',
  };

  return (
    <>
      {user && showOnboarding ? (
        <OnboardingModal
          userId={user.id}
          visible={showOnboarding}
          onDone={() => setShowOnboarding(false)}
        />
      ) : null}
      <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerStyle: styles.header as any,
        headerShadowVisible: true,
        headerTitleAlign: 'center',
        headerLeft: () => <Hamburger onPress={() => navigation.toggleDrawer()} />,
        headerRight: () =>
          route.name === 'index' ? (
            <Plus onPress={() => router.push('/medications/new')} />
          ) : null,
        headerTitle: () => (
          <HeaderTitle pageTitle={titleByRoute[String(route.name)] ?? String(route.name)} />
        ),
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textMuted,
      })}
    >
      <Drawer.Screen name="index" options={{ title: 'Today' }} />
      <Drawer.Screen name="history" options={{ title: 'History' }} />
      <Drawer.Screen name="wellness" options={{ title: 'Wellness' }} />
      <Drawer.Screen name="streaks" options={{ title: 'Streaks' }} />
      <Drawer.Screen name="tracking" options={{ title: 'Tracking' }} />
      <Drawer.Screen name="medical-records" options={{ title: 'Medical records' }} />
      <Drawer.Screen
        name="interactions"
        options={{
          title: 'Interactions',
          // show it in the drawer as “Drug safety check”
          drawerLabel: 'Drug safety check',
        }}
      />
      <Drawer.Screen name="help" options={{ title: 'Help & safety' }} />
      <Drawer.Screen name="account" options={{ title: 'My account' }} />
    </Drawer>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
  },
  drawerScroll: {},
  drawerHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  drawerUser: {
    flex: 1,
    gap: 2,
  },
  drawerSignedIn: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  drawerEmail: {
    color: colors.text,
    fontWeight: '800',
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  iconButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  iconText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  plusButton: {
    paddingRight: spacing.lg,
  },
  plusText: {
    color: colors.accent,
  },
  signOutRow: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.error,
    fontWeight: '900',
  },
});

