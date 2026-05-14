// Live streaming status management
// TODO: Connect to actual TikTok live API/webhook

export const getIsLive = () => {
  // For now, hardcoded to true for demo
  // In production, this should check an API endpoint or Firestore document
  return true;
};

export const LIVE_DISCOUNT_PERCENTAGE = 0.20; // 20% discount

export const calculateLivePrice = (originalPrice) => {
  const price = parseFloat(originalPrice);
  return price * (1 - LIVE_DISCOUNT_PERCENTAGE);
};
