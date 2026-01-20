import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { AddReceiptButton } from '../../components/AddReceiptButton';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: true, 
      tabBarActiveTintColor: '#28a745', 
      tabBarInactiveTintColor: isDark ? '#636366' : '#8E8E93',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 8,
      },
      tabBarStyle: {
        position: 'absolute',
        bottom: 30,
        left: 25, 
        right: 25,
        height: 75,
        borderRadius: 38,
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        borderTopWidth: 0,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        paddingTop: 8,
      },
      tabBarItemStyle: {
        height: 75,
        justifyContent: 'center',
      }
    }}>
      
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Hem',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ) 
        }} 
      />

      <Tabs.Screen 
        name="plus-action" 
        options={{
          title: "", 
          tabBarIcon: () => (
            <View style={styles.plusContainer}>
              <AddReceiptButton />
            </View>
          )
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('save-receipt');
          },
        })}
      />

      <Tabs.Screen 
        name="ekonomi" 
        options={{ 
          title: 'Analys', 
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "pie-chart" : "pie-chart-outline"} size={24} color={color} />
          ) 
        }} 
      />

      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  plusContainer: {
    // Justera detta värde (10-14) för att hitta den perfekta mittpunkten
    // i förhållande till de andra ikonernas text.
    marginTop: 12, 
    alignItems: 'center',
    justifyContent: 'center',
  },
});