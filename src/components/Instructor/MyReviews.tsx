import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRatings } from '../../hooks/useRatings';
import { 
  Star, 
  Users, 
  Calendar, 
  Filter, 
  SortAsc, 
  SortDesc,
  MessageCircle,
  TrendingUp,
  Award,
  BookOpen,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export default function MyReviews() {
  const { user } = useAuth();
  const { 
    instructorRatings, 
    instructorStats, 
    fetchInstructorRatings, 
    fetchInstructorRatingStats,
    loading,
    error 
  } = useRatings();
  
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'course'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchInstructorRatings(user.id);
      fetchInstructorRatingStats(user.id);
    }
  }, [user?.id]);

  const getSortedReviews = () => {
    let reviews = [...instructorRatings];
    
    // Filter by rating if selected
    if (filterRating) {
      reviews = reviews.filter(review => review.rating === filterRating);
    }
    
    // Filter by course if selected
    if (selectedCourse) {
      reviews = reviews.filter(review => review.course_id === selectedCourse);
    }
    
    // Sort reviews
    switch (sortBy) {
      case 'recent':
        return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'rating':
        return reviews.sort((a, b) => b.rating - a.rating);
      case 'course':
        return reviews.sort((a, b) => (a.course?.title || '').localeCompare(b.course?.title || ''));
      default:
        return reviews;
    }
  };

  const displayedReviews = showAllReviews ? getSortedReviews() : getSortedReviews().slice(0, 10);

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
    if (!instructorStats || !instructorStats.rating_distribution) return null;

    const total = instructorStats.total_ratings;
    if (!total || total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          // Use 0 as fallback if the key is missing
          const key = `${rating}_star` as keyof typeof instructorStats.rating_distribution;
          const count = instructorStats.rating_distribution[key] ?? 0;
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

  const getUniqueCourses = () => {
    const courses = instructorRatings
      .map(review => ({ id: review.course_id, title: review.course?.title }))
      .filter(course => course.title)
      .map(course => ({ id: course.id, title: course.title! }));
    
    return Array.from(new Map(courses.map(course => [course.id, course])).values());
  };

  const getAverageRating = () => {
    if (!instructorRatings.length) return 0;
    const total = instructorRatings.reduce((sum, review) => sum + review.rating, 0);
    return total / instructorRatings.length;
  };

  const getRecentReviews = () => {
    return instructorRatings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Remove <Sidebar /> and <Header /> from this file */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
              <p className="text-gray-600">Track your performance and student feedback</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{typeof getAverageRating() === 'number' && !isNaN(getAverageRating()) ? getAverageRating().toFixed(1) : '0.0'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{instructorRatings.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Courses Reviewed</p>
                    <p className="text-2xl font-bold text-gray-900">{getUniqueCourses().length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">5-Star Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {instructorRatings.filter(r => r.rating === 5).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Distribution */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Rating Distribution</h3>
                  {renderRatingDistribution()}
                  
                  {instructorStats && (
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Teaching Quality</span>
                        <span className="font-semibold text-blue-600">
                          {instructorStats?.teaching_quality_avg != null && !isNaN(instructorStats.teaching_quality_avg) ? instructorStats.teaching_quality_avg.toFixed(1) : '0.0'}★
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Communication</span>
                        <span className="font-semibold text-green-600">
                          {instructorStats?.communication_avg != null && !isNaN(instructorStats.communication_avg) ? instructorStats.communication_avg.toFixed(1) : '0.0'}★
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Responsiveness</span>
                        <span className="font-semibold text-purple-600">
                          {instructorStats?.responsiveness_avg != null && !isNaN(instructorStats.responsiveness_avg) ? instructorStats.responsiveness_avg.toFixed(1) : '0.0'}★
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm">
                  {/* Filters */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Filter className="w-4 h-4 text-gray-500" />
                          <select
                            value={filterRating || ''}
                            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-500" />
                          <select
                            value={selectedCourse || ''}
                            onChange={(e) => setSelectedCourse(e.target.value || null)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">All Courses</option>
                            {getUniqueCourses().map(course => (
                              <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {sortBy === 'recent' ? <SortDesc className="w-4 h-4 text-gray-500" /> : <SortAsc className="w-4 h-4 text-gray-500" />}
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="recent">Most Recent</option>
                          <option value="rating">Highest Rated</option>
                          <option value="course">By Course</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="p-6">
                    {loading ? (
                      <div className="text-center py-8 text-gray-400">Loading reviews...</div>
                    ) : error ? (
                      <div className="text-center py-8 text-red-500">{error}</div>
                    ) : instructorRatings.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-900 mb-2">No reviews yet</p>
                        <p className="text-gray-600">Start teaching courses to receive student feedback</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {displayedReviews.map((review) => (
                          <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              {/* User Avatar */}
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                {review.learner?.avatar ? (
                                  <img
                                    src={review.learner.avatar}
                                    alt={`${review.learner.firstName} ${review.learner.lastName}`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="w-5 h-5 text-gray-500" />
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-gray-900">
                                    {review.learner?.firstName} {review.learner?.lastName}
                                  </span>
                                  {review.course && (
                                    <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                      {review.course.title}
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

                                {/* Detailed Ratings */}
                                {(review.teaching_quality || review.communication || review.responsiveness) && (
                                  <div className="flex items-center gap-4 mb-3 text-sm">
                                    {review.teaching_quality && (
                                      <span className="text-blue-600">Teaching: {review.teaching_quality}★</span>
                                    )}
                                    {review.communication && (
                                      <span className="text-green-600">Communication: {review.communication}★</span>
                                    )}
                                    {review.responsiveness && (
                                      <span className="text-purple-600">Responsiveness: {review.responsiveness}★</span>
                                    )}
                                  </div>
                                )}

                                {/* Review Content */}
                                {review.review_content && (
                                  <p className="text-gray-700 mb-3 leading-relaxed">
                                    "{review.review_content}"
                                  </p>
                                )}

                                {/* Review Date */}
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(review.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Show More/Less Button */}
                        {getSortedReviews().length > 10 && (
                          <div className="text-center pt-4">
                            <button
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            >
                              {showAllReviews ? 'Show Less' : `Show All ${getSortedReviews().length} Reviews`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 