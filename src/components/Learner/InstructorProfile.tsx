import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, UploadCloud, Camera, X, Star, Users, BookOpen, Award, MessageCircle, Calendar } from 'lucide-react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useRatings } from '../../hooks/useRatings';
import { InstructorRating, InstructorRatingStats } from '../../types';
import { useToast } from '../Auth/ToastContext';

interface InstructorProfileProps {
  instructorId: string;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  instructorExpertise?: string;
  courseCount?: number;
  studentCount?: number;
}

export function InstructorProfile({
  instructorId,
  instructorName,
  instructorBio,
  instructorAvatar,
  instructorExpertise,
  courseCount = 0,
  studentCount = 0
}: InstructorProfileProps) {
  const { user, updateUserProfile } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [expertise, setExpertise] = useState(user?.expertise || '');
  const [payoutEmail, setPayoutEmail] = useState(user?.payoutEmail || '');
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [nationalIdUrl, setNationalIdUrl] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const { instructorRatings, instructorStats, fetchInstructorRatings, fetchInstructorRatingStats } = useRatings();
  const { showToast } = useToast();

  useEffect(() => {
    // Load national ID from localStorage if present
    const stored = localStorage.getItem('instructorNationalId');
    if (stored) setNationalIdUrl(stored);
  }, []);

  useEffect(() => {
    fetchInstructorRatings(instructorId);
    fetchInstructorRatingStats(instructorId);
  }, [instructorId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNationalIdFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNationalIdUrl(ev.target.result as string);
          localStorage.setItem('instructorNationalId', ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB');
        return;
      }
      setIsLoading(true);
      setErrorMessage('');
      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file, 'lms-avatars');
        setAvatar(result.secure_url);
        setSuccessMessage('Profile photo uploaded successfully!');
      } catch (err) {
        setErrorMessage('Failed to upload image. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Save to localStorage (or call updateUserProfile if available)
      const updated = {
        bio,
        expertise,
        payoutEmail,
        nationalIdUrl,
        avatar,
      };
      localStorage.setItem('instructorProfile', JSON.stringify(updated));
      if (updateUserProfile) {
        await updateUserProfile(updated);
      }
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      setErrorMessage('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSortedReviews = () => {
    const reviews = [...instructorRatings];
    
    switch (sortBy) {
      case 'recent':
        return reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
    if (!instructorStats) return null;

    const total = instructorStats.total_ratings;
    if (total === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = instructorStats.rating_distribution[`${rating}_star` as keyof typeof instructorStats.rating_distribution];
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Instructor Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {instructorAvatar ? (
              <img
                src={instructorAvatar}
                alt={instructorName}
                className="w-full h-full rounded-full object-cover"
                  />
                ) : (
              <Users className="w-10 h-10 text-gray-500" />
                )}
              </div>
              
          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{instructorName}</h2>
            {instructorExpertise && (
              <p className="text-gray-600 mb-3">{instructorExpertise}</p>
            )}
            {instructorBio && (
              <p className="text-gray-700 mb-4 leading-relaxed">{instructorBio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">{courseCount} courses</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">{studentCount} students</span>
              </div>
              {instructorStats && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {instructorStats.average_rating.toFixed(1)} ({instructorStats.total_ratings} ratings)
                  </span>
            </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Stats */}
      {instructorStats && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Instructor Ratings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {instructorStats.average_rating.toFixed(1)}
              </div>
              {renderStars(Math.round(instructorStats.average_rating), 'lg')}
              <div className="text-sm text-gray-600 mt-2">
                {instructorStats.total_ratings} total ratings
              </div>
            </div>

            {/* Rating Distribution */}
        <div>
              <h4 className="font-medium text-gray-900 mb-3">Rating Distribution</h4>
              {renderRatingDistribution()}
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {instructorStats.teaching_quality_avg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Teaching Quality</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {instructorStats.communication_avg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Communication</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {instructorStats.responsiveness_avg.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Responsiveness</div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Student Reviews</h3>
          {instructorRatings.length > 0 && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
            </select>
          )}
        </div>

        {instructorRatings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet for this instructor.</p>
        ) : (
          <div className="space-y-6">
            {displayedReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4">
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
                        <span className="text-sm text-gray-600">
                          for {review.course.title}
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
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        {review.teaching_quality && (
                          <span>Teaching: {review.teaching_quality}★</span>
                        )}
                        {review.communication && (
                          <span>Communication: {review.communication}★</span>
                        )}
                        {review.responsiveness && (
                          <span>Responsiveness: {review.responsiveness}★</span>
                        )}
                      </div>
                    )}

                    {/* Review Content */}
                    {review.review_content && (
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {review.review_content}
                      </p>
                    )}

                    {/* Review Date */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
        </div>
            ))}

            {/* Show More/Less Button */}
            {instructorRatings.length > 5 && (
              <div className="text-center pt-4">
            <button
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
                  {showAllReviews ? 'Show Less' : `Show All ${instructorRatings.length} Reviews`}
            </button>
              </div>
            )}
            </div>
          )}
        </div>
    </div>
  );
} 