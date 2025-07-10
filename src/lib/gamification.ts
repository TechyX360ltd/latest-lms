import { supabase } from './supabase';
import { 
  GamificationEventType, 
  GAMIFICATION_EVENTS, 
  POINT_VALUES, 
  COIN_VALUES,
  UserGamificationStats,
  LeaderboardEntry,
  Badge,
  UserBadge,
  StoreItem,
  UserPurchase,
  GamificationEvent
} from '../types/gamification';

export class GamificationService {
  /**
   * Award points and coins to a user for a specific event
   */
  static async awardPoints(
    userId: string,
    eventType: GamificationEventType,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const points = POINT_VALUES[eventType] || 0;
    const coins = COIN_VALUES[eventType] || 0;

    try {
      const { error } = await supabase.rpc('award_points_and_check_badges', {
        p_user_id: userId,
        p_points: points,
        p_coins: coins,
        p_event_type: eventType,
        p_description: description,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error awarding points:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to award points:', error);
      throw error;
    }
  }

  /**
   * Update user streak (called on daily login)
   */
  static async updateUserStreak(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_user_streak', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error updating user streak:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user streak:', error);
      throw error;
    }
  }

  /**
   * Get user's gamification statistics
   */
  static async getUserStats(userId: string): Promise<UserGamificationStats> {
    try {
      // Get user's basic stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points, coins, current_streak, longest_streak, last_active_date')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get user's badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Get recent events
      const { data: events, error: eventsError } = await supabase
        .from('gamification_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;

      // Get leaderboard rank
      const { data: leaderboard, error: leaderboardError } = await supabase
        .rpc('get_leaderboard', { p_limit: 1000 });

      if (leaderboardError) throw leaderboardError;

      const userRank = leaderboard?.find(entry => entry.user_id === userId)?.rank;

      return {
        points: user.points || 0,
        coins: user.coins || 0,
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        last_active_date: user.last_active_date || new Date().toISOString(),
        badges: badges || [],
        recent_events: events || [],
        leaderboard_rank: userRank
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_limit: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get all available badges
   */
  static async getBadges(): Promise<Badge[]> {
    try {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get badges:', error);
      throw error;
    }
  }

  /**
   * Get user's badges
   */
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user badges:', error);
      throw error;
    }
  }

  /**
   * Get store items
   */
  static async getStoreItems(): Promise<StoreItem[]> {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get store items:', error);
      throw error;
    }
  }

  /**
   * Purchase an item from the store
   */
  static async purchaseItem(
    userId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<UserPurchase> {
    try {
      // Get item details
      const { data: item, error: itemError } = await supabase
        .from('store_items')
        .select('*')
        .eq('id', itemId)
        .eq('is_active', true)
        .single();

      if (itemError) throw itemError;
      if (!item) throw new Error('Item not found');

      // Check stock
      if (item.stock_quantity !== -1 && item.stock_quantity < quantity) {
        throw new Error('Insufficient stock');
      }

      const totalCost = item.price * quantity;

      // Get user's current coins
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('coins')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (user.coins < totalCost) {
        throw new Error('Insufficient coins');
      }

      // Start transaction
      const { data: purchase, error: purchaseError } = await supabase
        .from('user_purchases')
        .insert({
          user_id: userId,
          item_id: itemId,
          quantity,
          total_cost: totalCost
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Deduct coins from user
      const { error: updateError } = await supabase
        .from('users')
        .update({ coins: user.coins - totalCost })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Update stock if not unlimited
      if (item.stock_quantity !== -1) {
        const { error: stockError } = await supabase
          .from('store_items')
          .update({ stock_quantity: item.stock_quantity - quantity })
          .eq('id', itemId);

        if (stockError) throw stockError;
      }

      return purchase;
    } catch (error) {
      console.error('Failed to purchase item:', error);
      throw error;
    }
  }

  /**
   * Get user's purchase history
   */
  static async getUserPurchases(userId: string): Promise<UserPurchase[]> {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select(`
          *,
          item:store_items(*)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user purchases:', error);
      throw error;
    }
  }

  /**
   * Get user's gamification events
   */
  static async getUserEvents(
    userId: string,
    limit: number = 20
  ): Promise<GamificationEvent[]> {
    try {
      const { data, error } = await supabase
        .from('gamification_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user events:', error);
      throw error;
    }
  }

  /**
   * Check if user can earn a specific badge
   */
  static async checkBadgeEligibility(
    userId: string,
    badgeId: string
  ): Promise<boolean> {
    try {
      // Check if user already has the badge
      const { data: existingBadge, error: existingError } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;
      if (existingBadge) return false;

      // Get badge requirements
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('points_required')
        .eq('id', badgeId)
        .single();

      if (badgeError) throw badgeError;

      // Get user's current points
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      return user.points >= badge.points_required;
    } catch (error) {
      console.error('Failed to check badge eligibility:', error);
      throw error;
    }
  }

  /**
   * Trigger gamification events for common actions
   */
  static async triggerCourseEnrollment(userId: string, courseId: string): Promise<void> {
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.COURSE_ENROLLMENT,
      'Enrolled in a new course',
      { course_id: courseId }
    );
  }

  static async triggerCourseCompletion(userId: string, courseId: string): Promise<void> {
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.COURSE_COMPLETION,
      'Completed a course',
      { course_id: courseId }
    );
  }

  static async triggerDailyLogin(userId: string): Promise<void> {
    await this.updateUserStreak(userId);
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.DAILY_LOGIN,
      'Daily login bonus'
    );
  }

  static async triggerProfileCompletion(userId: string): Promise<void> {
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.PROFILE_COMPLETION,
      'Completed profile information'
    );
  }

  static async triggerFirstCourse(userId: string): Promise<void> {
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.FIRST_COURSE,
      'Completed your first course'
    );
  }

  static async triggerPerfectScore(userId: string, assessmentId: string): Promise<void> {
    await this.awardPoints(
      userId,
      GAMIFICATION_EVENTS.PERFECT_SCORE,
      'Achieved perfect score on assessment',
      { assessment_id: assessmentId }
    );
  }

  /**
   * Award coins for learning actions (start, continue, open_active_course)
   */
  static async awardCoinsOnLearning(userId: string, courseId: string, actionType: 'start' | 'continue' | 'open_active_course') {
    try {
      const res = await fetch('/functions/v1/award-coins-on-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId, actionType })
      });
      return await res.json();
    } catch (err) {
      console.error('Error awarding coins on learning:', err);
      throw err;
    }
  }

  /**
   * Handle referral reward when a referred user purchases a course
   */
  static async handleReferralReward(referredUserId: string, courseId: string) {
    try {
      const res = await fetch('/functions/v1/handle-referral-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referredUserId, courseId })
      });
      return await res.json();
    } catch (err) {
      console.error('Error handling referral reward:', err);
      throw err;
    }
  }
} 