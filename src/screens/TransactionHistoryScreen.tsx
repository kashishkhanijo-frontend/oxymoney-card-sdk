import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { encryptRequest, decryptResponse } from '../api/cryptoService';
import apiClient from '../api/apiClient';
// import { downloadReport } from '../api/cardApi';

const { height } = Dimensions.get('window');

// ─── Date Helpers ─────────────────────────────────────────────────────────────
const formatDateDisplay = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString().slice(-2);
  return `${d}/${m}/${y}`;
};

const formatDateForAPI = (date: Date, isEnd: boolean) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${isEnd ? '23:59:59' : '00:00:00'}`;
};

const formatTransactionDate = (dateString: string) => {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const [hour, minute] = timePart.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${day} ${
      months[parseInt(month) - 1]
    } ${year} ${h12}:${minute} ${ampm}`;
  } catch {
    return dateString;
  }
};

const formatDateForDetails = (dateString: string) => {
  try {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const [hour, minute, second] = timePart.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return {
      date: `${day} ${months[parseInt(month) - 1]} ${year}`,
      time: `${h12}:${minute}:${second} ${ampm}`,
    };
  } catch {
    return { date: '', time: '' };
  }
};

const getStatusStyle = (status: string) => {
  const s = status?.toUpperCase().trim();
  if (s === 'SUCCESS' || s === 'COMPLETED') return styles.successStatus;
  if (s === 'FAILED') return styles.failedStatus;
  return styles.pendingStatus;
};

const getStatusTextColor = (status: string) => {
  const s = status?.toUpperCase().trim();
  if (s === 'SUCCESS' || s === 'COMPLETED') return { color: '#08A638' };
  if (s === 'FAILED') return { color: '#F90202' };
  return { color: '#F49A47' };
};

const getStatusText = (status: string) => {
  const s = status?.toUpperCase().trim();
  if (s === 'SUCCESS' || s === 'COMPLETED') return 'Confirmed';
  if (s === 'FAILED') return 'Failed';
  return 'Pending';
};

