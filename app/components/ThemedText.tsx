import React from 'react';
import { Text, TextProps, useColorScheme, StyleSheet } from 'react-native';

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'link' | 'subtitle' | 'body';
}

export function ThemedText(props: ThemedTextProps) {
  const { style, lightColor, darkColor, type = 'default', ...otherProps } = props;
  const colorScheme = useColorScheme();

  const color = colorScheme === 'dark' ? darkColor ?? '#fff' : lightColor ?? '#000';
  const typeStyle = styles[type] || {};

  return (
    <Text style={[{ color }, typeStyle, style]} {...otherProps} />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ThemedText; 