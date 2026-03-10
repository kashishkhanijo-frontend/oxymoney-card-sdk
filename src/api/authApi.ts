import { encryptRequest, decryptResponse, SHA256 } from './cryptoService';
import apiClient from './apiClient';
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
  clientToken: string,
  clientId: string,
): Promise<boolean> => {
  try {
    console.log('Generating OTP for:', mobileNumber);

    const timestamp = getTimestamp();
    console.log('Timestamp:', timestamp);

    const checksumString = `${mobileNumber}:USER_VERIFICATION:${clientToken}:${timestamp}`;
    console.log('Checksum string:', checksumString);
    const checksum = await SHA256(checksumString);
    console.log('Checksum:', checksum);

    const payload = {
      checksum: checksum,
      purpose: 'USER_VERIFICATION',
      mobile: mobileNumber,
    };

    const encrypted = await encryptRequest(payload);

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
      },
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

// ─── Verify OTP + Get Token ───────────────────────────────────────────────────
export const verifyOTPAndGetToken = async (
  mobileNumber: string,
  otp: string,
  clientToken: string,
  clientId: string,
): Promise<string | null> => {
  try {
    console.log('Verifying OTP...');

    const timestamp = getTimestamp();
    console.log('Timestamp:', timestamp);

    // Same as Android
    const checksumString = `${mobileNumber}&OTP&USER_VERIFICATION:${otp}:${clientToken}:${timestamp}`;
    console.log('Checksum string:', checksumString);
    const checksum = await SHA256(checksumString);
    console.log('Checksum:', checksum);

    const payload = {
      username: `${mobileNumber}&OTP&USER_VERIFICATION`,
      password: otp,
      checksum: checksum,
    };

    console.log('Payload:', payload);

    const encrypted = await encryptRequest(payload);

    // const response = await apiClient.post(
    //   '/authserver/client/token',
    //   {
    //     data: encrypted.data, // ← encrypted data
    //     key: encrypted.key, // ← RSA encrypted AES key
    //     // plainkey bilkul mat bhejo!
    //   },
    //   {
    //     headers: {
    //       'client-id': clientId,
    //     },
    //   },
    // );
   
    const response = await apiClient.post(
  '/authserver/client/token',
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

    // const response = await apiClient.post(
    //   '/authserver/client/token',
    //   {
    //     plainkey: encrypted.plainkey,
    //     data: encrypted.data,
    //     key: encrypted.key,
    //   },
    //   {
    //     headers: {
    //       'client-id': clientId,
    //     },
    //   }
    // );

    console.log('Token Raw Response:', JSON.stringify(response.data));

    // authApi.ts mein yeh fix karo
    if (response.data?.result) {
      const decrypted = await decryptResponse(
        response.data.result,
        encrypted.plainkey,
      );
      console.log('Decrypted Token Response:', decrypted);

      // ← JSON.parse mat karo — already object hai
      const accessToken = decrypted?.access_token;

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
