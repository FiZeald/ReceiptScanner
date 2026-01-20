import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';

const API_URL = 'http://10.0.0.1:3000';

// Hjälpfunktion för att välja ikon baserat på kategori
const getCategoryIcon = (category: string): any => {
  switch (category?.toLowerCase()) {
    case 'mat': return 'basket-outline';
    case 'transport': return 'car-outline';
    case 'nöje': return 'ticket-outline';
    case 'hem': return 'home-outline';
    default: return 'receipt-outline';
  }
};

export default function HistoryPage() {
  const { isDark } = useTheme();
  const [receipts, setReceipts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const colors = useMemo(() => ({
    bg: isDark ? '#000000' : '#F2F2F7',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    subText: '#8E8E93',
    inputBg: isDark ? '#2C2C2E' : '#E5E5EA',
    accent: '#28a745',
    danger: '#FF3B30',
    border: isDark ? '#2C2C2E' : '#E5E5EA'
  }), [isDark]);

  const fetchHistory = async (search = '') => {
    try {
      let url = `${API_URL}/receipts/all`;
      if (search) {
        url = `${API_URL}/receipts/search?query=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setReceipts(data);
    } catch (e) {
      console.log("Fel vid hämtning:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchHistory(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const confirmDelete = (id: number) => {
    Alert.alert("Radera kvitto", "Detta går inte att ångra.", [
      { text: "Avbryt", style: "cancel" },
      { text: "Radera", style: "destructive", onPress: () => deleteReceipt(id) }
    ]);
  };

  const deleteReceipt = async (id: number) => {
    await fetch(`${API_URL}/receipts/${id}`, { method: 'DELETE' });
    fetchHistory(searchQuery);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Historik</Text>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={18} color={colors.subText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Sök butik eller kategori..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={receipts}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchHistory(searchQuery)} 
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.card }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.subText} />
            </View>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              {searchQuery ? "Inga matchningar hittades" : "Du har inte lagt till några kvitton än"}
            </Text>
          </View>
        }
        renderItem={({ item }: any) => (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#262629' : '#F2F2F7' }]}>
              <Ionicons 
                name={getCategoryIcon(item.category)} 
                size={22} 
                color={colors.accent} 
              />
            </View>

            <View style={styles.info}>
              <Text style={[styles.storeText, { color: colors.text }]} numberOfLines={1}>
                {item.store_name}
              </Text>
              <Text style={[styles.dateText, { color: colors.subText }]}>
                {new Date(item.created_at).toLocaleDateString('sv-SE')} • {item.category}
              </Text>
            </View>

            <View style={styles.rightSection}>
              <Text style={[styles.amountText, { color: colors.text }]}>
                {item.total_amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
              </Text>
              <TouchableOpacity 
                onPress={() => confirmDelete(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    borderRadius: 14, 
    alignItems: 'center', 
    paddingHorizontal: 15,
    height: 50
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 5 },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    borderRadius: 22, 
    alignItems: 'center',
    marginBottom: 12,
    // Subtil skugga för "Premium" känsla
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  info: { flex: 1, marginLeft: 15 },
  storeText: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  dateText: { fontSize: 13, fontWeight: '500' },
  rightSection: { alignItems: 'flex-end', justifyContent: 'space-between', height: 45 },
  amountText: { fontSize: 16, fontWeight: '800' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { fontSize: 16, fontWeight: '600', width: '60%', textAlign: 'center', lineHeight: 22 }
});