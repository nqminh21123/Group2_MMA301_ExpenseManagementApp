// frontend/App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation
import RootNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';

// Context for Auth
import { AuthContext } from './utils/AuthContext';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.log('Error retrieving user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const authContext = {
    user,
    login: async (userData) => {
      try {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        console.log('Error storing user data:', error);
      }
    },
    logout: async () => {
      try {
        await AsyncStorage.removeItem('user');
        setUser(null);
      } catch (error) {
        console.log('Error removing user data:', error);
      }
    }
  };

  if (isLoading) {
    // You can return a loading component here
    return null;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <StatusBar style="auto" />
        {user ? <RootNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}