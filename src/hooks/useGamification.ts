import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { GamificationService } from '../lib/gamification';
import { 
  UserGamificationStats, 
  LeaderboardEntry, 
  Badge, 
  StoreItem,
  UserPurchase,
  GamificationEvent,
  GAMIFICATION_EVENTS
} from '../types/gamification';
import { useToast } from '../components/Auth/ToastContext';
import CoinRain from '../components/Gamification/CoinRain';
import { createPortal } from 'react-dom';
import LeaderboardPopup from '../components/Gamification/LeaderboardPopup';

export function useGamification() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState<UserGamificationStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [userPurchases, setUserPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCoinRain, setShowCoinRain] = useState(false);
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
  const [prevRank, setPrevRank] = useState<number | null>(null);

  // Load user stats
  const loadUserStats = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const userStats = await GamificationService.getUserStats(user.id);
      setStats(userStats);
    } catch (err) {
      setError('Failed to load user stats');
      console.error('Error loading user stats:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const leaderboardData = await GamificationService.getLeaderboard(limit);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load badges
  const loadBadges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const badgesData = await GamificationService.getBadges();
      setBadges(badgesData);
    } catch (err) {
      setError('Failed to load badges');
      console.error('Error loading badges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load store items
  const loadStoreItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storeData = await GamificationService.getStoreItems();
      setStoreItems(storeData);
    } catch (err) {
      setError('Failed to load store items');
      console.error('Error loading store items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user purchases
  const loadUserPurchases = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const purchases = await GamificationService.getUserPurchases(user.id);
      setUserPurchases(purchases);
    } catch (err) {
      setError('Failed to load user purchases');
      console.error('Error loading user purchases:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Award points
  const awardPoints = useCallback(async (
    eventType: keyof typeof GAMIFICATION_EVENTS,
    description?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      await GamificationService.awardPoints(user.id, eventType, description, metadata);
      // Reload user stats after awarding points
      await loadUserStats();
    } catch (err) {
      setError('Failed to award points');
      console.error('Error awarding points:', err);
    }
  }, [user?.id, loadUserStats]);

  // Purchase item
  const purchaseItem = useCallback(async (itemId: string, quantity: number = 1) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      await GamificationService.purchaseItem(user.id, itemId, quantity);
      // Reload user stats and purchases after purchase
      await Promise.all([loadUserStats(), loadUserPurchases()]);
    } catch (err) {
      setError('Failed to purchase item');
      console.error('Error purchasing item:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadUserStats, loadUserPurchases]);

  // Trigger daily login
  const triggerDailyLogin = useCallback(async () => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerDailyLogin(user.id);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering daily login:', err);
    }
  }, [user?.id, loadUserStats]);

  // Trigger course enrollment
  const triggerCourseEnrollment = useCallback(async (courseId: string) => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerCourseEnrollment(user.id, courseId);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering course enrollment:', err);
    }
  }, [user?.id, loadUserStats]);

  // Trigger course completion
  const triggerCourseCompletion = useCallback(async (courseId: string) => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerCourseCompletion(user.id, courseId);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering course completion:', err);
    }
  }, [user?.id, loadUserStats]);

  // Trigger profile completion
  const triggerProfileCompletion = useCallback(async () => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerProfileCompletion(user.id);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering profile completion:', err);
    }
  }, [user?.id, loadUserStats]);

  // Trigger first course
  const triggerFirstCourse = useCallback(async () => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerFirstCourse(user.id);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering first course:', err);
    }
  }, [user?.id, loadUserStats]);

  // Trigger perfect score
  const triggerPerfectScore = useCallback(async (assessmentId: string) => {
    if (!user?.id) return;

    try {
      await GamificationService.triggerPerfectScore(user.id, assessmentId);
      await loadUserStats();
    } catch (err) {
      console.error('Error triggering perfect score:', err);
    }
  }, [user?.id, loadUserStats]);

  // Award coins for learning actions
  const awardCoinsOnLearning = useCallback(async (courseId: string, actionType: 'start' | 'continue' | 'open_active_course') => {
    if (!user?.id) return;
    try {
      const result = await GamificationService.awardCoinsOnLearning(user.id, courseId, actionType);
      if (result && result.coins) {
        const isBigReward = result.coins >= 100; // Big reward for 100+ coins
        if (isBigReward) setShowCoinRain(true);
        toast.showToast(
          `+${result.coins} coins!`,
          isBigReward ? 'celebration' : 'success',
          5000,
          actionType === 'start' ? 'You started learning!' : actionType === 'continue' ? 'You continued your learning journey!' : actionType === 'open_active_course' ? 'You opened your active course!' : ''
        );
        await loadUserStats();
        if (isBigReward) setTimeout(() => setShowCoinRain(false), 2500);
      }
    } catch (err) {
      toast.showToast('Could not award coins', 'error');
    }
  }, [user?.id, toast, loadUserStats]);

  // Handle referral reward on course purchase
  const handleReferralReward = useCallback(async (courseId: string) => {
    if (!user?.id) return;
    try {
      const result = await GamificationService.handleReferralReward(user.id, courseId);
      if (result && result.message && result.message.includes('granted')) {
        setShowCoinRain(true);
        toast.showToast(
          '+1000 coins!',
          'celebration',
          6000,
          'Referral bonus! You earned coins for inviting a friend who purchased a course.'
        );
        await loadUserStats();
        setTimeout(() => setShowCoinRain(false), 2500);
      }
    } catch (err) {
      toast.showToast('Could not process referral reward', 'error');
    }
  }, [user?.id, toast, loadUserStats]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      loadBadges();
      loadStoreItems();
      loadUserPurchases();
    }
  }, [user?.id, loadUserStats, loadBadges, loadStoreItems, loadUserPurchases]);

  // Watch for leaderboard changes and trigger popup
  useEffect(() => {
    if (!user?.id || !leaderboard.length) return;
    const userEntry = leaderboard.find((u) => u.user_id === user.id);
    if (!userEntry) return;
    if (prevRank === null) {
      setPrevRank(userEntry.rank);
      return;
    }
    if (userEntry.rank <= 10 && (prevRank > 10 || userEntry.rank < prevRank)) {
      setShowLeaderboardPopup(true);
    }
    setPrevRank(userEntry.rank);
  }, [leaderboard, user?.id]);

  return {
    // State
    stats,
    leaderboard,
    badges,
    storeItems,
    userPurchases,
    loading,
    error,
    showCoinRain,
    CoinRain,
    showLeaderboardPopup,
    setShowLeaderboardPopup,
    userRank: leaderboard.find((u) => u.user_id === user?.id)?.rank || null,
    userId: user?.id || '',
    LeaderboardPopup,

    // Actions
    loadUserStats,
    loadLeaderboard,
    loadBadges,
    loadStoreItems,
    loadUserPurchases,
    awardPoints,
    purchaseItem,
    triggerDailyLogin,
    triggerCourseEnrollment,
    triggerCourseCompletion,
    triggerProfileCompletion,
    triggerFirstCourse,
    triggerPerfectScore,
    awardCoinsOnLearning,
    handleReferralReward,

    // Utility functions
    clearError: () => setError(null),
  };
} 