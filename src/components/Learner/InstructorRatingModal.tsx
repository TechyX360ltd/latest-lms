import React, { useState } from 'react';
import { Star, X, Send, UserCheck } from 'lucide-react';
import { useRatings } from '../../hooks/useRatings';
import { useToast } from '../Auth/ToastContext';

interface InstructorRatingModalProps {
  instructorId: string;
  instructorName: string;
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted: () => void;
}

export function InstructorRatingModal({ 
  instructorId, 
  instructorName, 
  courseId, 
  courseTitle, 
  isOpen, 
  onClose, 
  onRatingSubmitted 
}: InstructorRatingModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredOverall, setHoveredOverall] = useState(0);
  const [teachingQuality, setTeachingQuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [responsiveness, setResponsiveness] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { createInstructorRating } = useRatings();
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (overallRating === 0) {
      showToast('Please select an overall rating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createInstructorRating({
        instructorId,
        courseId,
        rating: overallRating,
        reviewContent: reviewContent.trim() || undefined,
        teachingQuality: teachingQuality || undefined,
        communication: communication || undefined,
        responsiveness: responsiveness || undefined
      });

      showToast('Thank you for rating the instructor!', 'success');
      onRatingSubmitted();
      handleClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOverallRating(0);
    setHoveredOverall(0);
    setTeachingQuality(0);
    setCommunication(0);
    setResponsiveness(0);
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

  const renderStarRating = (
    rating: number,
    setRating: (rating: number) => void,
    hovered: number,
    setHovered: (rating: number) => void,
    label: string
  ) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="p-1 transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hovered || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="text-xs text-gray-500 ml-2">
          {getRatingText(hovered || rating)}
        </span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate Instructor</h2>
              <p className="text-gray-600">Rate {instructorName} for {courseTitle}</p>
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
          {/* Overall Rating */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoveredOverall(star)}
                  onMouseLeave={() => setHoveredOverall(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredOverall || overallRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              {getRatingText(hoveredOverall || overallRating)}
            </p>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Detailed Ratings (Optional)</h3>
            
            {renderStarRating(
              teachingQuality,
              setTeachingQuality,
              0,
              () => {},
              'Teaching Quality'
            )}
            
            {renderStarRating(
              communication,
              setCommunication,
              0,
              () => {},
              'Communication'
            )}
            
            {renderStarRating(
              responsiveness,
              setResponsiveness,
              0,
              () => {},
              'Responsiveness'
            )}
          </div>

          {/* Review Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Share your experience with this instructor..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reviewContent.length}/500 characters
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Rating Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Teaching Quality:</strong> How well did they explain concepts?</li>
              <li>• <strong>Communication:</strong> How clear and engaging were they?</li>
              <li>• <strong>Responsiveness:</strong> How quickly did they respond to questions?</li>
              <li>• Be honest and constructive in your feedback</li>
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
            disabled={submitting || overallRating === 0}
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
                Submit Rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 