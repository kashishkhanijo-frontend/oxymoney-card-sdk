import apiClient from './apiClient';
import { encryptRequest, decryptResponse } from './cryptoService';
import { SessionStore } from '../store/sessionStore';
import { useState } from 'react';
import { Alert } from 'react-native';

// ─── Get Card Details ─────────────────────────────────────────────────────────
export const getCardDetails = async () => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({ card_id: cardId });
  const response = await apiClient.post(
    '/uiObjects/sender-endpoint/v1/card/unmasked',
    { data: encrypted.data, key: encrypted.key },
  );
  if (response.data?.result) {
    return await decryptResponse(response.data.result, encrypted.plainkey);
  }
  return null;
};

// ─── Get Card Channel ─────────────────────────────────────────────────────────
export const getCardChannel = async () => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({ card_id: cardId });
  const response = await apiClient.post(
    '/retube/sender-endpoint/v1/card/management/get/card/channel',
    { data: encrypted.data, key: encrypted.key },
  );
  if (response.data?.result) {
    return await decryptResponse(response.data.result, encrypted.plainkey);
  }
  return null;
};

// ─── Update Card Channel ──────────────────────────────────────────────────────
// export const updateCardChannel = async (channelUpdates: Record<string, boolean>) => {
//   const cardId = SessionStore.getCardId();
//   const encrypted = await encryptRequest({
//     card_id: cardId,
//     channelStatusUpdates: channelUpdates,  // ← yahi format chahiye
//   });
//   const response = await apiClient.post(
//     '/retube/sender-endpoint/v1/card/management/update/card/channel',
//     { data: encrypted.data, key: encrypted.key },
//   );
//   console.log('Update Channel Response:', JSON.stringify(response.data));
//   return response.data?.status?.code === 2000;
// };

export const updateCardChannel = async (channelUpdates: Record<string, boolean>): Promise<{success: boolean; message: string}> => {
  try {
    const cardId = SessionStore.getCardId();
    const encrypted = await encryptRequest({
      card_id: cardId,
      channelStatusUpdates: channelUpdates,
    });
    const response = await apiClient.post(
      '/retube/sender-endpoint/v1/card/management/update/card/channel',
      { data: encrypted.data, key: encrypted.key },
    );
    console.log('Update Channel Response:', JSON.stringify(response.data));
    
    const code = response.data?.status?.code;
    const message = response.data?.status?.message || 'Something went wrong';
    
    if (code === 2000) return { success: true, message: 'Channel updated successfully' };
    return { success: false, message }; // ← backend ka exact message
    
  } catch (e: any) {
    return { success: false, message: e?.message || 'Network error' };
  }
};

// ─── Set Card Status (Enable/Disable) ────────────────────────────────────────
export const setCardStatus = async (usageStatus: 'ENABLED' | 'DISABLED') => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({
    card_id: cardId,
    usage_status: usageStatus,
  });
  const response = await apiClient.post(
    '/retube/sender-endpoint/v1/card/management/set/card/status',
    { data: encrypted.data, key: encrypted.key },
  );
  return response.data?.status?.code === 2000;
};

// // ─── Block Card ───────────────────────────────────────────────────────────────
// export const blockCard = async (reason: string): Promise<boolean> => {
//   try {
//     const cardId = SessionStore.getCardId();
//     console.log('Block Card - cardId:', cardId, 'reason:', reason);
    
//     const encrypted = await encryptRequest({ 
//       card_id: cardId,  // ← add karo
//       reason: reason,
//     });
//     const response = await apiClient.post(
//       '/retube/sender-endpoint/v1/card/management/block/card',
//       { data: encrypted.data, key: encrypted.key },
//     );
//     console.log('Block Card Response:', JSON.stringify(response.data));
//     return response.data?.status?.code === 2000;
//   } catch (e: any) {
//     console.error('Block Card Error:', e?.message);
//     return false;
//   }
// };

export const blockCard = async (reason: string): Promise<'success' | 'already_blocked' | 'failed'> => {
  try {
    const cardId = SessionStore.getCardId();
    const encrypted = await encryptRequest({ 
      card_id: cardId,
      reason: reason,
    });
    const response = await apiClient.post(
      '/retube/sender-endpoint/v1/card/management/block/card',
      { data: encrypted.data, key: encrypted.key },
    );
    const code = response.data?.status?.code;
    if (code === 2000) return 'success';
    if (code === 4164) return 'already_blocked';  // duplicate.request
    return 'failed';
  } catch (e: any) {
    console.error('Block Card Error:', e?.message);
    return 'failed';
  }
};


// ─── Set PIN ──────────────────────────────────────────────────────────────────
export const setCardPin = async (otp: string, pin: string) => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({
    card_id: cardId,
    otp: otp,
    pin: pin,
  });
  const response = await apiClient.post(
    '/retube/sender-endpoint/v1/card/management/set/pin',
    { data: encrypted.data, key: encrypted.key },
  );
  console.log('Set PIN Response:', JSON.stringify(response.data));
  return response.data?.status?.code === 2000;
};

