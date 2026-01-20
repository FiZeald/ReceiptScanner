import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const AddReceiptButton = () => {
  const { isDark } = useTheme();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }
    ]}>
      <Ionicons name="add" size={28} color="#28a745" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtil skugga för knappen i ljust läge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});