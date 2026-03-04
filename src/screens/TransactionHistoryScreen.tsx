import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const {height} = Dimensions.get('window');

const DUMMY_TRANSACTIONS = [
  {
    id: 1,
    invoiceNumber: 'INV-2024-001',
    referenceNumber: 'REF123456789',
    description: 'Card Transaction - Amazon Pay',
    requestDate: '21-04-2025 17:16:39',
    txnType: 'DEBIT',
    amount: '1500.00',
    closingBalance: '8500.00',
    txnStatus: 'SUCCESS',
    channel: 'CARD_TRANSACTION',
  },
 
  {
    id: 2,
    invoiceNumber: 'INV-2024-003',
    referenceNumber: 'REF456789123',
    description: 'Bill Payment - Electricity',
    requestDate: '19-04-2025 09:15:22',
    txnType: 'DEBIT',
    amount: '2200.00',
    closingBalance: '5000.00',
    txnStatus: 'FAILED',
    channel: 'BILL_PAYMENT',
  },
  
];

const formatTransactionDate = (dateString: string) => {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [hour, minute] = timePart.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${day} ${months[parseInt(month) - 1]} ${year} ${h12}:${minute} ${ampm}`;
  } catch {
    return dateString;
  }
};

const formatDateForDetails = (dateString: string) => {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const [hour, minute, second] = timePart.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return {
      date: `${day} ${months[parseInt(month) - 1]} ${year}`,
      time: `${h12}:${minute}:${second} ${ampm}`,
    };
  } catch {
    return {date: '', time: ''};
  }
};

const getStatusStyle = (status: string) => {
  const s = status?.toUpperCase();
  if (s === 'SUCCESS') return styles.successStatus;
  if (s === 'FAILED') return styles.failedStatus;
  return styles.pendingStatus;
};

const getStatusTextColor = (status: string) => {
  const s = status?.toUpperCase();
  if (s === 'SUCCESS') return {color: '#08A638'};
  if (s === 'FAILED') return {color: '#F90202'};
  return {color: '#F49A47'};
};

const getStatusText = (status: string) => {
  const s = status?.toUpperCase();
  if (s === 'SUCCESS') return 'Confirmed';
  if (s === 'FAILED') return 'Failed';
  return 'Pending';
};

const TransactionHistoryScreen = () => {
  const navigation = useNavigation();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredTransactions = DUMMY_TRANSACTIONS.filter(t => {
    if (selectedStatus && t.txnStatus !== selectedStatus) return false;
    if (selectedType && t.txnType !== selectedType) return false;
    return true;
  });

  const handleTransactionPress = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDetailsVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closeDetails = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setDetailsVisible(false);
      setSelectedTransaction(null);
    });
  };

  const hasActiveFilters = selectedStatus !== null || selectedType !== null;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <View style={styles.filterIconBtn}>
            <Text style={styles.filterIconText}>⚙</Text>
            {hasActiveFilters && (
              <View style={styles.filterBadge} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>

        {/* Date Range */}
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>Showing transactions from:</Text>
          <Text style={styles.dateRangeText}>01/04/25 - 21/04/25</Text>
        </View>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersRow}>
            {selectedStatus && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setSelectedStatus(null)}>
                <Text style={styles.activeFilterTagText}>
                  {selectedStatus.charAt(0) + selectedStatus.slice(1).toLowerCase()} ✕
                </Text>
              </TouchableOpacity>
            )}
            {selectedType && (
              <TouchableOpacity
                style={styles.activeFilterTag}
                onPress={() => setSelectedType(null)}>
                <Text style={styles.activeFilterTagText}>
                  {selectedType.charAt(0) + selectedType.slice(1).toLowerCase()} ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Recent Transactions ({filteredTransactions.length})
        </Text>

        {/* Transaction List */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedStatus(null);
                  setSelectedType(null);
                }}>
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTransactions.map(transaction => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.8}>

                {/* Row 1 */}
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle} numberOfLines={2}>
                    {transaction.description}
                  </Text>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {color: transaction.txnType === 'CREDIT' ? '#08A638' : '#121214'},
                    ]}>
                    {transaction.txnType === 'CREDIT' ? '+' : '-'}₹{transaction.amount}
                  </Text>
                </View>

                {/* Row 2 */}
                <View style={styles.transactionSubHeader}>
                  <Text style={styles.transactionLabel}>Transaction ID</Text>
                  <View style={getStatusStyle(transaction.txnStatus)}>
                    <Text style={[styles.statusText, getStatusTextColor(transaction.txnStatus)]}>
                      {getStatusText(transaction.txnStatus)}
                    </Text>
                  </View>
                </View>

                {/* Row 3 */}
                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionId}>{transaction.invoiceNumber}</Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(transaction.requestDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{height: 30}} />
        </ScrollView>
      </View>

      {/* ── Filter Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Filters</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <Text style={styles.filterLabel}>Transaction Status</Text>
            <View style={styles.pillRow}>
              {['SUCCESS', 'FAILED', 'PENDING'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.pill,
                    selectedStatus === status && styles.pillSelected,
                  ]}
                  onPress={() =>
                    setSelectedStatus(prev => (prev === status ? null : status))
                  }>
                  <Text
                    style={[
                      styles.pillText,
                      selectedStatus === status && styles.pillTextSelected,
                    ]}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Type Filter */}
            <Text style={styles.filterLabel}>Transaction Type</Text>
            <View style={styles.pillRow}>
              {['DEBIT', 'CREDIT'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pill,
                    selectedType === type && styles.pillSelected,
                  ]}
                  onPress={() =>
                    setSelectedType(prev => (prev === type ? null : type))
                  }>
                  <Text
                    style={[
                      styles.pillText,
                      selectedType === type && styles.pillTextSelected,
                    ]}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.applyBtnText}>Show Results</Text>
              </TouchableOpacity>

              {hasActiveFilters && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setSelectedStatus(null);
                    setSelectedType(null);
                    setModalVisible(false);
                  }}>
                  <Text style={styles.clearBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Transaction Details Bottom Sheet ── */}
      <Modal
        animationType="none"
        transparent
        visible={detailsVisible}
        onRequestClose={closeDetails}>
        <View style={styles.detailsModalContainer}>
          <TouchableOpacity
            style={styles.detailsOverlay}
            activeOpacity={1}
            onPress={closeDetails}
          />
          <Animated.View
            style={[
              styles.detailsModalContent,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}>

            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle}>Transaction Details</Text>
            </View>

            {selectedTransaction && (
              <ScrollView>
                <View style={styles.detailsContent}>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Status</Text>
                    <View style={[styles.detailsStatusPill, getStatusStyle(selectedTransaction.txnStatus)]}>
                      <Text style={[styles.detailsStatusText, getStatusTextColor(selectedTransaction.txnStatus)]}>
                        {getStatusText(selectedTransaction.txnStatus)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Transaction Id</Text>
                    <Text style={styles.detailsValue}>{selectedTransaction.invoiceNumber}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Reference Id</Text>
                    <Text style={styles.detailsValue}>{selectedTransaction.referenceNumber}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Date and Time</Text>
                    <View style={styles.dateTimeContainer}>
                      <Text style={styles.detailsValue}>
                        {formatDateForDetails(selectedTransaction.requestDate).date}
                      </Text>
                      <Text style={styles.timeSeparator}>|</Text>
                      <Text style={styles.detailsValue}>
                        {formatDateForDetails(selectedTransaction.requestDate).time}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>To</Text>
                    <Text style={styles.detailsValue}>{selectedTransaction.description}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Type</Text>
                    <Text style={styles.detailsValue}>{selectedTransaction.txnType}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Payment Method</Text>
                    <Text style={styles.detailsValue}>{selectedTransaction.channel}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Amount</Text>
                    <Text style={styles.detailsAmount}>₹{selectedTransaction.amount}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.closeButtonStyled} onPress={closeDetails}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center'},
  backArrow: {fontSize: 24, color: '#121214'},
  headerTitle: {fontSize: 18, fontWeight: '500', color: '#121214', marginLeft: 10},
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconText: {fontSize: 18, color: '#121214'},
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#017EBF',
  },

  // Content
  contentContainer: {flex: 1, paddingHorizontal: 16, paddingTop: 16},
  dateRangeContainer: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateRangeLabel: {color: '#797E82', fontSize: 12, marginBottom: 4},
  dateRangeText: {color: '#121214', fontSize: 14, fontWeight: '500'},

  // Active Filter Tags
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterTag: {
    backgroundColor: '#E8F5FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#017EBF',
  },
  activeFilterTagText: {color: '#017EBF', fontSize: 12, fontWeight: '500'},

  sectionTitle: {color: '#017EBF', fontSize: 16, fontWeight: '500', marginBottom: 16},

  // Transaction Cards
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    borderColor: '#EAEAEA',
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  transactionTitle: {
    color: '#121214',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingRight: 8,
  },
  transactionAmount: {fontSize: 14, fontWeight: '600'},
  transactionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {color: '#797E82', fontSize: 12},
  transactionFooter: {flexDirection: 'row', justifyContent: 'space-between'},
  transactionId: {color: '#121214', fontSize: 12},
  transactionDate: {color: '#797E82', fontSize: 12},

  // Status
  successStatus: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#08A63833'},
  failedStatus: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F9020233'},
  pendingStatus: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF1CC'},
  statusText: {fontSize: 10, fontWeight: '500'},

  // Empty
  emptyContainer: {flex: 1, alignItems: 'center', paddingVertical: 60},
  emptyText: {color: '#797E82', fontSize: 16, marginBottom: 12},
  clearFiltersText: {color: '#017EBF', fontSize: 14, fontWeight: '500', textDecorationLine: 'underline'},

  // Filter Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {fontSize: 18, fontWeight: '600', color: '#121214'},
  modalClose: {fontSize: 20, color: '#121214'},
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#017EBF',
    marginBottom: 12,
    marginTop: 8,
  },
  pillRow: {flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap'},
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#fff',
  },
  pillSelected: {backgroundColor: '#017EBF', borderColor: '#017EBF'},
  pillText: {fontSize: 14, color: '#121214', fontWeight: '500'},
  pillTextSelected: {color: '#fff'},
  modalButtons: {marginTop: 10},
  applyBtn: {
    backgroundColor: '#363636',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  applyBtnText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  clearBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#363636',
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearBtnText: {color: '#363636', fontSize: 14, fontWeight: '500'},

  // Details Modal
  detailsModalContainer: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)'},
  detailsOverlay: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  detailsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: height * 0.5,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsHeaderTitle: {fontSize: 18, fontWeight: '500', color: '#017EBF'},
  detailsContent: {padding: 16},
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsLabel: {fontSize: 14, color: '#797E82'},
  detailsValue: {
    fontSize: 14,
    color: '#121214',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailsStatusPill: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8},
  detailsStatusText: {fontSize: 14, fontWeight: '500'},
  dateTimeContainer: {flexDirection: 'row', alignItems: 'center'},
  timeSeparator: {marginHorizontal: 6, color: '#D0D0D0'},
  detailsAmount: {fontSize: 16, fontWeight: '600', color: '#017EBF'},
  buttonContainer: {paddingHorizontal: 16, paddingTop: 8},
  closeButtonStyled: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {color: '#363636', fontSize: 14, fontWeight: '500'},
});

export default TransactionHistoryScreen;