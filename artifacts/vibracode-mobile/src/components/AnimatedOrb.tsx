import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface Props {
  size?: number;
  style?: object;
}

export default function AnimatedOrb({ size = 90, style }: Props) {
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.3, size * 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          transform: [{ scale }],
        },
        style,
      ]}
    >
      {/* Base sphere */}
      <LinearGradient
        colors={["#7C3AED", "#4F46E5", "#1D4ED8", "#0EA5E9"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
      />
      {/* Inner shine */}
      <LinearGradient
        colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
        start={{ x: 0.1, y: 0.05 }}
        end={{ x: 0.7, y: 0.6 }}
        style={[
          styles.shine,
          {
            width: size * 0.7,
            height: size * 0.55,
            borderRadius: size * 0.35,
            top: size * 0.06,
            left: size * 0.1,
          },
        ]}
      />
      {/* Animated shimmer layer */}
      <Animated.View
        style={[
          styles.shimmerWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ translateX: shimmerX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.18)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={{ flex: 1, borderRadius: size / 2 }}
        />
      </Animated.View>
      {/* Bottom shadow reflection */}
      <LinearGradient
        colors={["rgba(79,70,229,0)", "rgba(79,70,229,0.4)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[
          styles.reflection,
          {
            width: size * 0.9,
            height: size * 0.35,
            borderRadius: size * 0.18,
            bottom: size * 0.04,
            left: size * 0.05,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  shine: {
    position: "absolute",
  },
  shimmerWrapper: {
    position: "absolute",
    overflow: "hidden",
  },
  reflection: {
    position: "absolute",
  },
});
