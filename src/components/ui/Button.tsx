import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', disabled, style }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return '#FF6B00';
      case 'secondary': return '#4A5568';
      case 'danger': return '#E53E3E';
      case 'outline': return 'transparent';
      default: return '#FF6B00';
    }
  };

  const getTextColor = () => {
    return variant === 'outline' ? '#FF6B00' : '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: '#FF6B00',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
