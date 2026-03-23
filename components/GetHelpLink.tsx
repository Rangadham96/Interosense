import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';

interface Props {
  color?: string;
}

export default function GetHelpLink({ color }: Props) {
  return (
    <TouchableOpacity onPress={() => router.push('/crisis')} activeOpacity={0.6} hitSlop={8}>
      <Text style={[styles.link, color ? { color } : null]}>Get Help</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
});
