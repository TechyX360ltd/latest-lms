import React, { useState } from 'react';
import { Star, X, Send, CheckCircle } from 'lucide-react';
import { useRatings } from '../../hooks/useRatings';
import { useToast } from '../Auth/ToastContext';

interface CourseRatingModalProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

export function CourseRatingModal({ 
  courseId, 
  courseTitle, 
  isOpen, 
  onClose, 
  onRatingSubmitted 
}: CourseRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { createCourseRating } = useRatings();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createCourseRating({
        courseId,
        rating,
        reviewTitle: reviewTitle.trim() || undefined,
        reviewContent: reviewContent.trim() || undefined
      });

      showToast('Thank you for your review!', 'success');
      onRatingSubmitted();
      handleClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewTitle('');
    setReviewContent('');
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate This Course</h2>
              <p className="text-gray-600">Share your experience with {courseTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Star Rating */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating
            </label>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Summarize your experience in a few words"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewTitle.length}/100 characters
            </p>
          </div>

          {/* Review Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Review (Optional)
            </label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your thoughts about the course content, instructor, and overall learning experience..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewContent.length}/1000 characters
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Review Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Be specific about what you liked or didn't like</li>
              <li>• Mention the instructor's teaching style</li>
              <li>• Share how the course helped you learn</li>
              <li>• Be honest and constructive</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Skip for Now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 