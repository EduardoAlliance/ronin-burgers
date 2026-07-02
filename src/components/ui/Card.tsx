import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, onPress, style }) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container style={[styles.card, style]} onPress={onPress}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
});
