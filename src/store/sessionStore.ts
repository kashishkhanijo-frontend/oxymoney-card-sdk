// ─── In-Memory Session Store ──────────────────────────────────────────────────
// No AsyncStorage, No cache — sirf memory mein

interface SessionData {
  token: string | null;
  mobileNumber: string | null;
  cardId: string | null;
  clientId: string | null;
  clientToken: string | null; // RSA Public Key
  action: string | null;
  amount: string | null;
  serviceType: string | null;
  otp: string | null;
}

let session: SessionData = {
  token: null,
  mobileNumber: null,
  cardId: null,
  clientId: null,
  clientToken: null,
  action: null,
  amount: null,
  serviceType: null,
  otp: null,
};

export const SessionStore = {
  // Set karo
  setToken: (token: string) => { session.token = token; },
  setMobileNumber: (mobile: string) => { session.mobileNumber = mobile; },
  setCardId: (cardId: string) => { session.cardId = cardId; },
  setClientId: (clientId: string) => { session.clientId = clientId; },
  setClientToken: (clientToken: string) => { session.clientToken = clientToken; },
  setAction: (action: string) => { session.action = action; },
  setAmount: (amount: string) => { session.amount = amount; },
  setServiceType: (serviceType: string) => { session.serviceType = serviceType; },
  setOtp: (otp: string) => { session.otp = otp; }, // ← ADD

  init: (data: Partial<SessionData>) => {
    session = { ...session, ...data };
  },

  // Get karo
  getToken: () => session.token,
  getMobileNumber: () => session.mobileNumber,
  getCardId: () => session.cardId,
  getClientId: () => session.clientId,
  getClientToken: () => session.clientToken,
  getAction: () => session.action,
  getAmount: () => session.amount,
  getServiceType: () => session.serviceType,
  getOtp: () => session.otp, // ← ADD

  clear: () => {
    session = {
      token: null,
      mobileNumber: null,
      cardId: null,
      clientId: null,
      clientToken: null,
      action: null,
      amount: null,
      serviceType: null,
      otp: null, // ← ADD
    };
  },

  getAll: () => ({ ...session }),
};