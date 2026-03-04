import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

// Placeholder screens (we'll build these next)
// import { View, Text } from 'react-native';
import OTPScreen from '../screens/OTPScreen';
import WalletBalanceScreen from '../screens/WalletBalanceScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import CardDetailsScreen from '../screens/CardDetailsScreen';

// const Placeholder = ({ route }: any) => (
//   <View
//     style={{
//       flex: 1,
//       backgroundColor: '#121212',
//       alignItems: 'center',
//       justifyContent: 'center',
//     }}
//   >
//     <Text style={{ color: '#fff', fontSize: 18 }}>
//       {route.name} - Coming Soon
//     </Text>
//   </View>
// );

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
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
