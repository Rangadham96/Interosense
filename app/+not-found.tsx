import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from '@expo/vector-icons';
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Feather name="compass" size={48} color={Colors.primary} style={{ marginBottom: 16, opacity: 0.7 }} />
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>This page doesn't exist or may have moved.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: "#FFFFFF",
  },
});
