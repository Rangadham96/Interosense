import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>{'\u2022'}</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.lastUpdated}>Last updated: July 2026</Text>
          <Body>
            Interosense ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains what personal information we collect, how we use it, and the choices you have. By using the Interosense app or website, you agree to this policy.
          </Body>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="alert-triangle" size={16} color={Colors.warning} />
            <Text style={styles.disclaimerHeading}>Medical Disclaimer</Text>
          </View>
          <Body>
            Interosense is a wellness and educational tool, not a medical device or clinical service. It is not intended to diagnose, treat, cure, or prevent any medical condition. Always consult a qualified healthcare professional for medical advice.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>1. Information We Collect</SectionHeading>
          <Body>We collect the following categories of information:</Body>

          <Text style={styles.subHeading}>Account Information</Text>
          <BulletItem>Name and email address when you register</BulletItem>
          <BulletItem>Password (stored as a secure cryptographic hash; we never store the plain text)</BulletItem>
          <BulletItem>Experience level and wellness goals selected during onboarding</BulletItem>
          <BulletItem>Health conditions you choose to disclose (e.g. anxiety, PTSD, chronic pain)</BulletItem>

          <Text style={styles.subHeading}>Wellness Activity Data</Text>
          <BulletItem>Exercise sessions you complete, including exercise name, duration, and your self-reported awareness rating</BulletItem>
          <BulletItem>Daily check-in responses (mood, energy, sleep, stress, body sensations)</BulletItem>
          <BulletItem>Clinical assessment results: GAD-7, PHQ-9, PCL-5, and MAIA-2</BulletItem>
          <BulletItem>Body map annotations you create</BulletItem>
          <BulletItem>Goals and intentions you set within the app</BulletItem>

          <Text style={styles.subHeading}>Health Wearable Data (optional)</Text>
          <BulletItem>Heart rate variability (HRV) and sleep data from Apple Health (iOS) or Health Connect (Android), only if you explicitly grant permission</BulletItem>
          <BulletItem>This data is used only to personalise your AI advisor insight and is never sold or shared with third parties for advertising</BulletItem>

          <Text style={styles.subHeading}>Usage & Technical Data</Text>
          <BulletItem>App preferences and settings you configure</BulletItem>
          <BulletItem>Session metadata (timestamps, approximate duration) used to maintain streaks and progress</BulletItem>
          <BulletItem>Standard server logs (IP address, device type, errors) for app reliability</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>2. How We Use Your Information</SectionHeading>
          <BulletItem>To provide and personalise the Interosense experience, including AI-generated daily insights tailored to your conditions and activity history</BulletItem>
          <BulletItem>To track your wellness progress over time and display it to you on the Progress screen</BulletItem>
          <BulletItem>To generate clinical-style reports (MAIA-2 history, clinician share) at your explicit request</BulletItem>
          <BulletItem>To process subscription payments securely via Razorpay</BulletItem>
          <BulletItem>To send transactional emails (password reset, subscription alerts) via Resend, only when you initiate the action</BulletItem>
          <BulletItem>To improve the reliability and performance of the app</BulletItem>
          <BulletItem>We do not use your data for advertising, and we do not sell your data to any third party</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>3. How We Store Your Data</SectionHeading>
          <Body>
            Your data is stored in a PostgreSQL database hosted on secure cloud infrastructure. A local cache is maintained on your device using AsyncStorage to allow the app to function when offline.
          </Body>
          <Body style={{ marginTop: 10 }}>
            Raw health wearable readings (HRV, sleep) are read from Apple Health or Health Connect at the time of use and are not permanently stored on our servers. When enough baseline data is available, a broad comparison such as higher, lower, or similar to your recent average may be reflected in a saved daily insight.
          </Body>
          <Body style={{ marginTop: 10 }}>
            All data in transit is encrypted using HTTPS/TLS.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>4. Third-Party Processors</SectionHeading>
          <Body>We share limited data with the following trusted processors to operate the service:</Body>

          <Text style={styles.subHeading}>Anthropic (AI advisor)</Text>
          <Body>
            To generate your personalised daily insight, we send a summary of your recent activity (conditions, check-in scores, exercise history, and optionally HRV/sleep data) to Anthropic's Claude API. This data is processed according to Anthropic's Privacy Policy and is not used to train Anthropic's models. No raw personal identifiers (name, email) are sent.
          </Body>

          <Text style={styles.subHeading}>Razorpay (payments)</Text>
          <Body>
            Premium subscription payments are processed by Razorpay. We share your name and email with Razorpay for payment processing. We do not store your card details. Razorpay's Privacy Policy governs their use of your payment data.
          </Body>

          <Text style={styles.subHeading}>Resend (transactional email)</Text>
          <Body>
            If you request a password reset or if a subscription renewal fails, we use Resend to send you a transactional email. Only your email address is shared with Resend for this purpose.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>5. Sensitive Health Data</SectionHeading>
          <Body>
            Some of the information you provide, including mental health conditions, clinical assessment scores and body sensations, is sensitive health data. We treat it with particular care:
          </Body>
          <BulletItem>It is never shared with advertisers, data brokers, or any third party for commercial purposes</BulletItem>
          <BulletItem>It is used only to personalise your experience within the app</BulletItem>
          <BulletItem>Clinical reports are generated only at your explicit request and shared only by you (via the native share sheet)</BulletItem>
          <BulletItem>Raw wearable readings are processed in real time and are not retained on our servers; saved insights may include a broad comparison with your recent average</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>6. Your Rights</SectionHeading>
          <BulletItem>
            <Text><Text style={styles.bold}>Access:</Text> You can export all your data at any time from Settings &gt; Export Data.</Text>
          </BulletItem>
          <BulletItem>
            <Text><Text style={styles.bold}>Deletion:</Text> You can delete your account and all associated data from Settings &gt; Delete My Account. Deletion is permanent and cannot be undone.</Text>
          </BulletItem>
          <BulletItem>
            <Text><Text style={styles.bold}>Correction:</Text> You can update your profile information at any time from the Profile screen.</Text>
          </BulletItem>
          <BulletItem>
            <Text><Text style={styles.bold}>Withdraw consent:</Text> You can revoke Apple Health or Health Connect permissions at any time from your device settings.</Text>
          </BulletItem>
          <BulletItem>
            <Text><Text style={styles.bold}>Contact us:</Text> To exercise any other rights or ask a privacy question, email us at privacy@interosense.com.</Text>
          </BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>7. Data Retention</SectionHeading>
          <Body>
            We retain your data for as long as your account is active. If you delete your account, all personal data is permanently removed from our systems within 30 days, except where we are required to retain it by law (e.g. payment records for tax purposes, retained for 7 years as required by applicable law).
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>8. Children's Privacy</SectionHeading>
          <Body>
            Interosense is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>9. Changes to This Policy</SectionHeading>
          <Body>
            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page and, for significant changes, notify you within the app. Your continued use of Interosense after any change constitutes your acceptance of the updated policy.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>10. Contact Us</SectionHeading>
          <Body>
            If you have questions about this Privacy Policy or how we handle your data, please contact us at:
          </Body>
          <Text style={styles.contactEmail}>privacy@interosense.com</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  lastUpdated: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disclaimerHeading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.warning,
  },
  sectionHeading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 12,
  },
  subHeading: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.text,
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletDot: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  bold: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  contactEmail: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
    marginTop: 10,
  },
});
