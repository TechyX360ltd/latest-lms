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
    function isValidUUID(id: string) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    }
    try {
      // Get user's basic stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points, coins, current_streak, longest_streak, last_active_date')
        .eq('id', userId)
        .single();
      if (userError) { console.error('User query error:', userError); throw userError; }

      // Get user's badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`*, badge:badges(*)`)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });
      if (badgesError) { console.error('Badges query error:', badgesError); throw badgesError; }

      // Get recent events
      const { data: events, error: eventsError } = await supabase
        .from('gamification_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (eventsError) { console.error('Events query error:', eventsError); throw eventsError; }

      // Get leaderboard rank
      const { data: leaderboard, error: leaderboardError } = await supabase
        .rpc('get_leaderboard', { p_limit: 1000 });
      if (leaderboardError) { console.error('Leaderboard query error:', leaderboardError); throw leaderboardError; }
      const userRank = leaderboard?.find((entry: any) => entry.user_id === userId)?.rank;

      // --- NEW: Fetch course, lesson, and assignment progress ---
      // Get all courses
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id');
      if (coursesError) { console.error('Courses query error:', coursesError); throw coursesError; }
      const totalCourses = allCourses.length;

      // Get user's course statuses
      const { data: userCourses, error: userCoursesError } = await supabase
        .from('user_courses')
        .select('course_id, status')
        .eq('user_id', userId);
      if (userCoursesError) { console.error('UserCourses query error:', userCoursesError); throw userCoursesError; }
      const completedCourses = userCourses.filter((uc: any) => uc.status === 'completed').length;

      // Get all lessons for user's courses
      const courseIds = userCourses.map((uc: any) => uc.course_id).filter(isValidUUID);
      let lessonsCompleted = 0;
      if (courseIds.length > 0) {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds);
        if (lessonsError) { console.error('Lessons query error:', lessonsError); throw lessonsError; }
        // Optionally, you can track lesson completion per user if you have such a table
        // For now, count all lessons in completed courses as completed
        const completedCourseIds = userCourses.filter((uc: any) => uc.status === 'completed').map((uc: any) => uc.course_id).filter(isValidUUID);
        lessonsCompleted = (lessons || []).filter((l: any) => completedCourseIds.includes(l.course_id)).length;
      }

      // Get assignments submitted
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignment_submissions')
        .select('id')
        .eq('user_id', userId);
      if (assignmentsError) { console.error('Assignments query error:', assignmentsError); throw assignmentsError; }
      const assignmentsSubmitted = assignments.length;

      return {
        points: user.points || 0,
        coins: user.coins || 0,
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        last_active_date: user.last_active_date || new Date().toISOString(),
        badges: badges || [],
        recent_events: events || [],
        leaderboard_rank: userRank,
        completed_courses: completedCourses,
        total_courses: totalCourses,
        lessons_completed: lessonsCompleted,
        assignments_submitted: assignmentsSubmitted,
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

      // Insert a gift record for the buyer
      const { error: giftError } = await supabase.from('gifts').insert({
        recipient_id: userId,
        sender_id: userId,
        coin_value: item.price,
        cashed_out: false,
        created_at: new Date().toISOString(),
        gift_type: 'store_purchase',
      });
      if (giftError) console.error('Gift insert error:', giftError);

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

  /**
   * Award coins when an instructor publishes a course
   */
  static async awardCoinsOnCoursePublish(userId: string, courseId: string, courseTitle?: string) {
    try {
      const res = await fetch('/functions/v1/award-coins-on-course-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId, courseTitle })
      });
      return await res.json();
    } catch (err) {
      console.error('Error awarding coins on course publish:', err);
      throw err;
    }
  }

  /**
   * Award coins for instructor listing a course
   */
  static async instructorListedCourse(userId: string, courseId: string) {
    return this.awardPoints(
      userId,
      'instructor_course_listed',
      'Listed a new course',
      { course_id: courseId }
    );
  }

  /**
   * Award points for instructor withdrawal
   */
  static async instructorWithdrawal(userId: string, withdrawalId: string, amount: number) {
    return this.awardPoints(
      userId,
      'instructor_withdrawal',
      'Withdrew earnings',
      { withdrawal_id: withdrawalId, amount }
    );
  }

  /**
   * Record instructor store purchase
   */
  static async instructorStorePurchase(userId: string, itemId: string, itemName: string) {
    return this.awardPoints(
      userId,
      'instructor_store_purchase',
      `Purchased ${itemName}`,
      { item_id: itemId }
    );
  }

  /**
   * Get user's gifting history (sent and received) with pagination
   */
  static async getUserGiftingHistory(userId: string, options?: { type?: 'sent' | 'received', sort?: 'asc' | 'desc', page?: number, pageSize?: number }) {
    const { type, sort, page = 1, pageSize = 10 } = options || {};
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('gifts')
      .select(`
        *,
        item:store_items(*),
        sender:users!gifts_sender_id_fkey(id, first_name, last_name, email),
        recipient:users!gifts_recipient_id_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .order('sent_at', { ascending: sort === 'asc' })
      .range(from, to);
    if (type === 'sent') {
      query = query.eq('sender_id', userId);
    } else if (type === 'received') {
      query = query.eq('recipient_id', userId);
    } else {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    }
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], total: count || 0 };
  }
} 