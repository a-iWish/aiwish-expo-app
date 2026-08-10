import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ExpoLinking from 'expo-linking';
import { QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { SharedWishlistScreen } from './src/screens/SharedWishlistScreen';
import { ProductComparisonScreen } from './src/screens/ProductComparisonScreen';
import { SharedListDetailScreen } from './src/screens/SharedListDetailScreen';
import { MainTabs } from './src/navigation/MainTabs';
import { RootStackParamList } from './src/navigation/types';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { queryClient } from './src/lib/queryClient';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

const ONBOARDING_KEY = 'AIWISH_ONBOARDING_DONE';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking: backend share URLs look like https://aiwish.app/wishlist/<token>.
// The aiwish:// scheme + Expo dev URL prefix let those links open the right screen.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL('/'), 'aiwish://', 'https://aiwish.app'],
  config: {
    screens: {
      SharedWishlist: 'wishlist/:token',
      ProductDetail: 'product/:productId',
      Main: {
        screens: {
          Discover: 'discover',
          Wishlist: 'wishlist',
          Settings: 'settings',
        },
      },
    },
  },
};

function AppNavigator() {
  const { colors, isDark } = useTheme();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value) => {
      setOnboardingDone(value === 'true');
    });
  }, []);

  // On web, browser autofill forces a light background on inputs. Re-skin it
  // to match the current theme so fields don't render white on a dark UI.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const doc = (globalThis as { document?: Document }).document;
    if (!doc?.head) return;
    let style = doc.getElementById('aiwish-autofill') as HTMLStyleElement | null;
    if (!style) {
      style = doc.createElement('style');
      style.id = 'aiwish-autofill';
      doc.head.appendChild(style);
    }
    style.innerHTML = `
      input, textarea, select {
        outline: none !important;
        outline-offset: 0 !important;
        box-shadow: none;
      }
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus {
        -webkit-text-fill-color: ${colors.text} !important;
        -webkit-box-shadow: 0 0 0 1000px ${colors.surface} inset !important;
        caret-color: ${colors.text};
        transition: background-color 9999s ease-in-out 0s;
      }
    `;
  }, [colors]);

  // Wait for AsyncStorage check before rendering the navigator
  if (onboardingDone === null) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName={onboardingDone ? 'Main' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="SharedWishlist" component={SharedWishlistScreen} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Compare" component={ProductComparisonScreen} />
        <Stack.Screen name="SharedListDetail" component={SharedListDetailScreen} />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer
              linking={linking}
              fallback={
                <View style={styles.boot}>
                  <ActivityIndicator size="large" />
                </View>
              }
            >
              <AppNavigator />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
