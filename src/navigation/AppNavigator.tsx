import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CaptureProtection } from "react-native-capture-protection";

import HomeScreen from "../screens/HomeScreen";
import OTPScreen from "../screens/OTPScreen";
import WalletBalanceScreen from "../screens/WalletBalanceScreen";
import TransactionHistoryScreen from "../screens/TransactionHistoryScreen";
import CardDetailsScreen from "../screens/CardDetailsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {

  // 🔐 Screens jaha screenshot ALLOW karna hai
  const SCREENSHOT_ALLOWED_SCREENS = [
    "Home",
    "TransactionHistory",
    "CardDetails",
    "WalletBalance"
  ];

  const getActiveRouteName = (state: any): string => {
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state);
    }
    return route.name;
  };

  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (!state || Platform.OS !== "ios") return;

        const currentRouteName = getActiveRouteName(state);

        console.log("ACTIVE SCREEN:", currentRouteName);

        if (SCREENSHOT_ALLOWED_SCREENS.includes(currentRouteName)) {
          // ✅ Allow screenshot
          CaptureProtection.allow({
            screenshot: true,
            record: true,
            appSwitcher: true,
          });
        } else {
          // ❌ Block screenshot
          CaptureProtection.prevent({
            screenshot: true,
            record: true,
            appSwitcher: true,
          });
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
        <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
        <Stack.Screen name="WalletBalance" component={WalletBalanceScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;