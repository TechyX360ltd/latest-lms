import React, { useState, useEffect } from 'react';
import { Star, Trash2, Eye, Filter, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useRatings } from '../../hooks/useRatings';
import { CourseRating, InstructorRating } from '../../types';
import { useToast } from '../Auth/ToastContext';
import { supabase } from '../../lib/supabase';

export function RatingManagement() {
  const [activeTab, setActiveTab] = useState<'course' | 'instructor'>('course');
  const [courseRatings, setCourseRatings] = useState<CourseRating[]>([]);
  const [instructorRatings, setInstructorRatings] = useState<InstructorRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const { deleteCourseRating } = useRatings();
  const { showToast } = useToast();

  useEffect(() => {
    fetchRatings();
  }, [activeTab]);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      if (activeTab === 'course') {
        const { data, error } = await supabase
          .from('course_ratings')
          .select(`*, user:users(first_name, last_name, avatar), course:courses(title)`)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCourseRatings(data || []);
      } else {
        const { data, error } = await supabase
          .from('instructor_ratings')
          .select(`*, learner:users!instructor_ratings_learner_id_fkey(first_name, last_name, avatar), instructor:users!instructor_ratings_instructor_id_fkey(first_name, last_name, avatar), course:courses(title)`)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setInstructorRatings(data || []);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch ratings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId: string, type: 'course' | 'instructor') => {
    if (!confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
      return;
    }

    try {
      if (type === 'course') {
        await deleteCourseRating(ratingId);
        setCourseRatings(courseRatings.filter(r => r.id !== ratingId));
      } else {
        const { error } = await supabase
          .from('instructor_ratings')
          .delete()
          .eq('id', ratingId);
        
        if (error) throw error;
        setInstructorRatings(instructorRatings.filter(r => r.id !== ratingId));
      }
      
      showToast('Rating deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to delete rating', 'error');
    }
  };

  const getFilteredRatings = () => {
    if (activeTab === 'course') {
      let ratings = [...courseRatings];
      
      // Search filter
      if (searchTerm) {
        ratings = ratings.filter(rating => 
          rating.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.review_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.review_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Rating filter
      if (ratingFilter !== 'all') {
        ratings = ratings.filter(rating => rating.rating === ratingFilter);
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        ratings = ratings.filter(rating => 
          statusFilter === 'verified' ? rating.is_verified_purchase : !rating.is_verified_purchase
        );
      }
      
      return ratings;
    } else {
      let ratings = [...instructorRatings];
      
      // Search filter
      if (searchTerm) {
        ratings = ratings.filter(rating => 
          rating.learner?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.learner?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.instructor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.instructor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.review_content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rating.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Rating filter
      if (ratingFilter !== 'all') {
        ratings = ratings.filter(rating => rating.rating === ratingFilter);
      }
      
      return ratings;
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const filteredRatings = getFilteredRatings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rating Management</h1>
          <p className="text-gray-600">Manage course and instructor ratings and reviews</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('course')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'course'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Course Ratings ({courseRatings.length})
          </button>
          <button
            onClick={() => setActiveTab('instructor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instructor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Instructor Ratings ({instructorRatings.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ratings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Status Filter (Course only) */}
          {activeTab === 'course' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified Purchases</option>
              <option value="unverified">Unverified</option>
            </select>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchRatings}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Ratings List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading ratings...</p>
          </div>
        ) : filteredRatings.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No ratings found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeTab === 'course' ? (
              (filteredRatings as CourseRating[]).map((rating) => (
                <div key={rating.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-gray-600">
                            {rating.rating} out of 5
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1">
                          {rating.is_verified_purchase ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rating.is_verified_purchase
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {rating.is_verified_purchase ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {rating.user?.first_name} {rating.user?.last_name}
                          </span>
                          {' reviewed '}
                          <span className="font-medium">{rating.course?.title}</span>
                        </div>
                      </div>

                      {/* Review Content */}
                      {rating.review_title && (
                        <h4 className="font-medium text-gray-900 mb-2">
                          {rating.review_title}
                        </h4>
                      )}
                      
                      {rating.review_content && (
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {rating.review_content}
                        </p>
                      )}

                      {/* Date */}
                      <div className="text-sm text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()} at {new Date(rating.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteRating(rating.id, 'course')}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete rating"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              (filteredRatings as InstructorRating[]).map((rating) => (
                <div key={rating.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          {renderStars(rating.rating)}
                          <span className="text-sm text-gray-600">
                            {rating.rating} out of 5
                          </span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">
                            {rating.learner?.first_name} {rating.learner?.last_name}
                          </span>
                          {' rated '}
                          <span className="font-medium">
                            {rating.instructor?.first_name} {rating.instructor?.last_name}
                          </span>
                          {' for '}
                          <span className="font-medium">{rating.course?.title}</span>
                        </div>
                      </div>

                      {/* Review Content */}
                      {rating.review_content && (
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {rating.review_content}
                        </p>
                      )}

                      {/* Detailed Ratings */}
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        {rating.teaching_quality && (
                          <span>Teaching: {rating.teaching_quality}★</span>
                        )}
                        {rating.communication && (
                          <span>Communication: {rating.communication}★</span>
                        )}
                        {rating.responsiveness && (
                          <span>Responsiveness: {rating.responsiveness}★</span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-sm text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()} at {new Date(rating.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteRating(rating.id, 'instructor')}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete rating"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {filteredRatings.length}
          </div>
          <div className="text-sm text-gray-600">Total Ratings</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {filteredRatings.length > 0 
              ? (filteredRatings.reduce((sum, r) => sum + r.rating, 0) / filteredRatings.length).toFixed(1)
              : '0.0'
            }
          </div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">
            {filteredRatings.filter(r => r.rating >= 4).length}
          </div>
          <div className="text-sm text-gray-600">4+ Star Ratings</div>
        </div>
      </div>
    </div>
  );
} 