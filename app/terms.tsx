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

function Body({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>{'\u2022'}</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'web' ? 20 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
            These Terms of Service ("Terms") govern your use of the Interosense mobile application and website (collectively, the "Service"), operated by Interosense ("we", "our", or "us"). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
          </Body>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="alert-triangle" size={16} color={Colors.warning} />
            <Text style={styles.disclaimerHeading}>Not a Medical Device</Text>
          </View>
          <Body>
            Interosense is a wellness and educational tool. It is not a medical device, clinical service, or substitute for professional medical advice, diagnosis, or treatment. Clinical assessment tools within the app (including GAD-7, PHQ-9, PCL-5, and MAIA-2) are for self-reflection and psychoeducation only — they are not diagnostic instruments when used outside a clinical setting.
          </Body>
          <Body style={{ marginTop: 10 }}>
            Always seek the advice of a qualified healthcare professional for any medical or mental health concerns. If you are in crisis, please contact emergency services or a crisis helpline immediately.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>1. Eligibility</SectionHeading>
          <BulletItem>You must be at least 13 years old to use Interosense.</BulletItem>
          <BulletItem>If you are under 18, you represent that you have your parent or guardian's consent to use the Service.</BulletItem>
          <BulletItem>By using the Service, you represent that all information you provide is accurate and complete.</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>2. Your Account</SectionHeading>
          <BulletItem>You are responsible for keeping your login credentials secure. Do not share your password.</BulletItem>
          <BulletItem>You are responsible for all activity that occurs under your account.</BulletItem>
          <BulletItem>If you suspect unauthorised access to your account, contact us immediately at support@interosense.com.</BulletItem>
          <BulletItem>We reserve the right to suspend or terminate accounts that violate these Terms.</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>3. Acceptable Use</SectionHeading>
          <Body>You agree not to:</Body>
          <BulletItem>Use the Service for any unlawful purpose or in violation of any applicable law</BulletItem>
          <BulletItem>Attempt to reverse-engineer, decompile, or extract the source code of the app</BulletItem>
          <BulletItem>Interfere with or disrupt the Service, servers, or networks connected to the Service</BulletItem>
          <BulletItem>Attempt to gain unauthorised access to any part of the Service or another user's account</BulletItem>
          <BulletItem>Use the Service to transmit harmful, offensive, or abusive content</BulletItem>
          <BulletItem>Misrepresent yourself or provide false information</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>4. Premium Subscription and Billing</SectionHeading>

          <Text style={styles.subHeading}>Free Plan</Text>
          <Body>
            Interosense offers a free tier with access to core exercises, check-ins, and the Sense AI advisor. No payment is required to use the free plan.
          </Body>

          <Text style={styles.subHeading}>Premium Plan</Text>
          <Body>
            Premium features (including advanced assessments, full exercise library, MAIA-2 history, PDF export, and wearable integration) require a paid subscription. Subscriptions are billed in Indian Rupees (INR) via Razorpay.
          </Body>

          <Text style={styles.subHeading}>Billing</Text>
          <BulletItem>Subscriptions renew automatically at the end of each billing period (monthly or annual).</BulletItem>
          <BulletItem>You authorise us to charge your payment method on a recurring basis until you cancel.</BulletItem>
          <BulletItem>All prices are inclusive of applicable taxes where required.</BulletItem>

          <Text style={styles.subHeading}>Cancellation</Text>
          <BulletItem>You may cancel your subscription at any time from your Profile screen.</BulletItem>
          <BulletItem>Cancellation takes effect at the end of the current billing period. You retain access to premium features until that date.</BulletItem>
          <BulletItem>We do not offer refunds for partial billing periods, except where required by applicable law.</BulletItem>

          <Text style={styles.subHeading}>Failed Payments</Text>
          <BulletItem>If a renewal payment fails, we will notify you by email. Access to premium features may be suspended until payment is resolved.</BulletItem>
        </View>

        <View style={styles.card}>
          <SectionHeading>5. Intellectual Property</SectionHeading>
          <Body>
            All content in the Interosense Service — including exercise scripts, article text, UI design, clinical scale adaptations, AI advisor prompts, and branding — is owned by or licensed to Interosense and protected by copyright and other intellectual property laws.
          </Body>
          <Body style={{ marginTop: 10 }}>
            You are granted a limited, non-exclusive, non-transferable licence to use the Service for personal, non-commercial wellness purposes. You may not reproduce, distribute, or create derivative works from any part of the Service without our prior written permission.
          </Body>
          <Body style={{ marginTop: 10 }}>
            Data you generate through the app (your check-ins, assessments, exercise history) remains yours. You can export or delete it at any time.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>6. AI Advisor (Sense)</SectionHeading>
          <Body>
            The Sense AI advisor generates personalised wellness insights using Anthropic's Claude AI model. These insights are for general wellbeing guidance only and do not constitute medical advice. AI-generated content may occasionally be inaccurate or inappropriate — always apply your own judgement and consult a professional when needed.
          </Body>
          <Body style={{ marginTop: 10 }}>
            By using the Sense advisor, you acknowledge that your anonymised activity data (conditions, check-in scores, exercise history) is sent to Anthropic's API to generate your insight, in accordance with our Privacy Policy.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>7. Disclaimer of Warranties</SectionHeading>
          <Body>
            The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </Body>
          <Body style={{ marginTop: 10 }}>
            We do not warrant that the Service will be uninterrupted, error-free, or that any defects will be corrected. We do not warrant the accuracy, completeness, or usefulness of any content provided through the Service, including AI-generated insights.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>8. Limitation of Liability</SectionHeading>
          <Body>
            To the maximum extent permitted by applicable law, Interosense and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of revenue, or any health outcomes arising from your use of or inability to use the Service.
          </Body>
          <Body style={{ marginTop: 10 }}>
            Our total liability for any claim arising out of or related to these Terms or the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or INR 1,000, whichever is greater.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>9. Indemnification</SectionHeading>
          <Body>
            You agree to indemnify and hold harmless Interosense and its team from any claims, damages, losses, or expenses (including reasonable legal fees) arising out of your use of the Service, your violation of these Terms, or your violation of any rights of another person or entity.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>10. Governing Law</SectionHeading>
          <Body>
            These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts in India.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>11. Changes to These Terms</SectionHeading>
          <Body>
            We may update these Terms from time to time. When we do, we will update the "Last updated" date above. For significant changes, we will notify you within the app. Your continued use of the Service after any change constitutes your acceptance of the updated Terms.
          </Body>
        </View>

        <View style={styles.card}>
          <SectionHeading>12. Contact Us</SectionHeading>
          <Body>
            If you have questions about these Terms, please contact us at:
          </Body>
          <Text style={styles.contactEmail}>support@interosense.com</Text>
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
  contactEmail: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
    marginTop: 10,
  },
});
