import apiClient from './apiClient';
import { decryptResponse, encryptRequest } from './cryptoService';
import { SHA256 } from './cryptoService';
import { SessionStore } from '../store/sessionStore';

// ─── Timestamp format: ddMMyyHHmm (same as Android) ──────────────────────────
const getTimestamp = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${dd}${MM}${yy}${HH}${mm}`;
};

// ─── Generate OTP ─────────────────────────────────────────────────────────────
export const generateOTP = async (
  mobileNumber: string,
  clientToken: string,  // RSA key / plainkey
  clientId: string,
): Promise<boolean> => {
  try {
    console.log('Generating OTP for:', mobileNumber);

    // Step 1: Timestamp
    const timestamp = getTimestamp();
    console.log('Timestamp:', timestamp);

    // Step 2: Checksum (same as Android)
    // Format: "mobile:USER_VERIFICATION:clientToken:timestamp"
    const checksumString = `${mobileNumber}:USER_VERIFICATION:${clientToken}:${timestamp}`;
    console.log('Checksum string:', checksumString);
    const checksum = await SHA256(checksumString);
    console.log('Checksum:', checksum);

    // Step 3: Payload (same as Android)
    const payload = {
      checksum: checksum,
      purpose: 'USER_VERIFICATION',
      mobile: mobileNumber,
    };
    console.log('Payload:', payload);

    // Step 4: Encrypt
    const encrypted = await encryptRequest(payload);

    // Step 5: API call with client-id header
    const response = await apiClient.post(
      '/authserver/generate/login/otp',
      {
        plainkey: encrypted.plainkey,
        data: encrypted.data,
        key: encrypted.key,
      },
      {
        headers: {
          'client-id': clientId,
        },
      }
    );

    console.log('OTP API Response:', JSON.stringify(response.data));

    if (response.data?.status?.code === 2000) {
      console.log('OTP sent successfully!');
      return true;
    }

    console.error('OTP failed:', response.data?.status?.message);
    return false;

  } catch (e: any) {
    console.error('Generate OTP Error:', e?.message);
    return false;
  }
};

export const verifyOTPAndGetToken = async (
  mobileNumber: string,
  otp: string,
  _clientToken: string,
): Promise<string | null> => {
  try {
    console.log('Verifying OTP...');

    // Fixed test checksum — server side hardcoded hai
    const payload = {
      username: `${mobileNumber}&OTP&USER_VERIFICATION`,
      password: otp,
      checksum: '27ba20250a6f867a2643948574f63527c8fa71e292f23b8d7b2af950d0ef92b1',
    };

    console.log('Payload:', payload);

    const encrypted = await encryptRequest(payload);

    const response = await apiClient.post(
      '/authserver/client/token',
      {
        plainkey: encrypted.plainkey,
        data: encrypted.data,
        key: encrypted.key,
      },
      {
       headers: {
      'client-id': 'SENEXTCLT000754', // ← change karo
    },
      }
    );

    console.log('Token Raw Response:', JSON.stringify(response.data));

    // Response decrypt karo
    if (response.data?.data) {
      const decrypted = await decryptResponse(
        response.data.data,
        encrypted.plainkey,
      );
      console.log('Decrypted Token Response:', decrypted);

      const tokenData = JSON.parse(decrypted || '{}');
      const accessToken = tokenData?.access_token;

      if (accessToken) {
        SessionStore.setToken(accessToken);
        console.log('✅ Token saved:', accessToken);
        return accessToken;
      }
    }

    return null;

  } catch (e: any) {
    console.error('Verify OTP Error:', e?.message);
    return null;
  }
};