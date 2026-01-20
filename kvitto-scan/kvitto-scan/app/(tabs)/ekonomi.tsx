import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

type Timeframe = 'vecka' | 'månad' | 'år';

export default function EkonomiDashboard() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('månad');
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const colors = useMemo(() => ({
    bg: isDark ? '#0A0A0A' : '#F2F4F7',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    subText: isDark ? '#A1A1A1' : '#667085',
    accent: '#28a745',
    toggleBg: isDark ? '#2C2C2E' : '#E5E5EA'
  }), [isDark]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Ersätt med din faktiska API-URL
      const response = await fetch('https://ditt-api.com/receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (error) {
      console.error("Fel vid hämtning:", error);
    } finally {
      setLoading(false);
    }
  };

  const storeSummaries = useMemo(() => {
    const stores: { [key: string]: number } = {};
    receipts.forEach(r => {
      const name = r.store || 'Okänd butik';
      stores[name] = (stores[name] || 0) + Number(r.amount);
    });
    return Object.entries(stores)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [receipts]);

  const totalSpent = useMemo(() => {
    return storeSummaries.reduce((sum, s) => sum + s.total, 0);
  }, [storeSummaries]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Min Ekonomi</Text>

        {/* Picker */}
        <View style={[styles.pickerContainer, { backgroundColor: colors.toggleBg }]}>
          {(['vecka', 'månad', 'år'] as Timeframe[]).map((item) => (
            <TouchableOpacity 
              key={item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeframe(item);
              }}
              style={[styles.pickerBtn, timeframe === item && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.pickerText, { color: timeframe === item ? colors.text : colors.subText }]}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Budget Card */}
        <View style={[styles.budgetCard, { backgroundColor: colors.accent }]}>
          <Text style={styles.budgetLabel}>TOTALT SPENDERAT ({timeframe.toUpperCase()})</Text>
          <Text style={styles.budgetAmount}>{totalSpent.toLocaleString()} kr</Text>
          <View style={styles.progressBase}>
            <View style={[styles.progressFill, { width: '70%' }]} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mina Butiker</Text>
        
        {/* Grid */}
        <View style={styles.grid}>
          {storeSummaries.map((store) => (
            <TouchableOpacity 
              key={store.name} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/category-details', params: { storeName: store.name } });
              }}
              style={[styles.gridItem, { backgroundColor: colors.card }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(40,167,69,0.1)' }]}>
                <Ionicons name="cart-outline" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.gridVal, { color: colors.text }]}>{store.total.toLocaleString()} kr</Text>
              <View style={styles.storeNameRow}>
                <Text numberOfLines={1} style={[styles.gridName, { color: colors.subText }]}>{store.name}</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.subText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20, paddingBottom: 140 },
  title: { fontSize: 32, fontWeight: '900', marginBottom: 20, letterSpacing: -1 },
  pickerContainer: { flexDirection: 'row', padding: 4, borderRadius: 14, marginBottom: 25 },
  pickerBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  pickerText: { fontSize: 14, fontWeight: '700' },
  budgetCard: { padding: 25, borderRadius: 30, marginBottom: 35 },
  budgetLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  budgetAmount: { color: 'white', fontSize: 42, fontWeight: '900', marginVertical: 10 },
  progressBase: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginTop: 15 },
  progressFill: { height: '100%', backgroundColor: 'white', borderRadius: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 15, letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', padding: 20, borderRadius: 25, alignItems: 'center', marginBottom: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridVal: { fontSize: 18, fontWeight: '800' },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  gridName: { fontWeight: '600', fontSize: 13, maxWidth: '85%' }
});