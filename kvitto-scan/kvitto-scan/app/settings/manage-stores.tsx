import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  TextInput, Alert, FlatList, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

// Definition av kategorier med ikoner och färger
const CATEGORIES = [
  { id: 'grocery', label: 'Livsmedel', icon: 'cart', color: '#4CD964' },
  { id: 'tech', label: 'Teknik', icon: 'laptop', color: '#007AFF' },
  { id: 'fashion', label: 'Mode', icon: 'tshirt-crew', color: '#FF2D55' },
  { id: 'home', label: 'Hem', icon: 'home', color: '#5856D6' },
  { id: 'other', label: 'Övrigt', icon: 'storefront', color: '#8E8E93' },
];

export default function ManageStores() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const saved = await AsyncStorage.getItem('custom_stores');
    if (saved) setStores(JSON.parse(saved));
  };

  const saveStores = async (updatedStores: any[]) => {
    await AsyncStorage.setItem('custom_stores', JSON.stringify(updatedStores));
    setStores(updatedStores);
  };

  const addStore = () => {
    if (!newStoreName.trim()) return;
    
    const newStore = {
      id: Date.now().toString(),
      name: newStoreName.trim(),
      category: selectedCat.id,
      icon: selectedCat.icon,
      color: selectedCat.color,
    };

    const updated = [...stores, newStore];
    saveStores(updated);
    setNewStoreName('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeStore = (id: string) => {
    Alert.alert("Ta bort butik", "Är du säker?", [
      { text: "Avbryt", style: "cancel" },
      { 
        text: "Ta bort", 
        style: "destructive", 
        onPress: () => {
          const updated = stores.filter(s => s.id !== id);
          saveStores(updated);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mina Butiker</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* SEKTION: LÄGG TILL NY */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={styles.sectionLabel}>LÄGG TILL NY BUTIK</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="Butiksnamn..."
              placeholderTextColor={colors.subText}
              value={newStoreName}
              onChangeText={setNewStoreName}
            />

            <Text style={[styles.sectionLabel, { marginTop: 15 }]}>VÄLJ KATEGORI</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id}
                  onPress={() => {
                    setSelectedCat(cat);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.catPill, 
                    { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                    selectedCat.id === cat.id && { backgroundColor: cat.color }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name={cat.icon as any} 
                    size={18} 
                    color={selectedCat.id === cat.id ? '#fff' : colors.subText} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={addStore}>
              <Text style={styles.addBtnText}>Spara butik</Text>
            </TouchableOpacity>
          </View>

          {/* LISTA PÅ SPARADE BUTIKER */}
          <Text style={styles.listHeader}>DINA SPARADE BUTIKER ({stores.length})</Text>
          <View style={[styles.card, { backgroundColor: colors.card, paddingVertical: 0 }]}>
            {stores.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subText }]}>Inga egna butiker tillagda än.</Text>
            ) : (
              stores.map((item, index) => (
                <View 
                  key={item.id} 
                  style={[
                    styles.storeRow, 
                    { borderBottomColor: colors.border, borderBottomWidth: index === stores.length - 1 ? 0 : 1 }
                  ]}
                >
                  <View style={styles.storeInfo}>
                    <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                      <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={[styles.storeName, { color: colors.text }]}>{item.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeStore(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 28, fontWeight: '900' },
  scrollContent: { padding: 20 },
  card: { borderRadius: 24, padding: 20, marginBottom: 25 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#8E8E93', marginBottom: 10, letterSpacing: 1 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, marginBottom: 5 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  catPill: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  addBtn: { height: 55, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listHeader: { marginHorizontal: 10, marginBottom: 10, fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 5 },
  storeInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  storeName: { fontSize: 17, fontWeight: '600' },
  emptyText: { padding: 30, textAlign: 'center', fontSize: 15 },
});