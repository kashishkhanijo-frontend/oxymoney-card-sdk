import apiClient from './apiClient';
import { encryptRequest, decryptResponse } from './cryptoService';
import { SessionStore } from '../store/sessionStore';

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
export const updateCardChannel = async (channelUpdates: Record<string, boolean>) => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({
    card_id: cardId,
    channelStatusUpdates: channelUpdates,  // ← yahi format chahiye
  });
  const response = await apiClient.post(
    '/retube/sender-endpoint/v1/card/management/update/card/channel',
    { data: encrypted.data, key: encrypted.key },
  );
  console.log('Update Channel Response:', JSON.stringify(response.data));
  return response.data?.status?.code === 2000;
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

// ─── Block Card ───────────────────────────────────────────────────────────────
export const blockCard = async () => {
  const cardId = SessionStore.getCardId();
  const encrypted = await encryptRequest({ 
    card_id: cardId,
    usage_status: 'BLOCKED',  // ← try karo
  });
  const response = await apiClient.post(
    '/retube/sender-endpoint/v1/card/management/block/card',
    { data: encrypted.data, key: encrypted.key },
  );
  console.log('Block Card Response:', JSON.stringify(response.data));
  return response.data?.status?.code === 2000;
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
  return response.data?.status?.code === 2000;
};