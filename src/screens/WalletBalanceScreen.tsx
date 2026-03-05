import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Colors from '../theme/colors';
import {decryptResponse, encryptRequest} from '../api/cryptoService';
import apiClient from '../api/apiClient';

interface WalletUiState {
  walletBalance: number;
  cashbackBalance: number;
}

const BALANCE_KEYS = {
  wallet: [
    'walletBalance',
    'wallet_balance',
    'balance',
    'available_balance',
    'availableBalance',
  ],
  cashback: [
    'cashbackBalance',
    'cashback_balance',
    'cashback',
    'rewardBalance',
    'reward_balance',
  ],
};

const getNumberFromObject = (obj: Record<string, any>, keys: string[]): number => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && value !== '') {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        return num;
      }
    }
  }
  return 0;
};

const parseDecryptedPayload = (rawPayload: unknown): Record<string, any> => {
  if (!rawPayload) {
    return {};
  }

  if (typeof rawPayload === 'object') {
    return rawPayload as Record<string, any>;
  }

  const raw = String(rawPayload).replace(/\u0000/g, '').trim();
  if (!raw) {
    return {};
  }

  const candidates: string[] = [raw];

  const objStart = raw.indexOf('{');
  const objEnd = raw.lastIndexOf('}');
  if (objStart >= 0 && objEnd > objStart) {
    candidates.push(raw.slice(objStart, objEnd + 1));
  }

  const arrStart = raw.indexOf('[');
  const arrEnd = raw.lastIndexOf(']');
  if (arrStart >= 0 && arrEnd > arrStart) {
    candidates.push(raw.slice(arrStart, arrEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'string') {
        try {
          const doubleParsed = JSON.parse(parsed);
          if (doubleParsed && typeof doubleParsed === 'object') {
            return doubleParsed as Record<string, any>;
          }
        } catch {
          continue;
        }
      }
      if (Array.isArray(parsed)) {
        return (parsed[0] || {}) as Record<string, any>;
      }
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, any>;
      }
    } catch {
      continue;
    }
  }

  return {};
};

const WalletBalanceScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [balances, setBalances] = useState<WalletUiState>({
    walletBalance: 0,
    cashbackBalance: 0,
  });

  const fetchWalletBalance = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const encrypted = await encryptRequest({});
      const response = await apiClient.post('/wallet/sender-endpoint/v1/balance', {
        data: encrypted.data,
        key: encrypted.key,
      });

      const encryptedResult = response?.data?.result;
      if (!encryptedResult) {
        throw new Error('Wallet response payload missing.');
      }

      const decrypted = await decryptResponse(encryptedResult, encrypted.plainkey);
      const parsed = parseDecryptedPayload(decrypted);

      if (!Object.keys(parsed).length) {
        throw new Error('Wallet response parse failed.');
      }

      setBalances({
        walletBalance: getNumberFromObject(parsed, BALANCE_KEYS.wallet),
        cashbackBalance: getNumberFromObject(parsed, BALANCE_KEYS.cashback),
      });
    } catch (e: any) {
      setErrorMessage(e?.message || 'Unable to fetch wallet balance.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletBalance();
  }, [fetchWalletBalance]);

  const formatInr = (amount: number): string => `₹${amount.toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Balance</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Row */}
        <View style={styles.walletTitleRow}>
          <Text style={styles.walletTitle}>My Wallet</Text>
        </View>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={Colors.white} />
            <Text style={styles.stateText}>Fetching wallet balances...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchWalletBalance}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Wallet Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatInr(balances.walletBalance)}
              </Text>
            </View>

            {/* Cashback Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Cashback Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatInr(balances.cashbackBalance)}
              </Text>
            </View>
          </>
        )}
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
  headerSpacer: {
    width: 30,
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
  stateContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  stateText: {
    color: Colors.white,
    fontSize: 14,
    marginTop: 10,
  },
  errorText: {
    color: '#FFDFDF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default WalletBalanceScreen;
