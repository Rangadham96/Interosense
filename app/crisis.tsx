import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

const GROUNDING_STEPS = [
  { count: 5, sense: 'SEE', icon: 'eye' as const, color: Colors.primary },
  { count: 4, sense: 'TOUCH', icon: 'edit-3' as const, color: Colors.secondary },
  { count: 3, sense: 'HEAR', icon: 'headphones' as const, color: Colors.accent },
  { count: 2, sense: 'SMELL', icon: 'wind' as const, color: Colors.success },
  { count: 1, sense: 'TASTE', icon: 'coffee' as const, color: Colors.warning },
];

const RESOURCES = [
  { title: 'National Suicide Prevention Lifeline', detail: '988', icon: 'phone' as const },
  { title: 'Crisis Text Line', detail: 'Text HOME to 741741', icon: 'message-square' as const },
  { title: 'International Association for Suicide Prevention', detail: 'https://www.iasp.info', icon: 'globe' as const },
];

function BreathingCircle() {
  const scale = useSharedValue(0.6);
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'exhale'>('idle');
  const phaseInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startBreathing = useCallback(() => {
    setIsBreathing(true);
    setPhase('inhale');

    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    phaseInterval.current = setInterval(() => {
      setPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 5000);
  }, [scale]);

  const stopBreathing = useCallback(() => {
    setIsBreathing(false);
    setPhase('idle');
    cancelAnimation(scale);
    scale.value = withTiming(0.6, { duration: 300 });
    if (phaseInterval.current) {
      clearInterval(phaseInterval.current);
      phaseInterval.current = null;
    }
  }, [scale]);

  useEffect(() => {
    return () => {
      if (phaseInterval.current) clearInterval(phaseInterval.current);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={bStyles.container}>
      <Text style={bStyles.title}>Breathe with me</Text>
      <View style={bStyles.circleWrapper}>
        <Animated.View style={[bStyles.outerCircle, animatedStyle]}>
          <View style={bStyles.innerCircle}>
            <Text style={bStyles.phaseText}>
              {phase === 'idle' ? 'Ready' : phase === 'inhale' ? 'Inhale' : 'Exhale'}
            </Text>
          </View>
        </Animated.View>
      </View>
      <Pressable
        style={[bStyles.controlBtn, isBreathing && bStyles.controlBtnStop]}
        onPress={isBreathing ? stopBreathing : startBreathing}
      >
        <Feather name={isBreathing ? 'square' : 'play'} size={18} color={Colors.textInverse} />
        <Text style={bStyles.controlText}>{isBreathing ? 'Stop' : 'Start'}</Text>
      </Pressable>
    </View>
  );
}

const bStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 20 },
  title: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.text, marginBottom: 20 },
  circleWrapper: { width: 180, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  outerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.textInverse },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  controlBtnStop: { backgroundColor: Colors.error },
  controlText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: Colors.textInverse },
});

export default function CrisisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.headerGradient, { paddingTop: topInset + 8 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Crisis Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.disclaimerCard}>
          <Feather name="alert-triangle" size={20} color={Colors.error} />
          <Text style={styles.disclaimerText}>
            If you are in immediate danger, please call emergency services.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5-4-3-2-1 Grounding Technique</Text>
          <Text style={styles.sectionSubtitle}>
            Focus on your senses to bring yourself into the present moment
          </Text>
          {GROUNDING_STEPS.map(step => (
            <View key={step.count} style={styles.groundingCard}>
              <View style={[styles.groundingIcon, { backgroundColor: step.color + '18' }]}>
                <Feather name={step.icon} size={20} color={step.color} />
              </View>
              <View style={styles.groundingContent}>
                <Text style={styles.groundingCount}>{step.count}</Text>
                <Text style={styles.groundingSense}>
                  thing{step.count > 1 ? 's' : ''} you can {step.sense}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Breathing</Text>
          <View style={styles.breathingCard}>
            <BreathingCircle />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Helpful Resources</Text>
          <Text style={styles.sectionSubtitle}>
            These resources are available if you need support
          </Text>
          {RESOURCES.map((resource, index) => (
            <View key={index} style={styles.resourceCard}>
              <View style={styles.resourceIconWrap}>
                <Feather name={resource.icon} size={20} color={Colors.primary} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceDetail}>{resource.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    color: Colors.textInverse,
  },
  scroll: {
    flex: 1,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '30',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.error,
    lineHeight: 20,
  },
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  groundingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  groundingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  groundingContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  groundingCount: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.text,
  },
  groundingSense: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  breathingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  resourceDetail: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.primary,
  },
});
