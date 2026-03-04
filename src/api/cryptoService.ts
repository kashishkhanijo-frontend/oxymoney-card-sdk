import { RSA } from 'react-native-rsa-native';
import axios from 'axios';

const BASE_URL = 'https://gcdev.oxymoney.com';

const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtEyufpsf2vVNuJWWvzxF
lOh4VKkp8crGtVcSbBGwrze3FQionmIjjqCzZJ6kkCYZwi4ASoNCMNr81/jdxxV6
PuB8ltA8AUlULUEb63DWUzEdaI1LdXAIJyM6OmtdHtakKAJ78EJ04GzqR+Q+29cT
GBy/n8nmMg5Lw1GJ78cmeAzG8fNHsZyhk+di50DiPDPE8xFKDf1bEFfwS28EYmtA
EX3Q6ezaPMnsVEN/thDbj4IXmh2xIWjC7WLYQXhMVGnoPGtmONtzd2s+TO6xfJyY
+7vQciAJHgukY27JspNdBP154Bwi9vti7OSqeJrF2knQ98S+GJdSYpARaqXk2lrZ
ewIDAQAB
-----END PUBLIC KEY-----`;

// ─── Server Se Encrypt Karwao ─────────────────────────────────────────────────
export const encryptRequest = async (
  requestData: any,
): Promise<{data: string; key: string; plainkey: string}> => {
  try {
    console.log('Encrypting via server...');

    const response = await axios.post(
      `${BASE_URL}/uiObjects/test/open/rsa-aes/encrypt`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.status?.code === 2000) {
      const { plainkey, data, key } = response.data.result;
      console.log('Encryption success via server!');
      console.log('plainkey:', plainkey);
      console.log('data:', data);
      console.log('key:', key);
      return { plainkey, data, key };
    }

    throw new Error('Encryption failed: ' + response.data?.status?.message);

  } catch (e: any) {
    console.error('encryptRequest error:', e?.message);
    throw e;
  }
};

// ─── Server Se Decrypt Karwao ─────────────────────────────────────────────────
export const decryptResponse = async (
  data: string,
  key: string,
): Promise<any> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/uiObjects/test/open/rsa-aes/decrypt`,
      { data, key },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.status?.code === 2000) {
      console.log('Decryption success!');
      return response.data.result?.result;
    }

    throw new Error('Decryption failed: ' + response.data?.status?.message);

  } catch (e: any) {
    console.error('decryptResponse error:', e?.message);
    throw e;
  }
};

// ─── RSA Encrypt (AES Key ke liye — production mein use hoga) ────────────────
export const encryptRSA = async (data: string): Promise<string> => {
  try {
    const encrypted = await RSA.encrypt(data, RSA_PUBLIC_KEY);
    return encrypted;
  } catch (e: any) {
    console.error('RSA Encrypt error:', e?.message);
    return '';
  }
};

// ─── SHA256 ───────────────────────────────────────────────────────────────────
import Aes from 'react-native-aes-crypto';

export const SHA256 = async (text: string): Promise<string> => {
  return await Aes.sha256(text);
};

// ─── Checksum ─────────────────────────────────────────────────────────────────
export const generateChecksum = async (
  username: string,
  password: string,
  sha256Key: string,
  timestamp: string,
): Promise<string> => {
  const raw = `${username}&${password}:${sha256Key}:${timestamp}`;
  return await SHA256(raw);
};