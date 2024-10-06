import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useThemeStore } from '@/store/useThemeStore';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const systemTheme = useColorScheme() ?? 'light';
  const { theme } = useThemeStore();
  
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const colorFromProps = props[currentTheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[currentTheme][colorName];
  }
}
