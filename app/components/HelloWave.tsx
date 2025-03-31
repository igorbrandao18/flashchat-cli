import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface HelloWaveProps {
  name?: string;
}

export function HelloWave({ name }: HelloWaveProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Hello{name ? `, ${name}` : ''}!{' '}
        <Animated.Text style={[styles.wave, { transform: [{ rotate }] }]}>
          👋
        </Animated.Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
  },
  wave: {
    fontSize: 24,
  },
});

export default HelloWave; 