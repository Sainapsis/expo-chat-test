import { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Image, Platform, Switch } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  const { theme, setTheme } = useThemeStore();
  const [isManualDarkMode, setIsManualDarkMode] = useState(theme === 'dark');

  useEffect(() => {
    setIsManualDarkMode(theme === 'dark');
  }, [theme]);

  const toggleTheme = (value: boolean) => {
    setIsManualDarkMode(value);
    setTheme(value ? 'dark' : 'light');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="settings" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      <Collapsible title="Theme toggle">
        <ThemedText type="defaultSemiBold">Dark Mode</ThemedText>
        <Switch
          value={isManualDarkMode}
          onValueChange={toggleTheme}
        />
        <ThemedText type="default">
          {theme === 'system' ? 'Using system theme' : `Manual ${theme} mode`}
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more about dark mode</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Other settings">
        <ThemedText type="defaultSemiBold">Other settings would go here</ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
