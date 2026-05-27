import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabLabel({ children }: { children: string }) {
  return <Text style={{ fontSize: 20 }}>{children}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: () => <TabLabel>📅</TabLabel>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <TabLabel>📜</TabLabel>,
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarIcon: () => <TabLabel>📊</TabLabel>,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: () => <TabLabel>👤</TabLabel>,
        }}
      />
    </Tabs>
  );
}
