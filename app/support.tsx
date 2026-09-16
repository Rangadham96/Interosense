import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';

const FAQ_ITEMS = [
  {
    q: 'What is interoception and why does it matter?',
    a: 'Interoception is your ability to sense signals from inside your body: heartbeat, breath, hunger, temperature, and muscle tension. Research shows that people with better interoceptive awareness have stronger emotional regulation, lower anxiety, and more resilient stress responses. Interosense trains this skill systematically.',
  },
  {
    q: 'How often should I use the app?',
    a: 'Daily is ideal. A daily check-in (about 3 minutes) combined with one guided exercise (5 to 15 minutes) builds the strongest interoceptive habit. The 4-week programme on your profile screen offers a structured starting path.',
  },
  {
    q: 'What do the clinical assessments (GAD-7, PHQ-9, etc.) measure?',
    a: 'These are standardised questionnaires used by clinicians worldwide. GAD-7 tracks anxiety severity, PHQ-9 tracks depression symptoms, and PCL-5 tracks PTSD-related experiences. Your results are for personal self-reflection only and are not a clinical diagnosis. Always speak with a healthcare professional if your scores concern you.',
  },
  {
    q: 'What is the MAIA-2 assessment?',
    a: 'The Multidimensional Assessment of Interoceptive Awareness (MAIA-2) is a validated 37-item self-report questionnaire developed by Mehling et al. (2018). It describes 8 dimensions of interoceptive awareness, including noticing, emotional awareness, and self-regulation. Your results are reflective rather than diagnostic.',
  },
  {
    q: 'Is my health data private?',
    a: 'Yes. Your data is stored securely and never sold or shared with advertisers. Sensitive health data (conditions, assessment scores, body sensations) is used only to personalise your experience. You can export or permanently delete all your data at any time from Settings. See the Privacy Policy for full details.',
  },
  {
    q: 'What is the Sense AI advisor?',
    a: 'Sense is your daily personalised insight powered by Anthropic\'s Claude AI. Each morning it analyses your recent check-ins, exercise history, conditions, and optionally wearable data to give you one focused recommendation. It is refreshed once per day. Sense provides general wellness guidance, not medical advice.',
  },
  {
    q: 'Can I use Interosense if I have a diagnosed mental health condition?',
    a: 'Interosense is designed to complement, not replace, professional care. Many exercises are safe for people with anxiety, depression, PTSD, and chronic pain. The app flags contraindications and always offers a safety exit from any exercise. If you have a serious diagnosis, use the app alongside, not instead of, your treatment.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings, scroll to the Danger Zone section, and tap "Delete My Account". This permanently removes your account and all associated data from our servers. The action cannot be undone.',
  },
  {
    q: 'The app is not loading or seems stuck. What should I do?',
    a: 'First, try closing and reopening the app. If the issue persists, check your internet connection. Your data is also cached locally, so most features work offline. If you continue to experience problems, contact us at support@interosense.com with a brief description and your device type.',
  },
  {
    q: 'How do I reset my password?',
    a: 'On the login screen, tap "Forgot password" and enter your email address. You will receive a reset link valid for 1 hour. If you do not see the email, check your spam folder. If you still cannot access your account, contact support@interosense.com.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.faqRow, open && styles.faqRowOpen]}
      activeOpacity={0.7}
      onPress={() => setOpen(v => !v)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQ}>{q}</Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.primary}
          style={{ marginLeft: 8, flexShrink: 0 }}
        />
      </View>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </TouchableOpacity>
  );
}

function ContactCard({
  icon,
  label,
  sublabel,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contactCard} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.contactIconWrap}>
        <Feather name={icon as any} size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactSub}>{sublabel}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Feather name="life-buoy" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSub}>
            Browse frequently asked questions below, or reach out directly and we will get back to you within one business day.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>CONTACT</Text>
        <View style={styles.card}>
          <ContactCard
            icon="mail"
            label="Email Support"
            sublabel="support@interosense.com"
            onPress={() => Linking.openURL('mailto:support@interosense.com?subject=Interosense Support')}
          />
          <View style={styles.divider} />
          <ContactCard
            icon="shield"
            label="Privacy Questions"
            sublabel="privacy@interosense.com"
            onPress={() => Linking.openURL('mailto:privacy@interosense.com?subject=Interosense Privacy')}
          />
        </View>

        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.card}>
          {FAQ_ITEMS.map((item, i) => (
            <View key={i}>
              <FaqItem q={item.q} a={item.a} />
              {i < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.legalRow}
            activeOpacity={0.7}
            onPress={() => router.push('/privacy-policy')}
          >
            <Feather name="shield" size={17} color={Colors.textSecondary} />
            <Text style={styles.legalLabel}>Privacy Policy</Text>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.legalRow}
            activeOpacity={0.7}
            onPress={() => router.push('/terms')}
          >
            <Feather name="file-text" size={17} color={Colors.textSecondary} />
            <Text style={styles.legalLabel}>Terms of Service</Text>
            <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>CRISIS RESOURCES</Text>
        <TouchableOpacity
          style={styles.crisisBanner}
          activeOpacity={0.8}
          onPress={() => router.push('/crisis')}
        >
          <View style={styles.crisisIconWrap}>
            <Feather name="phone" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.crisisTitle}>Need immediate support?</Text>
            <Text style={styles.crisisSub}>Access crisis resources and emergency contacts</Text>
          </View>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Interosense is a wellness tool and is not a substitute for professional mental health care. If you are in a mental health crisis, please contact emergency services or a crisis line immediately.
          </Text>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 34 : 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  contactSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqRowOpen: {
    backgroundColor: Colors.primary + '04',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqQ: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 21,
  },
  faqA: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 10,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  legalLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginTop: 0,
  },
  crisisIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crisisTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  crisisSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  footerNote: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  footerText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.textTertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
