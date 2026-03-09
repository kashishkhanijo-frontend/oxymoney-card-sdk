/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback, useRef} from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Colors from '../theme/colors';
import {
  getCardDetails,
  getCardChannel,
  updateCardChannel,
  setCardStatus,
  blockCard,
  setCardPin,
} from '../api/cardApi';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px padding on each side

interface CardData {
  card_no: string;
  cvv: string;
  expiry_date: string;
  cardholder_name: string;
  company_name: string;
  card_usage_status: string;
  type_of_card: string;
  is_blocked?: boolean;
}

const resolveCardStatus = (data: any) => {
  const rawStatus = (
    data?.card_usage_status ||
    data?.card_status ||
    data?.status ||
    'ENABLED'
  ).toUpperCase().trim();

  const blockedByFlag = data?.is_blocked === true || data?.blocked === true;
  const blockedByStatus =
    rawStatus.includes('BLOCK') ||
    rawStatus.includes('HOTLIST') ||
    rawStatus === 'INACTIVE' ||
    rawStatus === 'LOCKED';  // ← yeh add karo

  return {
    status: blockedByFlag || blockedByStatus ? 'BLOCKED' : rawStatus,
    isBlocked: blockedByFlag || blockedByStatus,
  };
};

// ─── 3D Card Component ────────────────────────────────────────────────────────
const FlipCard = ({cardData}: {cardData: CardData}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    const newValue = !isFlipped;
    Animated.spring(flipAnimation, {
      toValue: newValue ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setIsFlipped(newValue);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [1, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [89, 90],
    outputRange: [0, 1],
  });

  const formatCardNumber = (num: string): string => {
    const clean = num.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || num;
  };

  return (
    <View style={flipStyles.cardContainer}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={flipCard}
        style={flipStyles.touchable}>

        {/* ── Front Side ── */}
        <Animated.View
          style={[
            flipStyles.cardFace,
            {
              transform: [{rotateY: frontInterpolate}],
              opacity: frontOpacity,
            },
          ]}>
          <Image
            source={require('../assets/images/frontcardgpr.png')}
            style={flipStyles.cardBackground}
            resizeMode="cover"
          />
          {/* Card holder name on front */}
          <View style={flipStyles.frontContent}>
            {cardData.cardholder_name ? (
              <Text style={flipStyles.cardholderName}>
                {cardData.cardholder_name.toUpperCase()}
              </Text>
            ) : null}
          </View>
        </Animated.View>

        {/* ── Back Side ── */}
        <Animated.View
          style={[
            flipStyles.cardFace,
            flipStyles.cardBack,
            {
              transform: [{rotateY: backInterpolate}],
              opacity: backOpacity,
            },
          ]}>
          <Image
            source={require('../assets/images/backcardgpr.png')}
            style={flipStyles.cardBackground}
            resizeMode="cover"
          />
          <View style={flipStyles.backContent}>
            {/* CVV */}
            <View style={flipStyles.cvvContainer}>
              <Text style={flipStyles.cvvLabel}>CVV</Text>
              <Text style={flipStyles.cvvValue}>{cardData.cvv}</Text>
            </View>

            {/* Card Number */}
            <View style={flipStyles.cardNumberContainer}>
              <Text style={flipStyles.cardNumber}>
                {formatCardNumber(cardData.card_no)}
              </Text>
            </View>

            {/* Expiry */}
            <View style={flipStyles.expiryContainer}>
              <Text style={flipStyles.expiryValue}>{cardData.expiry_date}</Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CardDetailsScreen = () => {
  const [blockReasonModal, setBlockReasonModal] = useState(false);
const [selectedBlockReason, setSelectedBlockReason] = useState<string | null>(null);

const BLOCK_REASONS = [
  {id: 'LOST', label: 'Card Lost'},
  {id: 'STOLEN', label: 'Card Stolen'},
  {id: 'DAMAGED', label: 'Card Damaged'},
];
  const navigation = useNavigation();
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
    is_blocked: false,
  });

  // ─── Fetch Card Details ───────────────────────────────────────────────────
  const fetchCardDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await getCardDetails();
      if (data?.cvv) {
        const status = resolveCardStatus(data);
        setCardData({
          card_no: data.card_no || '•••• •••• •••• ••••',
          cvv: data.cvv || '•••',
          expiry_date: data.expiry_date || '••/••',
          cardholder_name: data.cardholder_name || '',
          company_name: data.company_name || '',
          card_usage_status: status.status,
          type_of_card: data.type_of_card || 'GPR',
          is_blocked: status.isBlocked,
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

  // fetchCardDetails aur fetchChannel ke baad — useEffect mein add karo
useEffect(() => {
  if (!isLoading) {
    console.log('═══════════════════════════════');
    console.log('📦 CARD DATA BOUND VALUES:');
    console.log('card_no:', cardData.card_no);
    console.log('cvv:', cardData.cvv);
    console.log('expiry_date:', cardData.expiry_date);
    console.log('cardholder_name:', cardData.cardholder_name);
    console.log('company_name:', cardData.company_name);
    console.log('card_usage_status:', cardData.card_usage_status);
    console.log('type_of_card:', cardData.type_of_card);
    console.log('───────────────────────────────');
    console.log('🔌 DERIVED VALUES:');
    console.log('isEnabled:', cardData.card_usage_status === 'ENABLED');
    console.log('statusBadge:', cardData.card_usage_status === 'ENABLED' ? 'statusBadgeEnabled' : 'statusBadgeDisabled');
    console.log('───────────────────────────────');
    console.log('🔄 CHANNEL STATE:');
    console.log('ecomEnabled:', ecomEnabled);
    console.log('═══════════════════════════════');
  }
}, [isLoading, cardData, ecomEnabled]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
    const blockedState = resolveCardStatus(cardData).isBlocked;
    if (blockedState) {
      Alert.alert('Info', 'Card is already blocked');
      return;
    }
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

  const handleBlockCard = () => {
    const blockedState = resolveCardStatus(cardData).isBlocked;
    if (blockedState) {
      Alert.alert('Info', 'Card is already blocked');
      return;
    }
    setSelectedBlockReason(null);
    setBlockReasonModal(true);
  };

  // const confirmBlockCard = async () => {
  //   const blockedState = resolveCardStatus(cardData).isBlocked;
  //   if (blockedState) {
  //     setBlockReasonModal(false);
  //     Alert.alert('Info', 'Card is already blocked');
  //     return;
  //   }
  //   if (!selectedBlockReason) {
  //     Alert.alert('Error', 'Please select a reason');
  //     return;
  //   }
  //   setBlockReasonModal(false);
  //   setActionLoading('block');
  //   try {
  //     const success = await blockCard(selectedBlockReason);
  //     if (success) {
  //       setCardData(prev => ({
  //         ...prev,
  //         card_usage_status: 'BLOCKED',
  //         is_blocked: true,
  //       }));
  //       Alert.alert('Card Blocked', 'Your card has been blocked.', [
  //         {text: 'OK', onPress: () => navigation.goBack()},
  //       ]);
  //     } else {
  //       Alert.alert('Error', 'Failed to block card');
  //     }
  //   } catch (e: any) {
  //     Alert.alert('Error', e?.message || 'Something went wrong');
  //   } finally {
  //     setActionLoading('');
  //   }
  // };

  const handleSetPin = () => {
    setPinOtp('');
    setNewPin('');
    setConfirmPin('');
    setPinStep('otp');
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

  const confirmBlockCard = async () => {
  if (!selectedBlockReason) {
    Alert.alert('Error', 'Please select a reason');
    return;
  }
  setBlockReasonModal(false);
  setActionLoading('block');
  try {
    const result = await blockCard(selectedBlockReason);
    if (result === 'success') {
      setCardData(prev => ({
        ...prev,
        card_usage_status: 'BLOCKED',
        is_blocked: true,
      }));
      Alert.alert('Card Blocked', 'Your card has been blocked.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } else if (result === 'already_blocked') {
      // Card already blocked hai — local state update karo
      setCardData(prev => ({
        ...prev,
        card_usage_status: 'BLOCKED',
        is_blocked: true,
      }));
      Alert.alert('Info', 'This card is already blocked.');
    } else {
      Alert.alert('Error', 'Failed to block card');
    }
  } catch (e: any) {
    Alert.alert('Error', e?.message || 'Something went wrong');
  } finally {
    setActionLoading('');
  }
};

  const normalizedUsageStatus = (cardData.card_usage_status || '')
    .toUpperCase()
    .trim();
  const isBlocked =
    cardData.is_blocked === true ||
    normalizedUsageStatus.includes('BLOCK') ||
    normalizedUsageStatus.includes('HOTLIST');
  const isEnabled = normalizedUsageStatus === 'ENABLED' && !isBlocked;
  const statusBadgeStyle = isEnabled
    ? styles.statusBadgeEnabled
    : styles.statusBadgeDisabled;
  const statusTextStyle = isEnabled
    ? styles.statusTextEnabled
    : styles.statusTextDisabled;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Card Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Card Section ── */}
        <View style={styles.cardSection}>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={Colors.white} />
              <Text style={styles.stateText}>Loading card details...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchCardDetails}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 3D Flip Card */}
              <FlipCard cardData={cardData} />
              <Text style={styles.tapHint}>Tap card to flip</Text>

              {/* Status Badge */}
              <View style={styles.statusRow}>
                <Text style={styles.cardTypeText}>{cardData.type_of_card}</Text>
                <View style={[styles.statusBadge, statusBadgeStyle]}>
                  <Text style={[styles.statusText, statusTextStyle]}>
                    {cardData.card_usage_status}
                  </Text>
                </View>
              </View>

              {/* Card Info Box */}
              {/* <View style={styles.cardInfoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Card Number</Text>
                  <Text style={styles.infoValue}>
                    {cardData.card_no.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || cardData.card_no}
                  </Text>
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
                      <Text style={styles.infoValue}>
                        {cardData.cardholder_name}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View> */}
            </>
          )}
        </View>

        {/* ── Manage Card Section ── */}
        {!isLoading && !errorMessage && (
          <View style={styles.manageSection}>
            {!isBlocked ? (
              <>
                <Text style={styles.sectionTitle}>Manage Card</Text>
                <View style={styles.manageRow}>

                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={handleToggleCardStatus}
                    disabled={actionLoading === 'status'}>
                    {actionLoading === 'status' ? (
                      <ActivityIndicator size="small" color={Colors.orange} />
                    ) : (
                      <Text style={styles.manageIcon}>
                        {isEnabled ? '🔒' : '🔓'}
                      </Text>
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
                    disabled={pinLoading}>
                    {pinLoading && pinStep === null ? (
                      <ActivityIndicator size="small" color={Colors.orange} />
                    ) : (
                      <Text style={styles.manageIcon}>🔑</Text>
                    )}
                    <Text style={styles.manageLabel}>Set{'\n'}PIN</Text>
                  </TouchableOpacity>
                </View>

                {/* Channel Update */}
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
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* ─── OTP Modal ───────────────────────────────────────────────────────── */}
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
              placeholder="• • • • • •"
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
                <Text style={styles.modalConfirmText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── PIN Modal ───────────────────────────────────────────────────────── */}
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
              style={[styles.pinInput, styles.pinInputTopSpacing]}
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

      <Modal visible={blockReasonModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Block Card</Text>
      <Text style={styles.modalSubtitle}>Select a reason to block your card</Text>

      {BLOCK_REASONS.map(reason => (
        <TouchableOpacity
          key={reason.id}
          onPress={() => setSelectedBlockReason(reason.id)}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            marginBottom: 8,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: selectedBlockReason === reason.id ? Colors.primary : '#D8E0EC',
            backgroundColor: selectedBlockReason === reason.id ? '#EEF4FF' : '#F8FAFD',
          }}>
          <View style={{
            width: 20, height: 20, borderRadius: 10,
            borderWidth: 2,
            borderColor: selectedBlockReason === reason.id ? Colors.primary : '#ccc',
            backgroundColor: selectedBlockReason === reason.id ? Colors.primary : '#fff',
            marginRight: 12,
          }} />
          <Text style={{
            fontSize: 15,
            fontWeight: '500',
            color: selectedBlockReason === reason.id ? Colors.primary : '#334155',
          }}>
            {reason.label}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.modalBtns}>
        <TouchableOpacity
          style={styles.modalCancelBtn}
          onPress={() => setBlockReasonModal(false)}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalConfirmBtn, {backgroundColor: selectedBlockReason ? '#E53935' : '#ccc'}]}
          onPress={confirmBlockCard}
          disabled={!selectedBlockReason}>
          <Text style={styles.modalConfirmText}>Block Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
};

// ─── Flip Card Styles ─────────────────────────────────────────────────────────
const flipStyles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: 200,
    alignSelf: 'center',
    marginBottom: 12,
    shadowColor: '#0E1530',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 10,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  cardFace: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    position: 'absolute',
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 18,
  },
  frontContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  cardholderName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  backContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    position: 'relative',
  },
  cvvContainer: {
    position: 'absolute',
    top: 79,
    right: 107,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cvvLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginRight: 7,
  },
  cvvValue: {
    color: 'black',
    fontSize: 13,
    fontWeight: '700',
  },
  cardNumberContainer: {
    position: 'absolute',
    top: 114,
    left: 18,
    right: 18,
  },
  cardNumber: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 2,
  },
  expiryContainer: {
    position: 'absolute',
    bottom: 53,
    left: 132,
  },
  expiryValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F1F4FA'},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 28},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    shadowColor: '#1B2430',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  backArrow: {color: '#1F2937', fontSize: 22},
  headerTitle: {color: '#111827', fontSize: 18, fontWeight: '700'},
  headerSpacer: {width: 24},
  cardSection: {
    backgroundColor: '#1E2640',
    paddingHorizontal: 16,
    paddingVertical: 18,
    paddingTop: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTypeText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadgeEnabled: {
    backgroundColor: 'rgba(28, 201, 127, 0.15)',
    borderColor: 'rgba(28, 201, 127, 0.35)',
  },
  statusBadgeDisabled: {
    backgroundColor: 'rgba(255, 96, 96, 0.16)',
    borderColor: 'rgba(255, 96, 96, 0.36)',
  },
  statusText: {fontSize: 12, fontWeight: '700'},
  statusTextEnabled: {color: '#34D399'},
  statusTextDisabled: {color: '#FCA5A5'},
  cardInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {color: 'rgba(255,255,255,0.6)', fontSize: 13},
  infoValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  divider: {height: 1, backgroundColor: 'rgba(255,255,255,0.15)'},
  stateContainer: {alignItems: 'center', paddingVertical: 54},
  stateText: {color: Colors.white, marginTop: 12, fontSize: 14},
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
  retryBtnText: {color: Colors.primary, fontWeight: '600'},
  manageSection: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: '#1B2430',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
  },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  manageButton: {
    borderWidth: 1,
    borderColor: '#D8E0EC',
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '31%',
    minHeight: 80,
    justifyContent: 'center',
  },
  manageIcon: {fontSize: 22, marginBottom: 7},
  manageLabel: {
    color: '#334155',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8E0EC',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 16,
  },
  channelLabel: {color: '#1E293B', fontSize: 15, fontWeight: '600'},
  // Modals
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
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#CED8EA',
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    color: '#000',
    letterSpacing: 8,
    backgroundColor: '#F8FAFD',
  },
  pinInputTopSpacing: {marginTop: 12},
  modalBtns: {flexDirection: 'row', gap: 12, marginTop: 20},
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
