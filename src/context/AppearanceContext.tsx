import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AppearanceSettings = {
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
  enableAnimations: boolean;
};

const defaultSettings: AppearanceSettings = {
  theme: 'light',
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: 'rounded',
  enableAnimations: true,
};

interface AppearanceContextType {
  appearance: AppearanceSettings;
  setAppearance: (settings: AppearanceSettings) => void;
  reloadAppearance: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceContextType>({
  appearance: defaultSettings,
  setAppearance: () => {},
  reloadAppearance: async () => {},
});

export const useAppearance = () => useContext(AppearanceContext);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultSettings);

  // Load from Supabase on mount
  const reloadAppearance = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'appearance')
        .single();
      if (data && data.data) {
        setAppearance({ ...defaultSettings, ...data.data });
      }
    } catch (e) {
      // fallback to default
      setAppearance(defaultSettings);
    }
  };

  useEffect(() => {
    reloadAppearance();
    // eslint-disable-next-line
  }, []);

  // Apply theme/colors/font to document
  useEffect(() => {
    document.body.classList.toggle('dark', appearance.theme === 'dark');
    document.body.style.setProperty('--primary-color', appearance.primaryColor);
    document.body.style.setProperty('--secondary-color', appearance.secondaryColor);
    document.body.style.fontFamily = appearance.fontFamily;
    document.body.style.setProperty('--border-radius', appearance.borderRadius === 'rounded' ? '0.5rem' : '0.25rem');
    document.body.style.setProperty('--enable-animations', appearance.enableAnimations ? 'all 0.2s' : 'none');
  }, [appearance]);

  return (
    <AppearanceContext.Provider value={{ appearance, setAppearance, reloadAppearance }}>
      {children}
    </AppearanceContext.Provider>
  );
}; 