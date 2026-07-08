import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';

interface PaymentResult {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutModalProps {
  visible: boolean;
  checkoutUrl: string;
  onSuccess: (paymentData: PaymentResult) => void;
  onDismiss: () => void;
  onError: (description: string) => void;
}

const ALLOWED_ORIGINS = [
  'razorpay.com',
  'api.razorpay.com',
  'checkout.razorpay.com',
  'cdn.razorpay.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const apiBase = getApiUrl();
    if (apiBase && url.startsWith(apiBase)) return true;
    return ALLOWED_ORIGINS.some((origin) => parsed.hostname === origin || parsed.hostname.endsWith('.' + origin));
  } catch {
    return false;
  }
}

export default function RazorpayCheckoutModal({
  visible,
  checkoutUrl,
  onSuccess,
  onDismiss,
  onError,
}: RazorpayCheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'SUCCESS') {
        const p = data.payload;
        if (p?.razorpay_payment_id && p?.razorpay_subscription_id && p?.razorpay_signature) {
          onSuccess(p as PaymentResult);
        }
      } else if (data.type === 'DISMISSED') {
        onDismiss();
      } else if (data.type === 'FAILED') {
        onError(data.payload?.description || 'Payment failed');
      }
    } catch {
      // ignore malformed messages
    }
  };

  const handleShouldStartLoad = (request: WebViewNavigation): boolean => {
    const url = request.url || '';
    if (url === checkoutUrl || url.startsWith('about:') || url.startsWith('blob:')) return true;
    if (isAllowedUrl(url)) return true;
    return false;
  };

  const handleLoadError = () => {
    setLoading(false);
    Alert.alert('Error', 'Failed to load checkout. Please try again.');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Pressable style={styles.closeBtn} onPress={onDismiss} testID="razorpay-close">
            <Feather name="x" size={22} color={Colors.text} />
          </Pressable>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Opening secure checkout...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webView}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          onError={handleLoadError}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          testID="razorpay-webview"
        />
      </View>
    </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: Colors.textSecondary,
  },
});
