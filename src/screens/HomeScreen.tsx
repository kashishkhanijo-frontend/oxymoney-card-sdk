import React, { useState, useEffect } from 'react'; // ← useEffect add karo
import { Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import InputField from '../components/InputField';
import ActionButton from '../components/ActionButton';
import { colors } from '../theme/colors';
import { encryptRequest, decryptResponse } from '../api/cryptoService';
import { generateOTP, verifyOTPAndGetToken } from '../api/authApi';
import { SessionStore } from '../store/sessionStore'; // ← add karo

const HomeScreen = ({ navigation }: any) => {
  const [mobile, setMobile] = useState('');
  const [cardId, setCardId] = useState('');
  const [amount, setAmount] = useState('');

  const [serviceType, setServiceType] = useState('');

  // ← Session initialize karo
  useEffect(() => {
    SessionStore.init({
      clientId: 'SENEXTCLT000194',
      clientToken: 'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
      mobileNumber: '7758886766',
      cardId: 'c20b3210-7bb4-4287-9ad3-39bf0d5d5249',
    });
    console.log('✅ Session initialized:', SessionStore.getAll());
  }, []);

  const testCrypto = async () => {
    try {
      console.log('Testing encryption...');
      const encrypted = await encryptRequest({ mobile: '7758886766' });
      console.log('Encrypted successfully!');
      const decrypted = await decryptResponse(
        encrypted.data,
        encrypted.plainkey,
      );
      console.log('Decrypted result:', JSON.stringify(decrypted));
    } catch (e: any) {
      console.error('Test failed:', e?.message);
    }
  };

  const startOtpFlow = async (
    redirectTo: 'WalletBalance' | 'CardDetails' | 'TransactionHistory',
  ) => {
    const mobileNumber = mobile || SessionStore.getMobileNumber() || '';
    const clientToken =
      SessionStore.getClientToken() || 'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=';
    const clientId = SessionStore.getClientId() || 'SENEXTCLT000194';
    const selectedCardId = cardId || SessionStore.getCardId() || '';

    if (!mobileNumber) {
      Alert.alert('Missing mobile number', 'Please enter mobile number first.');
      return;
    }

    SessionStore.init({
      mobileNumber,
      clientToken,
      clientId,
      cardId: selectedCardId,
      amount,
      serviceType,
      action: redirectTo,
    });

    const otpResult = await generateOTP(mobileNumber, clientToken, clientId);
    if (!otpResult) {
      Alert.alert('OTP failed', 'Unable to send OTP. Please try again.');
      return;
    }

    navigation.navigate('OTP', {
      mobileNumber,
      clientToken,
      clientId,
      redirectTo,
      cardId: selectedCardId,
      amount,
      serviceType,
    });
  };

  // const testVerifyOTP = async () => {
  //   const otpSent = await generateOTP(
  //     '7758886766',
  //     'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
  //     'SENEXTCLT000194',
  //   );

  //   if (!otpSent) {
  //     console.log('OTP generate failed!');
  //     return;
  //   }

  //   const token = await verifyOTPAndGetToken(
  //     '7758886766',
  //     '123456',
  //     'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
  //     'SENEXTCLT000194',
  //   );
  //   console.log('Final Token:', token);
  // };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Card SDK Test</Text>

        <InputField
          label="Mobile Number"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
        />
        <InputField label="Card ID" value={cardId} onChangeText={setCardId} />
        <InputField
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <InputField
          label="Service Type"
          value={serviceType}
          onChangeText={setServiceType}
        />

        <Text style={styles.chooseLabel}>Choose SDK Action:</Text>

        <ActionButton
          label="Wallet Balance"
          bgColor={colors.btnWallet}
          textColor={colors.btnTextDark}
          onPress={() => startOtpFlow('WalletBalance')}
        />
        <ActionButton
          label="Card Details"
          bgColor={colors.btnCard}
          textColor={colors.btnTextDark}
          onPress={() => startOtpFlow('CardDetails')}
        />
        <ActionButton
          label="Transaction History"
          bgColor={colors.btnTransaction}
          textColor={colors.btnTextDark}
          onPress={() => startOtpFlow('TransactionHistory')}
        />
        
        {/* <ActionButton
          label="Test OTP Screen"
          bgColor="#888888"
          textColor="#FFFFFF"
          onPress={() =>
            navigation.navigate('OTP', {
              mobileNumber: mobile || SessionStore.getMobileNumber() || '',
              clientToken:
                SessionStore.getClientToken() ||
                'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
              clientId: SessionStore.getClientId() || 'SENEXTCLT000194',
            })
          }
        /> */}
        {/* <ActionButton
          label="📱 Test OTP API"
          bgColor="#2C3E7A"
          textColor="#FFFFFF"
          onPress={testOTPApi}
        /> */}
        
        {/* <ActionButton
          label="✅ Verify OTP"
          bgColor="#008000"
          textColor="#FFFFFF"
          onPress={testVerifyOTP}
        /> */}

        <ActionButton
          label="🔐 Test Crypto"
          bgColor="#2C3E7A"
          textColor="#FFFFFF"
          onPress={testCrypto}
        />

        {/* <ActionButton
          label="💳 Test Card Details"
          bgColor="#8B0000"
          textColor="#FFFFFF"
          onPress={testCardDetails}
        />

        <ActionButton
          label="📱 Test Wallet API"
          bgColor="#cfee36"
          textColor="#0a0909"
          onPress={testWalletBalance}
        /> */}


      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingTop: 30 },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 28,
  },
  chooseLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default HomeScreen;
