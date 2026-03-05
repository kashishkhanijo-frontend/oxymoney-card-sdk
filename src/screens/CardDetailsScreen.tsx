import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Colors from '../theme/colors';
import {
  getCardDetails,
  getCardChannel,
  updateCardChannel,
  setCardStatus,
  blockCard,
  generateCardOTP,
  setCardPin,
} from '../api/cardApi';

interface CardData {
  card_no: string;
  cvv: string;
  expiry_date: string;
  cardholder_name: string;
  company_name: string;
  card_usage_status: string;
  type_of_card: string;
}

const CardDetailsScreen = () => {
  const navigation = useNavigation();
  const [showCardBack, setShowCardBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [ecomEnabled, setEcomEnabled] = useState(false);
  const [channelLoading, setChannelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  // ─── Set PIN States ───────────────────────────────────────────────────────
  const [pinStep, setPinStep] = useState<'otp' | 'pin' | null>(null);
  const [pinOtp, setPinOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const [cardData, setCardData] = useState<CardData>({
    card_no: '•••• •••• •••• ••••',
    cvv: '•••',
    expiry_date: '••/••',
    cardholder_name: '',
    company_name: '',
    card_usage_status: 'ENABLED',
    type_of_card: 'GPR',
  });

  const fetchCardDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await getCardDetails();
      if (data?.cvv) {
        setCardData({
          card_no: data.card_no || '•••• •••• •••• ••••',
          cvv: data.cvv || '•••',
          expiry_date: data.expiry_date || '••/••',
          cardholder_name: data.cardholder_name || '',
          company_name: data.company_name || '',
          card_usage_status: data.card_usage_status || 'ENABLED',
          type_of_card: data.type_of_card || 'GPR',
        });
      } else {
        throw new Error('Card data not found');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Unable to fetch card details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChannel = useCallback(async () => {
    try {
      const data = await getCardChannel();
      if (data?.ecom?.status !== undefined) {
        setEcomEnabled(data.ecom.status === 'ENABLED');
      }
    } catch (e: any) {
      console.error('Channel fetch error:', e?.message);
    }
  }, []);

  useEffect(() => {
    fetchCardDetails();
    fetchChannel();
  }, [fetchCardDetails, fetchChannel]);

  const handleEcomToggle = async (value: boolean) => {
    setChannelLoading(true);
    try {
      const success = await updateCardChannel({ECOM: value});
      if (success) {
        setEcomEnabled(value);
        Alert.alert('Success', `E-Commerce ${value ? 'enabled' : 'disabled'}`);
      } else {
        Alert.alert('Error', 'Failed to update channel');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setChannelLoading(false);
    }
  };

  const handleToggleCardStatus = async () => {
    const isEnabled = cardData.card_usage_status === 'ENABLED';
    const newStatus = isEnabled ? 'DISABLED' : 'ENABLED';
    Alert.alert(
      `${isEnabled ? 'Disable' : 'Enable'} Card`,
      `Are you sure you want to ${isEnabled ? 'disable' : 'enable'} this card?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading('status');
            try {
              const success = await setCardStatus(newStatus);
              if (success) {
                setCardData(prev => ({...prev, card_usage_status: newStatus}));
                Alert.alert('Success', `Card ${newStatus.toLowerCase()}`);
              } else {
                Alert.alert('Error', 'Failed to update card status');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Something went wrong');
            } finally {
              setActionLoading('');
            }
          },
        },
      ],
    );
  };

  const handleBlockCard = async () => {
    Alert.alert(
      'Block Card',
      'Are you sure you want to block this card?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('block');
            try {
              const success = await blockCard();
              if (success) {
                Alert.alert('Card Blocked', 'Your card has been blocked.', [
                  {text: 'OK', onPress: () => navigation.goBack()},
                ]);
              } else {
                Alert.alert('Error', 'Failed to block card');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Something went wrong');
            } finally {
              setActionLoading('');
            }
          },
        },
      ],
    );
  };

  // ─── Set PIN Flow — seedha OTP modal dikhao ──────────────────────────────
const handleSetPin = () => {
  setPinOtp('');
  setNewPin('');
  setConfirmPin('');
  setPinStep('otp');  // ← seedha OTP modal open karo, koi API call nahi
};

  const handleOtpSubmit = () => {
    if (pinOtp.length !== 6) {
      Alert.alert('Error', 'Please enter 6 digit OTP');
      return;
    }
    setNewPin('');
    setConfirmPin('');
    setPinStep('pin');
  };

  const handlePinSubmit = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    setPinLoading(true);
    try {
      const success = await setCardPin(pinOtp, newPin);
      if (success) {
        setPinStep(null);
        Alert.alert('Success', 'PIN set successfully!');
      } else {
        Alert.alert('Error', 'Failed to set PIN. Check OTP and try again.');
        setPinStep(null);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong');
    } finally {
      setPinLoading(false);
    }
  };

  const formatCardNumber = (num: string): string => {
    const clean = num.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || num;
  };

  const isEnabled = cardData.card_usage_status === 'ENABLED';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Card Details</Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={Colors.white} />
              <Text style={styles.stateText}>Loading card details...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchCardDetails}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowCardBack(!showCardBack)}>
                <Image
                  source={
                    showCardBack
                      ? require('../assets/images/backcardgpr.png')
                      : require('../assets/images/frontcardgpr.png')
                  }
                  style={styles.cardImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.tapHint}>Tap card to flip</Text>

              <View style={styles.cardInfoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Card Number</Text>
                  <Text style={styles.infoValue}>{formatCardNumber(cardData.card_no)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expiry</Text>
                  <Text style={styles.infoValue}>{cardData.expiry_date}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>CVV</Text>
                  <Text style={styles.infoValue}>{cardData.cvv}</Text>
                </View>
                {cardData.cardholder_name ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Name</Text>
                      <Text style={styles.infoValue}>{cardData.cardholder_name}</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.generalText}>{cardData.type_of_card}</Text>
                <View style={[styles.statusBadge, {backgroundColor: isEnabled ? 'rgba(0,200,0,0.2)' : 'rgba(200,0,0,0.2)'}]}>
                  <Text style={[styles.statusText, {color: isEnabled ? '#00C800' : '#C80000'}]}>
                    {cardData.card_usage_status}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {!isLoading && !errorMessage && (
          <View style={styles.manageSection}>
            <Text style={styles.sectionTitle}>Manage Card</Text>
            <View style={styles.manageRow}>

              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleToggleCardStatus}
                disabled={actionLoading === 'status'}>
                {actionLoading === 'status' ? (
                  <ActivityIndicator size="small" color={Colors.orange} />
                ) : (
                  <Text style={styles.manageIcon}>{isEnabled ? '🔒' : '🔓'}</Text>
                )}
                <Text style={styles.manageLabel}>
                  {isEnabled ? 'Disable\nCard' : 'Enable\nCard'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleBlockCard}
                disabled={actionLoading === 'block'}>
                {actionLoading === 'block' ? (
                  <ActivityIndicator size="small" color={Colors.orange} />
                ) : (
                  <Text style={styles.manageIcon}>❗</Text>
                )}
                <Text style={styles.manageLabel}>Block{'\n'}Card</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleSetPin}
                disabled={actionLoading === 'pin' || pinLoading}>
                {pinLoading && pinStep === null ? (
                  <ActivityIndicator size="small" color={Colors.orange} />
                ) : (
                  <Text style={styles.manageIcon}>🔑</Text>
                )}
                <Text style={styles.manageLabel}>Set{'\n'}PIN</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Channel Update</Text>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>E-Commerce</Text>
              {channelLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Switch
                  value={ecomEnabled}
                  onValueChange={handleEcomToggle}
                  trackColor={{false: '#767577', true: Colors.primaryLight}}
                  thumbColor={ecomEnabled ? Colors.primary : '#f4f3f4'}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── OTP Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={pinStep === 'otp'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit OTP sent to your mobile
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pinOtp}
              onChangeText={setPinOtp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="______"
              placeholderTextColor="#999"
              textAlign="center"
              secureTextEntry
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPinStep(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleOtpSubmit}>
                <Text style={styles.modalConfirmText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── PIN Modal ─────────────────────────────────────────────────────── */}
      <Modal visible={pinStep === 'pin'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set PIN</Text>
            <Text style={styles.modalSubtitle}>Enter a 4-digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={setNewPin}
              keyboardType="numeric"
              maxLength={4}
              placeholder="New PIN"
              placeholderTextColor="#999"
              textAlign="center"
              secureTextEntry
            />
            <TextInput
              style={[styles.pinInput, {marginTop: 12}]}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={4}
              placeholder="Confirm PIN"
              placeholderTextColor="#999"
              textAlign="center"
              secureTextEntry
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPinStep(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handlePinSubmit}
                disabled={pinLoading}>
                {pinLoading ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Set PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  backButton: {padding: 16},
  backArrow: {color: '#000', fontSize: 24},
  cardSection: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {color: Colors.white, fontSize: 22, fontWeight: 'bold', marginBottom: 16},
  cardImage: {width: '100%', height: 200, borderRadius: 16},
  tapHint: {color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 16},
  cardInfoBox: {backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 16},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6},
  infoLabel: {color: 'rgba(255,255,255,0.6)', fontSize: 13},
  infoValue: {color: Colors.white, fontSize: 14, fontWeight: '600', letterSpacing: 1},
  divider: {height: 1, backgroundColor: 'rgba(255,255,255,0.15)'},
  statusRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  generalText: {color: 'rgba(255,255,255,0.7)', fontSize: 14},
  statusBadge: {borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4},
  statusText: {fontSize: 12, fontWeight: '700'},
  stateContainer: {alignItems: 'center', paddingVertical: 40},
  stateText: {color: Colors.white, marginTop: 12, fontSize: 14},
  errorText: {color: '#FFDFDF', fontSize: 14, textAlign: 'center', marginBottom: 12},
  retryBtn: {backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10},
  retryBtnText: {color: Colors.primary, fontWeight: '600'},
  manageSection: {backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginBottom: 30},
  sectionTitle: {color: Colors.white, fontSize: 18, fontWeight: 'bold', marginBottom: 16},
  manageRow: {flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24},
  manageButton: {
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: 90,
    minHeight: 80,
    justifyContent: 'center',
  },
  manageIcon: {fontSize: 24, marginBottom: 8},
  manageLabel: {color: Colors.white, fontSize: 12, textAlign: 'center'},
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: 12,
    padding: 16,
  },
  channelLabel: {color: Colors.white, fontSize: 16},
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    color: '#000',
    letterSpacing: 8,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {color: Colors.primary, fontWeight: '600'},
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  modalConfirmText: {color: Colors.white, fontWeight: '600'},
});

export default CardDetailsScreen;