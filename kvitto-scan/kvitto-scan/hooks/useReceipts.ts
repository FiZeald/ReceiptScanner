import { useState } from 'react';
import { API_URL } from '../constants/Config';

export const useReceipts = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return await response.json();
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReceipt = async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (e) {
      return false;
    }
  };

  return { analyzeImage, saveReceipt, isAnalyzing };
};