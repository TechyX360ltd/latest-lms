import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, User, Calendar } from 'lucide-react';
import { useRatings } from '../../hooks/useRatings';
import { CourseRating, CourseRatingStats } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Auth/ToastContext';

interface CourseReviewsProps {
  courseId: string;
  courseTitle: string;
}

export function CourseReviews({ courseId, courseTitle }: CourseReviewsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const { courseRatings, courseStats, fetchCourseRatings, fetchCourseRatingStats, voteReviewHelpful } = useRatings();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchCourseRatings(courseId);
    fetchCourseRatingStats(courseId);
  }, [courseId]);

  const handleVoteHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      await voteReviewHelpful(reviewId, isHelpful);
      showToast(isHelpful ? 'Marked as helpful!' : 'Vote recorded', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to vote', 'error');
    }
  };

  const getSortedReviews = () => {
    const reviews = [...courseRatings];
    
    switch (sortBy) {
      case 'recent':
        return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'helpful':
        return reviews.sort((a, b) => b.helpful_votes - a.helpful_votes);
      case 'rating':
        return reviews.sort((a, b) => b.rating - a.rating);
      default:
        return reviews;
    }
  };

  const displayedReviews = showAllReviews ? getSortedReviews() : getSortedReviews().slice(0, 5);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!courseStats) return null;

    const total = courseStats.total_ratings;
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = courseStats.rating_distribution[`${rating}_star` as keyof typeof courseStats.rating_distribution];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (!courseStats && courseRatings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
        <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this course!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
          {courseStats && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {courseStats.average_rating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center">
                  {renderStars(Math.round(courseStats.average_rating), 'sm')}
                </div>
                <div className="text-sm text-gray-600">
                  {courseStats.total_ratings} reviews
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rating Distribution */}
        {courseStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
              {renderRatingDistribution()}
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Verified Purchases:</strong> {courseStats.verified_purchases}</p>
              <p><strong>Total Reviews:</strong> {courseStats.total_ratings}</p>
            </div>
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {displayedReviews.map((review) => (
          <div key={review.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {review.user?.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt={`${review.user.firstName} ${review.user.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Review Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {review.user?.firstName} {review.user?.lastName}
                  </span>
                  {review.is_verified_purchase && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(review.rating, 'sm')}
                  <span className="text-sm text-gray-600">
                    {review.rating} out of 5
                  </span>
                </div>

                {/* Review Title */}
                {review.review_title && (
                  <h4 className="font-medium text-gray-900 mb-2">
                    {review.review_title}
                  </h4>
                )}

                {/* Review Content */}
                {review.review_content && (
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {review.review_content}
                  </p>
                )}

                {/* Review Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                    {review.helpful_votes > 0 && (
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {review.helpful_votes} helpful
                      </div>
                    )}
                  </div>

                  {/* Helpful Button */}
                  <button
                    onClick={() => handleVoteHelpful(review.id, true)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {courseRatings.length > 5 && (
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            {showAllReviews ? 'Show Less' : `Show All ${courseRatings.length} Reviews`}
          </button>
        </div>
      )}
    </div>
  );
} 