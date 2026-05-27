import 'react-native-gesture-handler';

import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { DrDoseWordmark } from '../../components/DrDoseWordmark';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/build/react-navigation/drawer';
import { useAuth } from '../../hooks/useAuth';
import { ProfileAvatar } from '../../components/ProfileAvatar';
import { OnboardingModal } from '../../components/OnboardingModal';
import { isOnboardingDone } from '../../lib/settings';
import { fetchMedicationsWithStatus } from '../../lib/medications';
import { useReminderBootstrap } from '../../hooks/useReminderBootstrap';
import { useTheme } from '../../context/ThemeProvider';

function Hamburger({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
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

function Plus({
  onPress,
  styles,
}: {
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
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

function HeaderTitle({
  pageTitle,
  styles,
}: {
  pageTitle: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.titleWrap}>
      <DrDoseWordmark />
      <Text style={styles.pageTitle}>{pageTitle}</Text>
    </View>
  );
}

function DrawerContent(
  props: Parameters<typeof DrawerItemList>[0] & { styles: ReturnType<typeof makeStyles> },
) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { styles, ...drawerProps } = props;

  return (
    <DrawerContentScrollView
      {...drawerProps}
      contentContainerStyle={[
        styles.drawerScroll,
        { paddingTop: Math.max(insets.top, spacing.md), paddingBottom: insets.bottom + spacing.md },
      ]}
      style={{ backgroundColor: styles.drawerBg.backgroundColor }}
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

      <DrawerItemList {...drawerProps} />

      <Pressable
        onPress={async () => {
          await signOut();
          drawerProps.navigation.closeDrawer();
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
        drawerContent={(props) => <DrawerContent {...props} styles={styles} />}
        screenOptions={({ navigation, route }) => ({
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: true,
          headerTitleAlign: 'center',
          drawerStyle: { backgroundColor: colors.bg },
          drawerActiveTintColor: colors.accent,
          drawerInactiveTintColor: colors.textMuted,
          drawerActiveBackgroundColor: colors.pendingBg,
          headerLeft: () => (
            <Hamburger onPress={() => navigation.toggleDrawer()} styles={styles} />
          ),
          headerRight: () =>
            route.name === 'index' ? (
              <Plus onPress={() => router.push('/medications/new')} styles={styles} />
            ) : null,
          headerTitle: () => (
            <HeaderTitle
              pageTitle={titleByRoute[String(route.name)] ?? String(route.name)}
              styles={styles}
            />
          ),
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
            drawerLabel: 'Drug safety check',
          }}
        />
        <Drawer.Screen name="help" options={{ title: 'Help & safety' }} />
        <Drawer.Screen name="account" options={{ title: 'My account' }} />
      </Drawer>
    </>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    drawerBg: { backgroundColor: colors.bg },
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
}
