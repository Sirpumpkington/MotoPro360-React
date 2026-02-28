import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.theme) {
          setDarkMode(user.user_metadata.theme === 'dark');
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
        }
      } catch (error) {
        console.error('Error cargando preferencia de tema:', error);
      } finally {
        setLoading(false);
      }
    };
    loadThemePreference();
  }, []);

  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: { ...user.user_metadata, theme: darkMode ? 'dark' : 'light' }
          });
        }
      } catch (error) {
        console.error('Error guardando preferencia de tema:', error);
      }
    };
    if (!loading) {
      saveThemePreference();
    }
  }, [darkMode, loading]);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};