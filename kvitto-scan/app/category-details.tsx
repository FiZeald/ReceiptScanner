import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Justera sökvägen om behövs

export default function CategoryDetails() {
  const { storeName } = useLocalSearchParams();
  const { isDark } = useTheme();
  const router = useRouter();
  const [details, setDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        setLoading(true);
        // Byt ut till din faktiska API-slutpunkt
        const response = await fetch(`https://ditt-api.com/receipts?store=${encodeURIComponent(storeName as string)}`);
        const data = await response.json();
        setDetails(data);
      } catch (error) {
        console.error("Fel vid hämtning av butiksdetaljer:", error);
      } finally {
        setLoading(false);
      }
    };

    if (storeName) {
      fetchStoreDetails();
    }
  }, [storeName]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F2F4F7' }]}>
      {/* Header med Back-knapp */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#28a745" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>
          {storeName}
        </Text>
      </View>

      <FlatList
        data={details}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.receiptCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View>
              <Text style={[styles.dateText, { color: isDark ? '#FFF' : '#000' }]}>{item.date}</Text>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            <Text style={[styles.amountText, { color: isDark ? '#FFF' : '#000' }]}>
              {item.amount} kr
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Inga kvitton hittades för denna butik.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  receiptCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    // Skugga för iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Skugga för Android
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 50,
    fontSize: 16,
  },
});