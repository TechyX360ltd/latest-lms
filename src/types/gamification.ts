export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  points_required: number;
  category: string;
  rarity: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge; // Joined data
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  price: number;
  item_type: string;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
  updated_at?: string;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  total_cost: number;
  purchased_at: string;
  item?: StoreItem; // Joined data
}

export interface GamificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  points: number;
  coins: number;
  created_at: string;
  status: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  user_name: string;
  user_email: string;
  points: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  badges_count: number;
}

export interface UserGamificationStats {
  points: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
  badges: UserBadge[];
  recent_events: GamificationEvent[];
  leaderboard_rank?: number;
  // Additional stats for UI
  rank?: number;
  total_courses?: number;
  completed_courses?: number;
  lessons_completed?: number;
  assignments_submitted?: number;
  days_active?: number;
  last_activity?: string;
  total_badges?: number;
  rare_badges_count?: number;
  purchases_count?: number;
}

// Event types for point earning
export const GAMIFICATION_EVENTS = {
  COURSE_ENROLLMENT: 'course_enrollment',
  COURSE_COMPLETION: 'course_completion',
  ASSESSMENT_COMPLETION: 'assessment_completion',
  PERFECT_SCORE: 'perfect_score',
  DAILY_LOGIN: 'daily_login',
  STREAK_MILESTONE: 'streak_milestone',
  BADGE_EARNED: 'badge_earned',
  PROFILE_COMPLETION: 'profile_completion',
  FIRST_COURSE: 'first_course',
  COMMUNITY_HELP: 'community_help',
  CERTIFICATE_EARNED: 'certificate_earned',
  EARLY_BIRD: 'early_bird',
  WEEKLY_GOAL: 'weekly_goal',
  MONTHLY_GOAL: 'monthly_goal',
} as const;

export type GamificationEventType = typeof GAMIFICATION_EVENTS[keyof typeof GAMIFICATION_EVENTS];

// Point values for different activities
export const POINT_VALUES = {
  [GAMIFICATION_EVENTS.COURSE_ENROLLMENT]: 10,
  [GAMIFICATION_EVENTS.COURSE_COMPLETION]: 100,
  [GAMIFICATION_EVENTS.ASSESSMENT_COMPLETION]: 25,
  [GAMIFICATION_EVENTS.PERFECT_SCORE]: 50,
  [GAMIFICATION_EVENTS.DAILY_LOGIN]: 5,
  [GAMIFICATION_EVENTS.STREAK_MILESTONE]: 200,
  [GAMIFICATION_EVENTS.BADGE_EARNED]: 50,
  [GAMIFICATION_EVENTS.PROFILE_COMPLETION]: 20,
  [GAMIFICATION_EVENTS.FIRST_COURSE]: 25,
  [GAMIFICATION_EVENTS.COMMUNITY_HELP]: 15,
  [GAMIFICATION_EVENTS.CERTIFICATE_EARNED]: 75,
  [GAMIFICATION_EVENTS.EARLY_BIRD]: 100,
  [GAMIFICATION_EVENTS.WEEKLY_GOAL]: 150,
  [GAMIFICATION_EVENTS.MONTHLY_GOAL]: 500,
} as const;

// Coin values for different activities
export const COIN_VALUES = {
  [GAMIFICATION_EVENTS.COURSE_ENROLLMENT]: 5,
  [GAMIFICATION_EVENTS.COURSE_COMPLETION]: 50,
  [GAMIFICATION_EVENTS.ASSESSMENT_COMPLETION]: 10,
  [GAMIFICATION_EVENTS.PERFECT_SCORE]: 25,
  [GAMIFICATION_EVENTS.DAILY_LOGIN]: 2,
  [GAMIFICATION_EVENTS.STREAK_MILESTONE]: 100,
  [GAMIFICATION_EVENTS.BADGE_EARNED]: 25,
  [GAMIFICATION_EVENTS.PROFILE_COMPLETION]: 10,
  [GAMIFICATION_EVENTS.FIRST_COURSE]: 15,
  [GAMIFICATION_EVENTS.COMMUNITY_HELP]: 8,
  [GAMIFICATION_EVENTS.CERTIFICATE_EARNED]: 35,
  [GAMIFICATION_EVENTS.EARLY_BIRD]: 50,
  [GAMIFICATION_EVENTS.WEEKLY_GOAL]: 75,
  [GAMIFICATION_EVENTS.MONTHLY_GOAL]: 250,
} as const;

// Badge categories with descriptions
export const BADGE_CATEGORIES = {
  achievement: 'Earned by completing specific tasks or milestones',
  participation: 'Awarded for active participation in the community',
  milestone: 'Given for reaching significant learning milestones',
  special: 'Limited edition or special event badges',
} as const;

// Badge rarities with descriptions
export const BADGE_RARITIES = {
  common: 'Easily obtainable badges',
  rare: 'Moderately difficult to earn',
  epic: 'Challenging achievements',
  legendary: 'Extremely rare and prestigious',
} as const;

// Store item types with descriptions
export const STORE_ITEM_TYPES = {
  avatar_frame: 'Custom frames for profile pictures',
  profile_background: 'Special background designs for profiles',
  certificate_theme: 'Custom certificate designs',
  course_discount: 'Discounts on course purchases',
  premium_feature: 'Access to premium platform features',
} as const; 