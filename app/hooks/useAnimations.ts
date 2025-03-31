import { useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useAnimations() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fadeIn = (duration = 300) => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  };

  const scaleIn = (duration = 300) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 150,
    }).start();
  };

  const slideUp = (duration = 300) => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 150,
    }).start();
  };

  const messageAnimation = {
    opacity: fadeAnim,
    transform: [
      { scale: scaleAnim },
      { translateY: slideAnim },
    ],
  };

  const startEnterAnimation = () => {
    fadeIn();
    scaleIn();
    slideUp();
  };

  return {
    messageAnimation,
    startEnterAnimation,
  };
} 