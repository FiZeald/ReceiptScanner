import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const colors = useMemo(() => ({
    bg: isDark ? '#000000' : '#F2F2F7',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subText: '#8E8E93',
    border: isDark ? '#2C2C2E' : '#E5E5EA',
    accent: '#28a745',
    danger: '#FF3B30'
  }), [isDark]);

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  // Förenklad funktion utan externa notifications-bibliotek
  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Notiser", 
      "Vill du aktivera påminnelser för garantier?",
      [
        { text: "Senare", style: "cancel" },
        { text: "Aktivera", onPress: () => Alert.alert("Klart!", "Notiser är aktiverade.") }
      ]
    );
  };

  const ComingSoon = (feature: string) => {
    Haptics.selectionAsync();
    Alert.alert(feature, "Denna funktion kommer i en framtida uppdatering.");
  };

  const SettingRow = ({ icon, label, value, type = 'arrow', onValueChange, color = colors.text }: any) => (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: colors.border }]} 
      onPress={() => type === 'arrow' && onValueChange && onValueChange()}
      disabled={type === 'switch'}
    >
      <View style={styles.leftContainer}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          <Ionicons name={icon} size={20} color={colors.accent} />
        </View>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      
      {type === 'switch' ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: colors.accent }}
        />
      ) : (
        <View style={styles.rightContainer}>
          {value && <Text style={[styles.valueText, { color: colors.subText }]}>{value}</Text>}
          <Ionicons name="chevron-forward" size={18} color={colors.subText} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Inställningar</Text>
        </View>

        {/* KONTO */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>KONTO</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow icon="person-outline" label="Profil" value="Ditt namn" onValueChange={() => ComingSoon("Profil")} />
            <SettingRow icon="mail-outline" label="E-post" value="användare@exempel.se" onValueChange={() => ComingSoon("E-post")} />
          </View>
        </View>

        {/* PREFERENSER */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PREFERENSER</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow 
              icon="moon-outline" 
              label="Mörkt läge" 
              type="switch" 
              value={isDark} 
              onValueChange={handleThemeToggle} 
            />
            <SettingRow 
              icon="business-outline" 
              label="Mina Butiker" 
              onValueChange={() => router.push('/settings/manage-stores')} 
            />
            <SettingRow 
              icon="notifications-outline" 
              label="Notiser" 
              onValueChange={handleNotificationPress} 
            />
            <SettingRow icon="cash-outline" label="Valuta" value="SEK" onValueChange={() => ComingSoon("Valuta")} />
          </View>
        </View>

        {/* DATA & SÄKERHET */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>DATA & SÄKERHET</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow icon="cloud-upload-outline" label="Säkerhetskopiering" onValueChange={() => ComingSoon("Cloud Sync")} />
            <SettingRow icon="download-outline" label="Exportera till Excel (CSV)" onValueChange={() => ComingSoon("Export")} />
          </View>
        </View>

        {/* OM APPEN */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>OM APPEN</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <SettingRow icon="help-circle-outline" label="Support" onValueChange={() => ComingSoon("Support")} />
            <SettingRow icon="information-circle-outline" label="Version" value="1.0.4" />
          </View>
        </View>

        {/* LOGGA UT */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Logga ut", "Är du säker på att du vill logga ut?");
          }}
        >
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logga ut</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 25, paddingBottom: 10 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  section: { marginBottom: 25 },
  sectionHeader: { marginHorizontal: 25, marginBottom: 10, fontSize: 13, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5 },
  card: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden' },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1 
  },
  leftContainer: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  label: { fontSize: 17, fontWeight: '500' },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  valueText: { fontSize: 16, marginRight: 8 },
  logoutBtn: { marginTop: 10, padding: 20, alignItems: 'center' },
  logoutText: { fontSize: 17, fontWeight: '700' }
});