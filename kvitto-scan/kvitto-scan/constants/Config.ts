import { Platform } from 'react-native';

// ÄNDRA DENNA TILL DIN DATORS LOKALA IP (t.ex. 192.168.1.5)
const DEV_IP = '192.168.2.66'; 

export const API_URL = `http://${DEV_IP}:3000`;

export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;