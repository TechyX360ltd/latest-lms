import React, { useState, useEffect, useRef } from 'react';
import { 
  Award, 
  Star, 
  Lock, 
  CheckCircle, 
  Filter,
  Search,
  Zap,
  Target,
  Flame,
  Crown
} from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import { Badge, UserBadge } from '../../types/gamification';
import { BADGE_CATEGORIES, BADGE_RARITIES } from '../../types/gamification';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export function BadgeCollection() {
  const { loadBadges, badges, stats, loading, error } = useGamification();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevEarnedBadges = useRef<number>(0);
  const { width, height } = useWindowSize();

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  // Show confetti when a new badge is unlocked
  useEffect(() => {
    const earnedBadges = stats?.badges?.length || 0;
    if (earnedBadges > prevEarnedBadges.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
    prevEarnedBadges.current = earnedBadges;
  }, [stats?.badges?.length]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="w-4 h-4" />;
      case 'rare': return <Zap className="w-4 h-4" />;
      case 'epic': return <Target className="w-4 h-4" />;
      case 'legendary': return <Crown className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'achievement': return <Target className="w-4 h-4" />;
      case 'participation': return <Flame className="w-4 h-4" />;
      case 'milestone': return <Award className="w-4 h-4" />;
      case 'special': return <Crown className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const isBadgeEarned = (badgeId: string) => {
    return stats?.badges?.some(userBadge => userBadge.badge_id === badgeId) || false;
  };

  const getUserBadge = (badgeId: string): UserBadge | undefined => {
    return stats?.badges?.find(userBadge => userBadge.badge_id === badgeId);
  };

  const filteredBadges = badges.filter(badge => {
    const matchesCategory = filterCategory === 'all' || badge.category === filterCategory;
    const matchesRarity = filterRarity === 'all' || badge.rarity === filterRarity;
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesRarity && matchesSearch;
  });

  const earnedBadges = stats?.badges?.length || 0;
  const totalBadges = badges.length;
  const completionPercentage = totalBadges > 0 ? Math.round((earnedBadges / totalBadges) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Badges</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-500" />
            Badge Collection
          </h2>
          <p className="text-gray-600">Unlock badges by completing achievements</p>
        </div>
        
        {/* Progress */}
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{earnedBadges}/{totalBadges}</div>
          <div className="text-sm text-gray-600">Badges earned</div>
          <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{completionPercentage}% complete</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search badges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {Object.entries(BADGE_CATEGORIES).map(([key, description]) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>

          {/* Rarity Filter */}
          <select
            value={filterRarity}
            onChange={(e) => setFilterRarity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Rarities</option>
            {Object.entries(BADGE_RARITIES).map(([key, description]) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBadges.map((badge) => {
          const earned = isBadgeEarned(badge.id);
          const userBadge = getUserBadge(badge.id);
          
          return (
            <div
              key={badge.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                earned 
                  ? 'border-green-200 hover:border-green-300' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedBadge(badge)}
            >
              {/* Earned Indicator */}
              {earned && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              )}

              {/* Badge Icon */}
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  earned ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-100'
                }`}>
                  {badge.icon_url ? (
                    <img 
                      src={badge.icon_url} 
                      alt={badge.name}
                      className={`w-8 h-8 ${earned ? 'filter brightness-0 invert' : ''}`}
                    />
                  ) : (
                    <Award className={`w-8 h-8 ${earned ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>

                {/* Badge Info */}
                <h3 className="font-semibold text-gray-900 mb-2">{badge.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{badge.description}</p>

                {/* Rarity Badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(badge.rarity)}`}>
                  {getRarityIcon(badge.rarity)}
                  {badge.rarity}
                </div>

                {/* Points Required */}
                <div className="mt-3 text-xs text-gray-500">
                  {earned ? (
                    <div className="text-green-600">
                      Earned {userBadge && new Date(userBadge.earned_at).toLocaleDateString()}
                    </div>
                  ) : (
                    <div>
                      Requires {badge.points_required.toLocaleString()} points
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Badge Details</h3>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center space-y-4">
              {/* Badge Icon */}
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                isBadgeEarned(selectedBadge.id) 
                  ? 'bg-gradient-to-br from-green-400 to-green-600' 
                  : 'bg-gray-100'
              }`}>
                {selectedBadge.icon_url ? (
                  <img 
                    src={selectedBadge.icon_url} 
                    alt={selectedBadge.name}
                    className={`w-10 h-10 ${isBadgeEarned(selectedBadge.id) ? 'filter brightness-0 invert' : ''}`}
                  />
                ) : (
                  <Award className={`w-10 h-10 ${isBadgeEarned(selectedBadge.id) ? 'text-white' : 'text-gray-400'}`} />
                )}
              </div>

              {/* Badge Info */}
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h4>
                <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
              </div>

              {/* Badge Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedBadge.category}</div>
                  <div className="text-gray-600">Category</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedBadge.rarity}</div>
                  <div className="text-gray-600">Rarity</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{selectedBadge.points_required.toLocaleString()}</div>
                  <div className="text-gray-600">Points Required</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">
                    {isBadgeEarned(selectedBadge.id) ? 'Earned' : 'Not Earned'}
                  </div>
                  <div className="text-gray-600">Status</div>
                </div>
              </div>

              {/* Earned Date */}
              {isBadgeEarned(selectedBadge.id) && getUserBadge(selectedBadge.id) && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    Earned on {new Date(getUserBadge(selectedBadge.id)!.earned_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 