import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

export function Text(props: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText {...props} style={[{ color: colors.text }, props.style]} />
  );
} 