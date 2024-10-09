import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { UserSelectionModal } from '@/components/UserSelectionModal';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { currentUser, changeUser, availableUsers } = useCurrentUser();
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsUserModalVisible(true)} style={styles.avatarContainer}>
              <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            </TouchableOpacity>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
            ),
          }}
        />
      </Tabs>
      <UserSelectionModal
        isVisible={isUserModalVisible}
        onClose={() => setIsUserModalVisible(false)}
        users={availableUsers}
        onSelectUser={(userId) => {
          changeUser(userId);
          setIsUserModalVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
