import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
}

const InputField = ({ label, value, onChangeText, keyboardType }: Props) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.subtext}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    marginBottom: 16,
  },
  label: {
    color: colors.subtext,
    fontSize: 11,
    marginBottom: 4,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
});

export default InputField;