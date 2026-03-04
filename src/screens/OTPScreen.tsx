import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {verifyOTPAndGetToken} from '../api/authApi';

const RESEND_TIMER = 52;

const OTPScreen = ({navigation, route}: any) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<any[]>([]);

  // Route params se data lo
  const mobileNumber = route?.params?.mobileNumber || '';
  const clientToken = route?.params?.clientToken || '';
  const clientId = route?.params?.clientId || '';

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(['', '', '', '', '', '']);
    setTimer(RESEND_TIMER);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  };

  const isComplete = otp.every(d => d !== '');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    console.log('Verifying OTP:', otpString, 'for mobile:', mobileNumber);

    const token = await verifyOTPAndGetToken(
      mobileNumber,
      otpString,
      clientToken,
      clientId,
    );

    if (token) {
      console.log('✅ Token mila!', token);
      navigation.navigate('Home');
    } else {
      console.log('❌ OTP wrong hai');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1, backgroundColor: 'white'}}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ImageBackground
          source={require('../assets/images/loginfram.png')}
          style={{width: '100%', height: 300}}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={styles.backBtn}>
              <Image
                source={require('../assets/images/chevron.png')}
                style={styles.chevron}
              />
            </View>
          </TouchableOpacity>
          <View style={{width: '100%', alignItems: 'center', marginTop: 50}}>
            <Image
              source={require('../assets/images/mylogo.png')}
              style={{width: 190, height: 82}}
            />
          </View>
        </ImageBackground>

        <View style={{width: '100%', flexDirection: 'row'}}>
          <ImageBackground
            source={require('../assets/images/loginfram.png')}
            style={{width: '100%', height: 100}}>
            <View style={styles.curveOverlay} />
          </ImageBackground>
        </View>

        <View style={styles.content}>
          <Text style={styles.heading}>One Time Password</Text>
          <Text style={styles.subtext}>
            Enter the 6-digit code sent to your registered mobile number
          </Text>

          <Text style={styles.label}>
            OTP <Text style={{color: 'red'}}>*</Text>
          </Text>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => (inputRefs.current[index] = ref)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                keyboardType="numeric"
                maxLength={1}
                value={digit}
                onChangeText={text => handleOtpChange(text, index)}
                onKeyPress={event => handleKeyPress(event, index)}
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Didn't receive the OTP?</Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend}>
              <Text
                style={[
                  styles.resendLink,
                  {color: canResend ? '#363636' : '#B0B0B0'},
                ]}>
                {' '}
                Resend{!canResend ? ` in ${formatTime(timer)}` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.verifyBtn,
              {backgroundColor: isComplete ? '#363636' : '#B0B0B0'},
            ]}
            disabled={!isComplete}
            onPress={handleVerify}>
            <Text style={styles.verifyText}>Verify</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By logging in, you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={{height: 80}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    width: 30,
    height: 30,
    marginLeft: 20,
    marginTop: 20,
    borderColor: 'black',
    borderRadius: 8,
    borderWidth: 0.5,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {width: 8, height: 14},
  curveOverlay: {
    width: '100%',
    backgroundColor: 'white',
    height: '100%',
    borderTopRightRadius: 80,
  },
  content: {
    width: '100%',
    paddingHorizontal: '6%',
    marginTop: -80,
  },
  heading: {fontSize: 32, color: 'black', fontWeight: '600'},
  subtext: {fontSize: 12, color: '#555555', marginTop: 10, lineHeight: 18},
  label: {fontSize: 14, fontWeight: '400', marginTop: 20, color: 'black'},
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  otpBox: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  otpBoxFilled: {borderColor: '#363636', backgroundColor: '#FFFFFF'},
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {fontSize: 12, color: '#555'},
  resendLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyBtn: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyText: {color: '#FFFFFF', fontSize: 14, fontWeight: '500'},
  terms: {
    fontSize: 11,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },
  termsLink: {
    color: '#363636',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OTPScreen;