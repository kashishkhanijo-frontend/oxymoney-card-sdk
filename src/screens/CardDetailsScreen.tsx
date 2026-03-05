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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Colors from '../theme/colors';
import {
  getCardDetails,
  getCardChannel,
  updateCardChannel,
  setCardStatus,
  blockCard,
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

  const [cardData, setCardData] = useState<CardData>({
    card_no: '•••• •••• •••• ••••',
    cvv: '•••',
    expiry_date: '••/••',
    cardholder_name: '',
    company_name: '',
    card_usage_status: 'ENABLED',
    type_of_card: 'GPR',
  });

  // ─── Fetch Card Details ───────────────────────────────────────────────────
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

  // ─── Fetch Channel ────────────────────────────────────────────────────────
  const fetchChannel = useCallback(async () => {
    try {
      const data = await getCardChannel();
      console.log('Channel data:', data);
     
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
    console.log("card details pr aagye")
  }, [fetchCardDetails, fetchChannel]);

  // ─── Toggle E-Commerce ────────────────────────────────────────────────────
  const handleEcomToggle = async (value: boolean) => {
    setChannelLoading(true);
    try {
      const success = await updateCardChannel({ ECOM: value });
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

  // ─── Disable / Enable Card ────────────────────────────────────────────────
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
                setCardData(prev => ({
                  ...prev,
                  card_usage_status: newStatus,
                }));
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

  // ─── Block Card ───────────────────────────────────────────────────────────
  const handleBlockCard = async () => {
    Alert.alert(
      'Block Card',
      'Are you sure you want to block this card? This action cannot be undone.',
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

  // ─── Format Card Number ───────────────────────────────────────────────────
  const formatCardNumber = (num: string): string => {
    const clean = num.replace(/\s/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || num;
  };

  const isEnabled = cardData.card_usage_status === 'ENABLED';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Card Section */}
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
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchCardDetails}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Card Image Toggle */}
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

              {/* Card Info */}
              <View style={styles.cardInfoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Card Number</Text>
                  <Text style={styles.infoValue}>
                    {formatCardNumber(cardData.card_no)}
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
              </View>

              {/* Status Badge */}
              <View style={styles.statusRow}>
                <Text style={styles.generalText}>{cardData.type_of_card}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    // eslint-disable-next-line react-native/no-inline-styles
                    {
                      backgroundColor: isEnabled
                        ? 'rgba(0,200,0,0.2)'
                        : 'rgba(200,0,0,0.2)',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      // eslint-disable-next-line react-native/no-inline-styles
                      {color: isEnabled ? '#00C800' : '#C80000'},
                    ]}>
                    {cardData.card_usage_status}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Manage Card */}
        {!isLoading && !errorMessage && (
          <View style={styles.manageSection}>
            <Text style={styles.sectionTitle}>Manage Card</Text>
            <View style={styles.manageRow}>

              {/* Disable / Enable */}
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

              {/* Block Card */}
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

              {/* Set PIN */}
              <TouchableOpacity
                style={styles.manageButton}
                onPress={() =>
                  Alert.alert('Set PIN', 'Set PIN coming soon!')
                }>
                <Text style={styles.manageIcon}>🔑</Text>
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
          </View>
        )}
      </ScrollView>
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
  cardTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardImage: {width: '100%', height: 200, borderRadius: 16},
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  cardInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {color: 'rgba(255,255,255,0.6)', fontSize: 13},
  infoValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generalText: {color: 'rgba(255,255,255,0.7)', fontSize: 14},
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {fontSize: 12, fontWeight: '700'},
  stateContainer: {alignItems: 'center', paddingVertical: 40},
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
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  manageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
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
});

export default CardDetailsScreen;