import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Image,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const SLIDES = [
  {
    icon: 'activity' as const,
    iconColor: '#E8B4B8',
    headline: 'Your body is always talking',
    body: 'Stress, anxiety, mood shifts. They all start as body signals. Interosense teaches you to hear them before they escalate.',
  },
  {
    icon: 'layers' as const,
    iconColor: '#88B3B5',
    headline: 'Built on validated science',
    body: '37 research-backed exercises across 8 dimensions of interoceptive awareness. Designed with the same methods used in clinical settings.',
  },
  {
    icon: 'user-check' as const,
    iconColor: '#A89BC8',
    headline: 'Personalized from the start',
    body: 'A 2-minute intake creates your program. Exercises, check-ins, and insights adapt to your nervous system, not a generic template.',
  },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Live width so rotation/resize keeps slide sizes and offsets correct.
  const { width } = useWindowDimensions();
  const flatRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const markSeen = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', '1');
  };

  const handleGetStarted = async () => {
    await markSeen();
    router.replace('/auth/register');
  };

  const handleSignIn = async () => {
    await markSeen();
    router.replace('/auth/login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      // Update state directly: on react-native-web viewability callbacks can
      // silently not fire, which previously left the button doing nothing.
      setActiveIndex(next);
      // scrollToOffset is reliable on web where scrollToIndex can no-op.
      flatRef.current?.scrollToOffset({ offset: next * width, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  // Fallback for web/manual swipes: derive the page from the scroll offset so
  // the dots and button label always stay in sync even when viewability
  // callbacks don't fire.
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const idx = Math.min(
      SLIDES.length - 1,
      Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width)),
    );
    setActiveIndex(idx);
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <LinearGradient
        colors={['#3D2F6B', Colors.primary, '#5A4B80']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <View style={styles.logoRow}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.wordmark}>Interosense</Text>
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        extraData={width}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Feather name={item.icon} size={48} color={item.iconColor} />
            </View>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.ctaArea}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
          onPress={handleNext}
          testID="welcome-next"
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>

        <Pressable style={styles.signInLink} onPress={handleSignIn} testID="welcome-signin">
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInBold}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  logo: {
    width: 36,
    height: 36,
  },
  wordmark: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 36,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headline: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  ctaArea: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 16,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: '#fff',
  },
  signInLink: {
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.65)',
  },
  signInBold: {
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.9)',
  },
});
