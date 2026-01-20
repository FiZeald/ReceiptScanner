import { 
  StyleSheet, Text, TouchableOpacity, View, Image, 
  TextInput, KeyboardAvoidingView, Platform, 
  ScrollView, Animated, Easing, ActionSheetIOS, Switch 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext'; 
import { useReceipts } from '../hooks/useReceipts';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SaveReceiptPage() {
  const { colors, isDark } = useTheme();
  const { analyzeImage, saveReceipt, isAnalyzing } = useReceipts();
  const { imageUri: initialImageUri } = useLocalSearchParams();
  const [currentImageUri, setCurrentImageUri] = useState<string | null>(initialImageUri as string || null);
  const router = useRouter();

  // --- FORM STATES ---
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [warranty, setWarranty] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStores, setCustomStores] = useState<any[]>([]);

  // --- SHARED EXPENSE STATES ---
  const [isSplit, setIsSplit] = useState(false);
  const [personName, setPersonName] = useState('');
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [recentPeople, setRecentPeople] = useState<string[]>([]);

  const scanAnim = useRef(new Animated.Value(0)).current;

  // Ladda in data vid start
  useEffect(() => {
    const loadInitialData = async () => {
      const [savedStores, savedPeople] = await Promise.all([
        AsyncStorage.getItem('custom_stores'),
        AsyncStorage.getItem('recent_people')
      ]);
      if (savedStores) setCustomStores(JSON.parse(savedStores));
      if (savedPeople) setRecentPeople(JSON.parse(savedPeople));
    };
    loadInitialData();
  }, []);

  // Analysera bild om den finns
  useEffect(() => {
    if (currentImageUri) {
      startScanAnimation();
      analyzeImage(currentImageUri).then(data => {
        if (data) {
          setStoreName(data.storeName || '');
          setAmount(data.totalAmount?.toString() || '');
          if (data.date) setDate(new Date(data.date));
        }
      });
    }
  }, [currentImageUri]);

  // --- BERÄKNINGAR ---
  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const splitAmount = sharedWith.length > 0 ? (parsedAmount / (sharedWith.length + 1)).toFixed(2) : parsedAmount.toFixed(2);

  // --- HJÄLPFUNKTIONER ---
  const getStoreDetails = (name: string) => {
    const s = name.toLowerCase();
    const customMatch = customStores.find(cs => s.includes(cs.name.toLowerCase()));
    if (customMatch) {
      return { icon: customMatch.icon || 'storefront', color: customMatch.color || colors.accent, brand: customMatch.name };
    }
    if (s.includes('ica')) return { icon: 'cart', color: '#E12122', brand: 'ICA' };
    if (s.includes('coop')) return { icon: 'cart', color: '#00843D', brand: 'Coop' };
    if (s.includes('ikea')) return { icon: 'home', color: '#0051BA', brand: 'IKEA' };
    if (s.includes('apple')) return { icon: 'apple', color: isDark ? '#fff' : '#000', brand: 'Apple' };
    if (s.includes('h&m') || s.includes('hm')) return { icon: 'tshirt-crew', color: '#CF102D', brand: 'H&M' };
    if (s.includes('elgiganten')) return { icon: 'lightning-bolt', color: '#003366', brand: 'Elgiganten' };
    return { icon: 'storefront-outline', color: colors.accent, brand: null };
  };

  const storeInfo = getStoreDetails(storeName);

  const getWarrantyEndDate = () => {
    if (warranty === 0) return null;
    const endDate = new Date(date);
    endDate.setFullYear(endDate.getFullYear() + warranty);
    return endDate.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleAddPerson = (name: string) => {
    const cleanName = name.trim();
    if (cleanName.length > 0 && !sharedWith.includes(cleanName)) {
      setSharedWith([...sharedWith, cleanName]);
      setPersonName('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removePerson = (name: string) => {
    setSharedWith(sharedWith.filter(p => p !== name));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  };

  const handleImagePick = async () => {
    const options = ['Ta nytt kort', 'Välj från galleri', 'Avbryt'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, title: 'Uppdatera kvitto' },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          if (buttonIndex === 1) launchLibrary();
        }
      );
    } else {
      launchLibrary();
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setCurrentImageUri(result.assets[0].uri);
  };

  const launchLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) setCurrentImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!storeName || !amount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (isSplit && sharedWith.length > 0) {
      const updatedRecent = Array.from(new Set([...sharedWith, ...recentPeople])).slice(0, 5);
      await AsyncStorage.setItem('recent_people', JSON.stringify(updatedRecent));
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const success = await saveReceipt({
      store_name: storeName,
      total_amount: parsedAmount,
      date: date.toISOString(),
      warranty_years: warranty,
      image_uri: currentImageUri,
      is_split: isSplit,
      shared_with: isSplit ? sharedWith : []
    });
    if (success) router.replace('/(tabs)');
  };

  const translateY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 195] });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close-circle" size={32} color={colors.subText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Granska kvitto</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity activeOpacity={0.9} onPress={handleImagePick} style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {currentImageUri ? (
              <>
                <Image source={{ uri: currentImageUri }} style={styles.image} resizeMode="cover" />
                <View style={styles.editBadge}><Ionicons name="camera" size={18} color="#fff" /></View>
                {isAnalyzing && (
                  <>
                    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                    <View style={styles.analyzingChip}><Text style={styles.analyzingText}>Analyserar...</Text></View>
                  </>
                )}
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="cloud-upload-outline" size={40} color={colors.accent} />
                <Text style={[styles.placeholderText, { color: colors.subText }]}>Lägg till bild</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            <View style={[styles.inputGroup, { backgroundColor: colors.card, borderWidth: storeInfo.brand ? 1.5 : 0, borderColor: storeInfo.color + '40' }]}>
              <View style={[styles.iconBox, { backgroundColor: storeInfo.color + '15' }]}>
                <MaterialCommunityIcons name={storeInfo.icon as any} size={22} color={storeInfo.color} />
              </View>
              <TextInput 
                style={[styles.modernInput, { color: colors.text, marginLeft: 10 }]} 
                placeholder="Butiksnamn"
                placeholderTextColor={colors.subText}
                value={storeName} 
                onChangeText={setStoreName} 
              />
              {storeInfo.brand && (
                <View style={[styles.verifiedBadge, { backgroundColor: storeInfo.color }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>
              )}
            </View>

            <View style={styles.splitRow}>
              <View style={[styles.inputGroup, { flex: 1.2, backgroundColor: colors.card }]}>
                <Text style={styles.currencyPrefix}>kr</Text>
                <TextInput 
                  style={[styles.modernInput, { color: colors.text }]} 
                  value={amount} 
                  keyboardType="numeric"
                  onChangeText={setAmount} 
                  placeholder="0.00"
                  placeholderTextColor={colors.subText}
                />
              </View>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.inputGroup, { flex: 1, marginLeft: 12, backgroundColor: colors.card }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} style={styles.inputIcon} />
                <Text style={{ color: colors.text, fontWeight: '700' }}>{date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.warrantySection}>
              <View style={styles.warrantyHeader}>
                <Text style={[styles.sectionLabel, { color: colors.subText }]}>GARANTITID</Text>
                {warranty > 0 && <Text style={styles.warrantyEndText}>Gäller t.o.m. {getWarrantyEndDate()}</Text>}
              </View>
              <View style={[styles.seamlessWarranty, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                {[0, 1, 2, 3, 5].map((year) => (
                  <TouchableOpacity key={year} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWarranty(year); }} style={[styles.warrantyPill, warranty === year && styles.activePill]}>
                    <Text style={[styles.warrantyPillText, { color: warranty === year ? '#fff' : colors.subText }]}>{year === 0 ? 'Ingen' : `${year} år`}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* --- DELAT KÖP MODUL --- */}
            <View style={[styles.sharedSection, { backgroundColor: colors.card }]}>
              <View style={styles.sharedHeader}>
                <View style={styles.sharedLabelGroup}>
                  <Ionicons name="people" size={20} color={colors.accent} />
                  <Text style={[styles.sharedLabel, { color: colors.text }]}>Delat köp</Text>
                </View>
                <Switch 
                  value={isSplit}
                  onValueChange={(val) => { setIsSplit(val); Haptics.selectionAsync(); }}
                  trackColor={{ false: '#767577', true: '#28a745' }}
                />
              </View>

              {isSplit && (
                <View style={styles.sharedContent}>
                  {/* SNABBVAL FÖR VÄNNER */}
                  {recentPeople.length > 0 && (
                    <View style={styles.recentRow}>
                      {recentPeople.filter(p => !sharedWith.includes(p)).map((person) => (
                        <TouchableOpacity key={person} onPress={() => handleAddPerson(person)} style={[styles.recentPill, { borderColor: colors.accent + '40' }]}>
                          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>+ {person}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.addPersonInputRow}>
                    <TextInput 
                      style={[styles.personInput, { color: colors.text, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                      placeholder="Namn..."
                      placeholderTextColor={colors.subText}
                      value={personName}
                      onChangeText={setPersonName}
                      onSubmitEditing={() => handleAddPerson(personName)}
                    />
                    <TouchableOpacity onPress={() => handleAddPerson(personName)} style={[styles.addBtn, { backgroundColor: colors.accent }]}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
                  </View>

                  {/* VISUELL UTRÄKNINGSKORT */}
                  {sharedWith.length > 0 && (
                    <View style={[styles.calcCard, { backgroundColor: colors.accent + '10' }]}>
                      <View style={styles.calcRow}>
                        <Text style={[styles.calcLabel, { color: colors.subText }]}>Totalt per person</Text>
                        <Text style={[styles.calcValue, { color: colors.accent }]}>{splitAmount} kr</Text>
                      </View>
                      <View style={styles.pillsContainer}>
                        <View style={[styles.personPill, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.personText, { color: '#fff' }]}>Du</Text>
                        </View>
                        {sharedWith.map((person) => (
                          <TouchableOpacity key={person} onPress={() => removePerson(person)} style={[styles.personPill, { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                            <Text style={[styles.personText, { color: colors.text }]}>{person}</Text>
                            <Ionicons name="close-circle" size={16} color={colors.subText} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={[styles.mainButton, { backgroundColor: '#28a745', opacity: isAnalyzing ? 0.7 : 1 }]} onPress={handleSave} disabled={isAnalyzing}>
            <Text style={styles.mainButtonText}>Spara kvitto</Text>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'inline' : 'default'} onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { padding: 20 },
  imageCard: { height: 220, borderRadius: 28, overflow: 'hidden', borderWidth: 1, marginBottom: 30, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#28a745', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  scanLine: { position: 'absolute', width: '100%', height: 2, backgroundColor: '#28a745', zIndex: 10 },
  analyzingChip: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, bottom: 20 },
  analyzingText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { marginTop: 10, fontWeight: '700', fontSize: 15 },
  formContainer: { gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', height: 62, borderRadius: 18, paddingHorizontal: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  inputIcon: { marginRight: 12 },
  currencyPrefix: { marginRight: 8, fontWeight: '800', color: '#28a745', fontSize: 16 },
  modernInput: { flex: 1, fontSize: 16, fontWeight: '600' },
  splitRow: { flexDirection: 'row' },
  warrantySection: { marginTop: 10 },
  warrantyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  warrantyEndText: { fontSize: 11, fontWeight: '700', color: '#28a745' },
  seamlessWarranty: { flexDirection: 'row', padding: 5, borderRadius: 16 },
  warrantyPill: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activePill: { backgroundColor: '#28a745' },
  warrantyPillText: { fontSize: 13, fontWeight: '700' },
  sharedSection: { marginTop: 5, borderRadius: 22, padding: 16 },
  sharedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sharedLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sharedLabel: { fontSize: 16, fontWeight: '700' },
  sharedContent: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  recentPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  addPersonInputRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  personInput: { flex: 1, height: 48, borderRadius: 12, paddingHorizontal: 15, fontWeight: '600' },
  addBtn: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  calcCard: { padding: 15, borderRadius: 18, marginTop: 5 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calcLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  calcValue: { fontSize: 20, fontWeight: '900' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  personText: { fontSize: 14, fontWeight: '700' },
  mainButton: { flexDirection: 'row', height: 65, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginTop: 25, gap: 12 },
  mainButtonText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});