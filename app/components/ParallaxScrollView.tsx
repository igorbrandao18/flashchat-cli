import React, { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';

interface ParallaxScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  headerBackgroundColor?: {
    light: string;
    dark: string;
  };
  headerImage?: ReactNode;
}

export default function ParallaxScrollView({
  children,
  headerBackgroundColor,
  headerImage,
  style,
  ...props
}: ParallaxScrollViewProps) {
  const colorScheme = useColorScheme();
  const backgroundColor = headerBackgroundColor
    ? headerBackgroundColor[colorScheme ?? 'light']
    : colorScheme === 'dark'
    ? '#000'
    : '#fff';

  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={styles.contentContainer}
      {...props}>
      <View style={[styles.header, { backgroundColor }]}>
        {headerImage}
      </View>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
}); 