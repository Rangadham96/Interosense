import { StyleSheet, Text, View } from 'react-native';

export default function CheckinScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check-in</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
});
