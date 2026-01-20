import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

// Direkt referens istället för en separat konstant
const OFFLINE_DIR = (FileSystem.documentDirectory || '') + 'offline_receipts/';
const API_URL = 'http://10.0.0.1:3000';

export default function OfflineQueue() {
  const { isDark } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // ... resten av koden är densamma
}