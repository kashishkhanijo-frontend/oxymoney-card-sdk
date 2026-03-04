import React, { useState, useEffect } from 'react'; // ← useEffect add karo
import {
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
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
      const encrypted = await encryptRequest({mobile: '7758886766'});
      console.log('Encrypted successfully!');
      const decrypted = await decryptResponse(encrypted.data, encrypted.plainkey);
      console.log('Decrypted result:', JSON.stringify(decrypted));
    } catch (e: any) {
      console.error('Test failed:', e?.message);
    }
  };

  const testOTPApi = async () => {
    if (!mobile) {
      console.log('Mobile number daalo!');
      return;
    }
    console.log('Mobile:', mobile);
    const result = await generateOTP(
      mobile,
      'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
      'SENEXTCLT000194',
    );
    console.log('OTP Result:', result);
    if (result) {
      navigation.navigate('OTP', {
        mobileNumber: mobile,
        clientToken: 'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
        clientId: 'SENEXTCLT000194',
      });
    }
  };

  const testVerifyOTP = async () => {
    const token = await verifyOTPAndGetToken(
      '7758886766',
      '123456',
      'K7gNU3sdo+OL0wNhqoVWhr3g6s1xYv72ol/pe/Unols=',
      'SENEXTCLT000194',
    );
    console.log('Final Token:', token);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
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
          onPress={() => navigation.navigate('WalletBalance')}
        />
        <ActionButton
          label="Test OTP Screen"
          bgColor="#888888"
          textColor="#FFFFFF"
          onPress={() => navigation.navigate('OTP')}
        />
        <ActionButton
          label="📱 Test OTP API"
          bgColor="#2C3E7A"
          textColor="#FFFFFF"
          onPress={testOTPApi}
        />
        <ActionButton
          label="✅ Verify OTP"
          bgColor="#008000"
          textColor="#FFFFFF"
          onPress={testVerifyOTP}
        />
        <ActionButton
          label="🔐 Test Crypto"
          bgColor="#2C3E7A"
          textColor="#FFFFFF"
          onPress={testCrypto}
        />
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
