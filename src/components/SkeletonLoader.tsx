import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const PostSkeleton = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.name} />
          <View style={styles.time} />
        </View>
      </View>
      
      {/* Content skeleton */}
      <View style={styles.content}>
        <View style={styles.textLine} />
        <View style={styles.textLineShort} />
      </View>
      
      {/* Image placeholder */}
      <View style={styles.imagePlaceholder} />
      
      {/* Shimmer effect */}
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] }
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
};

export const FeedSkeleton = () => {
  return (
    <View>
      {[1, 2, 3].map(i => (
        <PostSkeleton key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    height: 14,
    width: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    marginBottom: 6,
  },
  time: {
    height: 10,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
  },
  content: {
    marginBottom: 15,
  },
  textLine: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    marginBottom: 8,
  },
  textLineShort: {
    height: 12,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
});