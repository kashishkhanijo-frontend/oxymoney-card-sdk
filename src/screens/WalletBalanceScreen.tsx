import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Colors from '../theme/colors'

const WalletBalanceScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Balance</Text>
        <View style={{width: 30}} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.walletTitleRow}>
          <Text style={styles.walletTitle}>My Wallet</Text>
        </View>

        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>₹0.00</Text>
        </View>

        {/* Cashback Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Cashback Balance</Text>
          <Text style={styles.balanceAmount}>₹0.00</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: {
    color: Colors.white,
    fontSize: 24,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  walletTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: Colors.grey,
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
});

export default WalletBalanceScreen;