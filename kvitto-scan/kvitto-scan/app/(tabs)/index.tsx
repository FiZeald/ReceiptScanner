import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  TouchableOpacity, Dimensions, Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit'; 
import { useTheme } from '../../context/ThemeContext'; 
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const API_URL = 'http://10.0.0.1:3000';

const getStoreIcon = (name: string, accent: string) => {
  const s = name.toLowerCase();
  if (s.includes('ica')) return { name: 'cart', color: '#E12122' };
  if (s.includes('coop')) return { name: 'cart', color: '#00843D' };
  if (s.includes('ikea')) return { name: 'home', color: '#0051BA' };
  if (s.includes('apple')) return { name: 'apple', color: '#555' };
  if (s.includes('elgiganten')) return { name: 'lightning-bolt', color: '#003366' };
  return { name: 'receipt-outline', color: accent };
};

export default function OverviewScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [stats, setStats] = useState({ total_count: 0, total_spent: 0, average_amount: 0 });
  const [categoryStats, setCategoryStats] = useState([]);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [sRes, cRes, rRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/stats/categories`),
        fetch(`${API_URL}/receipts/recent`)
      ]);
      const sData = await sRes.json();
      const cData = await cRes.json();
      const rData = await rRes.json();

      setStats(sData || { total_count: 0, total_spent: 0, average_amount: 0 });
      setCategoryStats(cData || []);
      setRecentReceipts(rData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor={colors.accent} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: colors.subText }]}>
              {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Mitt Saldo</Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileBtn, { backgroundColor: colors.card }]} 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }}
          >
            <Ionicons name="person" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* HUVUDKORT */}
        <TouchableOpacity activeOpacity={0.95} style={[styles.mainCard, { backgroundColor: colors.accent }]}>
          <View>
            <Text style={styles.mainCardLabel}>Spenderat denna månad</Text>
            <Text style={styles.mainCardValue}>{stats.total_spent.toLocaleString('sv-SE')} kr</Text>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.mainCardFooter}>
            <View style={styles.statMini}>
              <Text style={styles.statLabel}>ANTAL KÖP</Text>
              <Text style={styles.statValue}>{stats.total_count} st</Text>
            </View>
            <View style={styles.statMini}>
              <Text style={styles.statLabel}>SNITTBELOPP</Text>
              <Text style={styles.statValue}>{stats.average_amount.toFixed(0)} kr</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* TREND GRAF */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Utgiftstrend</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <LineChart
              data={{
                labels: ["M", "T", "O", "T", "F", "L", "S"],
                datasets: [{ data: [400, 120, 500, 1400, 800, 200, 900], color: () => colors.accent }]
              }}
              width={width - 40}
              height={180}
              chartConfig={{
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => colors.accent,
                labelColor: () => colors.subText,
                propsForDots: { r: "5", strokeWidth: "2", stroke: colors.card },
                propsForBackgroundLines: { stroke: isDark ? '#333' : '#F0F0F0', strokeDasharray: '' },
              }}
              bezier
              withVerticalLines={false}
              withInnerLines={true}
              style={styles.chartStyle}
            />
          </View>
        </View>

        {/* SENASTE HÄNDELSER */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Senaste händelser</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Visa alla</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.receiptListCard, { backgroundColor: colors.card }]}>
            {recentReceipts.length > 0 ? (
              recentReceipts.map((item: any, index) => {
                const store = getStoreIcon(item.store_name, colors.accent);
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.receiptItem, 
                      index !== recentReceipts.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#F0F0F0' }
                    ]}
                  >
                    <View style={[styles.receiptIcon, { backgroundColor: store.color + '15' }]}>
                      <MaterialCommunityIcons name={store.name as any} size={20} color={store.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.receiptStore, { color: colors.text }]} numberOfLines={1}>{item.store_name}</Text>
                      <Text style={[styles.receiptDate, { color: colors.subText }]}>
                        {new Date(item.created_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={[styles.receiptAmount, { color: colors.text }]}>
                      -{item.total_amount.toLocaleString()} kr
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', padding: 20, color: colors.subText }}>Inga köp hittades</Text>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  dateText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 4 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  profileBtn: { 
    width: 46, height: 46, borderRadius: 23, 
    justifyContent: 'center', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 }, android: { elevation: 4 } })
  },
  mainCard: { 
    borderRadius: 32, padding: 24, marginBottom: 30,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 16 } })
  },
  mainCardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  mainCardValue: { color: '#fff', fontSize: 42, fontWeight: '900', marginVertical: 8, letterSpacing: -1 },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 18 },
  mainCardFooter: { flexDirection: 'row', gap: 40 },
  statMini: { gap: 4 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  chartContainer: { borderRadius: 28, overflow: 'hidden', paddingBottom: 10 },
  chartStyle: { borderRadius: 28, paddingRight: 40, marginTop: 10 },
  receiptListCard: { borderRadius: 28, paddingHorizontal: 16, paddingVertical: 4 },
  receiptItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  receiptIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  receiptStore: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  receiptDate: { fontSize: 13, fontWeight: '500' },
  receiptAmount: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 }
});