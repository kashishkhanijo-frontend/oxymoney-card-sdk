import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/colors'
import { Image } from 'react-native';

const CardDetailsScreen = () => {
  const navigation = useNavigation();
  const [ecommerceEnabled, setEcommerceEnabled] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Card Section */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Card Details</Text>

          {/* Toggle Front/Back */}
          <TouchableOpacity onPress={() => setShowCardBack(!showCardBack)}>
            {showCardBack ? (
              /* Card Back */
              <Image
                source={require('../assets/images/backcardgpr.png')}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              /* Card Front */
              <Image
                source={require('../assets/images/frontcardgpr.png')}
                style={styles.cardImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>

          <Text style={styles.tapHint}>Tap card to flip</Text>

          {/* General / Balance */}
          <View style={styles.generalRow}>
            <Text style={styles.generalIcon}>🪙</Text>
            <View>
              <Text style={styles.generalText}>General</Text>
              <Text style={styles.generalAmount}>₹0.0</Text>
            </View>
          </View>
        </View>

        {/* Manage Card */}
        <View style={styles.manageSection}>
          <Text style={styles.sectionTitle}>Manage Card</Text>
          <View style={styles.manageRow}>
            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageIcon}>👁</Text>
              <Text style={styles.manageLabel}>Disable{'\n'}Card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageIcon}>❗</Text>
              <Text style={styles.manageLabel}>Block{'\n'}Card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.manageButton}>
              <Text style={styles.manageIcon}>👁</Text>
              <Text style={styles.manageLabel}>Set{'\n'}PIN</Text>
            </TouchableOpacity>
          </View>

          {/* Channel Update */}
          <Text style={styles.sectionTitle}>Channel Update</Text>
          <View style={styles.channelRow}>
            <Text style={styles.channelLabel}>E-Commerce</Text>
            <Switch
              value={ecommerceEnabled}
              onValueChange={setEcommerceEnabled}
              trackColor={{ false: '#767577', true: Colors.primaryLight }}
              thumbColor={ecommerceEnabled ? Colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.background,
  },
  backButton: {
    padding: 16,
  },
  backArrow: {
    // color: Colors.white,
    color:'#000',
    fontSize: 24,
  },
  cardSection: {
    backgroundColor: Colors.primary,
    // marginHorizontal: 16,
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
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  // Card Front
  cardFront: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    height: 200,
    justifyContent: 'space-between',
  },
  cardFrontTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  oxyBadge: {
    flexDirection: 'row',
    backgroundColor: Colors.orange,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  oxyText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  moneyText: {
    color: Colors.white,
    fontSize: 14,
  },
  tapIcon: {
    color: Colors.orange,
    fontSize: 18,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: '#D4AF37',
    borderRadius: 4,
  },
  cardFrontBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  riseText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 14,
  },
  corporateRow: {
    alignItems: 'flex-end',
  },
  corporateText: {
    color: Colors.white,
    fontSize: 12,
  },
  rupayText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'right',
  },
  // Card Back
  cardBack: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    height: 200,
    justifyContent: 'space-between',
  },
  cardBackTopText: {
    color: '#888',
    fontSize: 8,
  },
  magneticStripe: {
    backgroundColor: '#333',
    height: 40,
    marginVertical: 8,
  },
  cvvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cvvBox: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
    alignItems: 'flex-end',
  },
  cvvText: {
    color: '#333',
    fontWeight: 'bold',
  },
  authorizedText: {
    color: '#888',
    fontSize: 10,
  },
  cardNumber: {
    color: Colors.orange,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  validLabel: {
    color: '#888',
    fontSize: 8,
  },
  validDate: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  swipeText: {
    color: Colors.orange,
    fontSize: 10,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  generalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  generalIcon: {
    fontSize: 24,
  },
  generalText: {
    color: '#CCC',
    fontSize: 14,
  },
  generalAmount: {
    color: '#CCC',
    fontSize: 12,
  },
  // Manage Card
  manageSection: {
    backgroundColor: Colors.primary,
    // marginHorizontal: 16,
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
  },
  manageIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  manageLabel: {
    color: Colors.white,
    fontSize: 12,
    textAlign: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: 12,
    padding: 16,
  },
  channelLabel: {
    color: Colors.white,
    fontSize: 16,
  },
});

export default CardDetailsScreen;
