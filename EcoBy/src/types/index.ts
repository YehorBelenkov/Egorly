export interface TikTokUser {
  id: number;
  username: string;
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
  followCount: number;
  giftCount: number;
  likeCount: number;
  commentCount: number;
  engagementScore: number;
  lastSeen: string;
  createdAt: string;
}

export interface Prize {
  id: number;
  name: string;
  type: 'money' | 'product' | 'promo_code';
  value: string;
  description?: string;
  probability: number;
  isActive: boolean;
}

export interface Winner {
  id: number;
  userId: number;
  prizeId: number;
  username: string;
  prizeName: string;
  prizeType: string;
  prizeValue: string;
  wonAt: string;
}

export interface WinnerClaim {
  id: number;
  winnerId: number;
  tiktokUsername: string;
  screenshotUrl: string;
  contactDescription: string;
  contactMethod: string;
  paymentMethod: string;
  claimedAt: string;
}