// ─── Mini Calendar Component ──────────────────────────────────────────────────
const MiniCalendar = ({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}) => {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else setViewMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (day: number) =>
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  return (
    <View style={calStyles.cal}>
      {/* Month Nav */}
      <View style={calStyles.nav}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={calStyles.monthLabel}>
          {MONTHS[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
          <Text style={calStyles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={calStyles.weekRow}>
        {DAYS.map(d => (
          <Text key={d} style={calStyles.dayHeader}>
            {d}
          </Text>
        ))}
      </View>

      {/* Date Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={calStyles.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => (
            <TouchableOpacity
              key={col}
              style={[
                calStyles.dayCell,
                day && isSelected(day) && calStyles.dayCellSelected,
                day && isDisabled(day) && calStyles.dayCellDisabled,
              ]}
              disabled={!day || isDisabled(day as number)}
              onPress={() =>
                day &&
                onSelectDate(new Date(viewYear, viewMonth, day as number))
              }
            >
              <Text
                style={[
                  calStyles.dayText,
                  day && isSelected(day) && calStyles.dayTextSelected,
                  day && isDisabled(day) && calStyles.dayTextDisabled,
                ]}
              >
                {day || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TransactionHistoryScreen = () => {
  const navigation = useNavigation();

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [tempStart, setTempStart] = useState(thirtyDaysAgo);
  const [tempEnd, setTempEnd] = useState(today);
  const [calendarFor, setCalendarFor] = useState<'start' | 'end' | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // ─── API Flow ───────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async (from: Date, to: Date) => {
    setIsLoading(true);
    setErrorMsg('');
    setTransactions([]);

    try {
      // Step 1: Execute Report
      const payload = {
        report_name: 'b2cReport',
        execution_type: 'CACHED',
        parameters: {
          from: formatDateForAPI(from, false),
          to: formatDateForAPI(to, true),
        },
      };

      console.log('Execute Report Payload:', JSON.stringify(payload));
      const enc1 = await encryptRequest(payload);
      const execRes = await apiClient.post(
        '/report/sender_endpoint/v1/report/execute',
        {
          data: enc1.data,
          key: enc1.key,
        },
      );

      console.log('Execute Report Response:', JSON.stringify(execRes.data));

      let executionId: string | null = null;

      if (execRes.data?.result) {
        const dec1 = await decryptResponse(execRes.data.result, enc1.plainkey);
        console.log('Execute Decrypted:', dec1);

        if (Array.isArray(dec1)) {
          executionId = dec1[0];
        } else {
          executionId = dec1?.execution_id || dec1?.executionId || dec1?.id;
        }
      } else if (execRes.data?.status?.code === 2000) {
        executionId = execRes.data?.execution_id;
      }

      if (!executionId) {
        throw new Error('execution_id not received');
      }

      console.log('Execution ID:', executionId);
      setExecutionId(executionId);
      // Step 2: Poll Status — FIX
      let reportStatus = '';
      let attempts = 0;
      while (reportStatus !== 'COMPLETED' && attempts < 20) {
        // ← 20 attempts
        await new Promise(r => setTimeout(r, 2000)); // ← 2 second wait
        const enc2 = await encryptRequest({ execution_id: executionId });
        const statusRes = await apiClient.post(
          '/report/sender_endpoint/v1/report/status',
          {
            data: enc2.data,
            key: enc2.key,
          },
        );

        if (statusRes.data?.result) {
          const dec2 = await decryptResponse(
            statusRes.data.result,
            enc2.plainkey,
          );
          console.log('Status Decrypted:', dec2);
          reportStatus = dec2?.executionState || dec2?.status || ''; // ← executionState!
          console.log(
            'Current Status:',
            reportStatus,
            'Attempt:',
            attempts + 1,
          );
        }
        attempts++;
      }

      if (reportStatus !== 'COMPLETED') {
        throw new Error('Report generation timed out');
      }

      // Step 3: Get Report Page
      const enc3 = await encryptRequest({
        execution_id: executionId,
        start: 0,
        limit: 50,
      });

      const pageRes = await apiClient.post(
        '/report/sender_endpoint/v1/report/page',
        {
          data: enc3.data,
          key: enc3.key,
        },
      );

      console.log('Page Response:', JSON.stringify(pageRes.data));

      if (pageRes.data?.result) {
        const dec3 = await decryptResponse(pageRes.data.result, enc3.plainkey);
        console.log('Page Decrypted:', dec3);

        // ← Data array of arrays hai, header se map karo
        const headers = dec3?.header || [];
        const rawData = dec3?.data || [];

        const mapped = rawData.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((h: any) => {
            obj[h.name] = row[h.index - 1]; // index 1-based hai
          });
          return {
            invoiceNumber: obj['invoice_number'] || '-',
            referenceNumber: obj['reference_number'] || '-',
            channel: obj['channel'] || '-',
            requestDate: obj['Request Date'] || '',
            txnType: obj['txn_type'] || '-',
            amount: obj['txn_amount'] || '0',
            description: obj['Description'] || '-',
            txnStatus: obj['txn_status'] || '-',
          };
        });

        console.log('Mapped Transactions:', JSON.stringify(mapped));
        setTransactions(mapped);
      }
    } catch (e: any) {
      console.error('Transaction History Error:', e?.message);
      setErrorMsg(e?.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(startDate, endDate);
  }, []);

  const [executionId, setExecutionId] = useState<string | null>(null);

  const downloadReport = async (format: 'PDF' | 'EXCEL' | 'CSV') => {
    try {
      setIsLoading(true);

      // Step 1: Fresh execute karo
      const payload = {
        report_name: 'b2cReport',
        execution_type: 'CACHED',
        parameters: {
          from: formatDateForAPI(startDate, false),
          to: formatDateForAPI(endDate, true),
        },
      };

      const enc1 = await encryptRequest(payload);
      const execRes = await apiClient.post(
        '/report/sender_endpoint/v1/report/execute',
        {
          data: enc1.data,
          key: enc1.key,
        },
      );

      let execId: string | null = null;
      if (execRes.data?.result) {
        const dec1 = await decryptResponse(execRes.data.result, enc1.plainkey);
        execId = Array.isArray(dec1) ? dec1[0] : dec1?.execution_id;
      }

      if (!execId) throw new Error('execution_id not received');

      // Step 2: COMPLETED hone tak wait karo
      let status = '';
      let attempts = 0;
      while (status !== 'COMPLETED' && attempts < 20) {
        await new Promise(r => setTimeout(r, 2000));
        const enc2 = await encryptRequest({ execution_id: execId });
        const statusRes = await apiClient.post(
          '/report/sender_endpoint/v1/report/status',
          {
            data: enc2.data,
            key: enc2.key,
          },
        );
        if (statusRes.data?.result) {
          const dec2 = await decryptResponse(
            statusRes.data.result,
            enc2.plainkey,
          );
          status = dec2?.executionState || '';
        }
        attempts++;
      }

      if (status !== 'COMPLETED') throw new Error('Timeout');

      // Step 3: Download
      const enc3 = await encryptRequest({ execution_id: execId, format });
      const dlRes = await apiClient.post(
        '/report/sender_endpoint/v1/report/download',
        {
          data: enc3.data,
          key: enc3.key,
        },
      );

      console.log('Download Response:', JSON.stringify(dlRes.data));
      console.log('Download Headers:', JSON.stringify(dlRes.headers));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Download failed');
    } finally {
      setIsLoading(false);
    }
  };
  // ─── Handlers ───────────────────────────────────────────────────────────────
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

  const handleApplyFilter = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setFilterModalVisible(false);
    setCalendarFor(null);
    fetchTransactions(tempStart, tempEnd);
  };

  const handleOpenFilter = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setCalendarFor(null);
    setFilterModalVisible(true);
  };

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
       
        <TouchableOpacity onPress={handleOpenFilter}>
          <View style={styles.filterIconBtn}>
            <Image
              source={require('../assets/images/Vectorimg.png')}
              style={styles.filterIcon}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Date Range Display */}
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>Showing transactions from:</Text>
          <Text style={styles.dateRangeText}>
            {formatDateDisplay(startDate)} — {formatDateDisplay(endDate)}
          </Text>
        </View>

        {/* Transaction Count */}
        {!isLoading && !errorMsg && (
          <Text style={styles.sectionTitle}>
            Recent Transactions ({transactions.length})
          </Text>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#017EBF" />
            <Text style={styles.stateText}>Fetching transactions...</Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && errorMsg ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => fetchTransactions(startDate, endDate)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Empty */}
        {!isLoading && !errorMsg && transactions.length === 0 && (
          <View style={styles.stateContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        )}

        {/* Transaction List */}
        {!isLoading && !errorMsg && transactions.length > 0 && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {transactions.map((transaction, idx) => (
              <TouchableOpacity
                key={transaction.invoiceNumber || idx}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(transaction)}
                activeOpacity={0.8}
              >
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionTitle} numberOfLines={2}>
                    {transaction.description ||
                      transaction.txnDescription ||
                      'Transaction'}
                  </Text>
                  <Text
                    style={[
                      styles.transactionAmount,

                      // eslint-disable-next-line react-native/no-inline-styles
                      {
                        color:
                          transaction.txnType?.toUpperCase() === 'CREDIT'
                            ? '#08A638'
                            : '#121214',
                      },
                    ]}
                  >
                    {transaction.txnType === 'CREDIT'}₹
                    {/* {transaction.txnType?.toUpperCase() === 'CREDIT' ? '+' : '-'}₹{transaction.amount} */}
                    {transaction.amount || transaction.txnAmount || '0'}
                  </Text>
                </View>
                <View style={styles.transactionSubHeader}>
                  <Text style={styles.transactionLabel}>
                    Oxymoney Transaction ID
                  </Text>
                  <View style={getStatusStyle(transaction.txnStatus)}>
                    <Text
                      style={[
                        styles.statusText,
                        getStatusTextColor(transaction.txnStatus),
                      ]}
                    >
                      {getStatusText(transaction.txnStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionId}>
                    {transaction.invoiceNumber || transaction.txnId || '-'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(
                      transaction.requestDate || transaction.txnDate || '',
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 30 }} />
            <TouchableOpacity
              onPress={() => executionId && downloadReport(executionId, 'PDF')}
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                padding: 10,
                backgroundColor: '#017EBF',
                margin: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                Test Download PDF
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── Date Filter Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={filterModalVisible}
        onRequestClose={() => {
          setFilterModalVisible(false);
          setCalendarFor(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => {
                  setFilterModalVisible(false);
                  setCalendarFor(null);
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Date Selectors */}
            <View style={styles.dateSelectRow}>
              <TouchableOpacity
                style={[
                  styles.dateSelectBtn,
                  calendarFor === 'start' && styles.dateSelectBtnActive,
                ]}
                onPress={() =>
                  setCalendarFor(c => (c === 'start' ? null : 'start'))
                }
              >
                <Text style={styles.dateSelectLabel}>From</Text>
                <Text
                  style={[
                    styles.dateSelectValue,
                    calendarFor === 'start' && styles.dateSelectValueActive,
                  ]}
                >
                  {formatDateDisplay(tempStart)}
                </Text>
              </TouchableOpacity>

              <Text style={styles.dateArrow}>→</Text>

              <TouchableOpacity
                style={[
                  styles.dateSelectBtn,
                  calendarFor === 'end' && styles.dateSelectBtnActive,
                ]}
                onPress={() =>
                  setCalendarFor(c => (c === 'end' ? null : 'end'))
                }
              >
                <Text style={styles.dateSelectLabel}>To</Text>
                <Text
                  style={[
                    styles.dateSelectValue,
                    calendarFor === 'end' && styles.dateSelectValueActive,
                  ]}
                >
                  {formatDateDisplay(tempEnd)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Calendar */}
            {calendarFor === 'start' && (
              <MiniCalendar
                selectedDate={tempStart}
                maxDate={tempEnd}
                onSelectDate={d => {
                  setTempStart(d);
                  setCalendarFor('end');
                }}
              />
            )}
            {calendarFor === 'end' && (
              <MiniCalendar
                selectedDate={tempEnd}
                minDate={tempStart}
                maxDate={today}
                onSelectDate={d => {
                  setTempEnd(d);
                  setCalendarFor(null);
                }}
              />
            )}

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApplyFilter}
              >
                <Text style={styles.applyBtnText}>Apply & Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Transaction Details Bottom Sheet ── */}
      <Modal
        animationType="none"
        transparent
        visible={detailsVisible}
        onRequestClose={closeDetails}
      >
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
            ]}
          >
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsHeaderTitle}>Transaction Details</Text>
            </View>
            {selectedTransaction && (
              <ScrollView>
                <View style={styles.detailsContent}>
                  {[
                    { label: 'Status', isStatus: true },
                    { label: 'Transaction Id', key: 'invoiceNumber' },
                    { label: 'Reference Id', key: 'referenceNumber' },
                    { label: 'Date & Time', isDate: true },
                    { label: 'Description', key: 'description' },
                    { label: 'Type', key: 'txnType' },
                    { label: 'Channel', key: 'channel' },
                    {
                      label: 'Closing Balance',
                      key: 'closingBalance',
                      isBalance: true,
                    },
                    { label: 'Total Amount', key: 'amount', isAmount: true },
                  ].map((row, i) => (
                    <View key={i} style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>{row.label}</Text>
                      {row.isStatus ? (
                        <View
                          style={[
                            styles.detailsStatusPill,
                            getStatusStyle(selectedTransaction.txnStatus),
                          ]}
                        >
                          <Text
                            style={[
                              styles.detailsStatusText,
                              getStatusTextColor(selectedTransaction.txnStatus),
                            ]}
                          >
                            {getStatusText(selectedTransaction.txnStatus)}
                          </Text>
                        </View>
                      ) : row.isDate ? (
                        <View style={styles.dateTimeContainer}>
                          <Text style={styles.detailsValue}>
                            {
                              formatDateForDetails(
                                selectedTransaction.requestDate || '',
                              ).date
                            }
                          </Text>
                          <Text style={styles.timeSeparator}>|</Text>
                          <Text style={styles.detailsValue}>
                            {
                              formatDateForDetails(
                                selectedTransaction.requestDate || '',
                              ).time
                            }
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.detailsValue,
                            (row.isAmount || row.isBalance) &&
                              styles.detailsAmount,
                          ]}
                        >
                          {row.isAmount || row.isBalance ? '₹' : ''}
                          {selectedTransaction[row.key!] || '-'}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.closeButtonStyled}
                onPress={closeDetails}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Calendar Styles ──────────────────────────────────────────────────────────
const calStyles = StyleSheet.create({
  cal: { marginTop: 12, marginBottom: 4 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 22, color: '#017EBF', fontWeight: '600' },
  monthLabel: { fontSize: 15, fontWeight: '600', color: '#121214' },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayHeader: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    color: '#797E82',
    fontWeight: '500',
  },
  dayCell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellSelected: { backgroundColor: '#017EBF' },
  dayCellDisabled: { opacity: 0.3 },
  dayText: { fontSize: 13, color: '#121214' },
  dayTextSelected: { color: '#fff', fontWeight: '600' },
  dayTextDisabled: { color: '#ccc' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backArrow: { fontSize: 24, color: '#121214' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#121214',
    marginLeft: 10,
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconText: { fontSize: 18, color: '#121214' },
  contentContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  dateRangeContainer: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateRangeLabel: { color: '#797E82', fontSize: 12, marginBottom: 4 },
  dateRangeText: { color: '#121214', fontSize: 14, fontWeight: '500' },
  sectionTitle: {
    color: '#017EBF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  stateText: { color: '#797E82', marginTop: 12, fontSize: 14 },
  errorText: {
    color: '#F90202',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#017EBF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterIcon: {
  width: 20,
  height: 20,
  resizeMode: "contain",
},
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#797E82', fontSize: 16 },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    borderColor: '#EAEAEA',
    borderWidth: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
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
  transactionAmount: { fontSize: 14, fontWeight: '600' },
  transactionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: { color: '#797E82', fontSize: 12 },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  transactionId: { color: '#121214', fontSize: 12 },
  transactionDate: { color: '#797E82', fontSize: 12 },
  successStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#08A63833',
  },
  failedStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F9020233',
  },
  pendingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFF1CC',
  },
  statusText: { fontSize: 10, fontWeight: '500' },
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
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#121214' },
  modalClose: { fontSize: 20, color: '#121214' },
  dateSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateSelectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  dateSelectBtnActive: { borderColor: '#017EBF', backgroundColor: '#F0F8FF' },
  dateSelectLabel: { fontSize: 11, color: '#797E82', marginBottom: 4 },
  dateSelectValue: { fontSize: 15, fontWeight: '600', color: '#121214' },
  dateSelectValueActive: { color: '#017EBF' },
  dateArrow: { fontSize: 18, color: '#797E82', marginHorizontal: 8 },
  modalButtons: { marginTop: 16 },
  applyBtn: {
    backgroundColor: '#363636',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  detailsModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  detailsHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#017EBF' },
  detailsContent: { padding: 16 },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailsLabel: { fontSize: 14, color: '#797E82' },
  detailsValue: {
    fontSize: 14,
    color: '#121214',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailsStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsStatusText: { fontSize: 14, fontWeight: '500' },
  dateTimeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeSeparator: { marginHorizontal: 6, color: '#D0D0D0' },
  detailsAmount: { fontSize: 16, fontWeight: '600', color: '#017EBF' },
  buttonContainer: { paddingHorizontal: 16, paddingTop: 8 },
  closeButtonStyled: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: { color: '#363636', fontSize: 14, fontWeight: '500' },
});

export default TransactionHistoryScreen;
