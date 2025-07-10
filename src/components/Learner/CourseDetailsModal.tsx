import React from 'react';
import { X, Users, Star, BookOpen, Coins, CheckCircle, Banknote } from 'lucide-react';
import { useCourseStructure } from '../../hooks/useData';

interface CourseDetailsModalProps {
  course: any;
  onClose: () => void;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ course, onClose }) => {
  if (!course) return null;
  // Fetch real modules/lessons from backend
  const { modules, loading, error } = useCourseStructure(course.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md h-full bg-white shadow-2xl rounded-l-2xl flex flex-col overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Icon */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Thumbnail */}
        <div className="relative w-full aspect-video bg-gray-100 rounded-t-2xl overflow-hidden flex items-center justify-center">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover object-center rounded-t-2xl border-b border-gray-200 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}
            />
          ) : (
            <BookOpen className="w-16 h-16 text-gray-300" />
          )}
        </div>
        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h2>
          <p className="text-gray-600 mb-2 text-base leading-tight">{course.description}</p>
          {/* Instructor & Learners */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{course.instructor || 'Instructor Name'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{course.enrolled_count || 0} learners</span>
            </div>
          </div>
          {/* Ratings & Reviews */}
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-gray-800">{course.avg_rating || '4.8'}</span>
            <span className="text-gray-500 text-sm">({course.num_reviews || 120} reviews)</span>
          </div>
          {/* Amount & Status */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-4">
              {/* NGN price with cash icon and green color */}
              {course.price ? (
                <span className="flex items-center gap-1 text-green-700 font-bold">
                  <Banknote className="w-5 h-5" />
                  {course.price} NGN
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-700 font-bold">
                  <Banknote className="w-5 h-5" />
                  Free
                </span>
              )}
              {/* Show coin price if eligible */}
              {course.price && course.price >= 1 && course.price <= 10000 && (
                <span className="flex items-center gap-1 text-yellow-700 font-bold">
                  <Coins className="w-4 h-4" />
                  {(course.price * 100).toLocaleString()} coins
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>Enrolled</span>
            </div>
          </div>
          {/* Modules Preview */}
          <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Course Modules</h3>
            <div className="space-y-2">
              {loading ? (
                <div className="text-gray-400">Loading modules...</div>
              ) : error ? (
                <div className="text-red-600">{error}</div>
              ) : modules.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-gray-500">No modules found</div>
              ) : (
                modules.map((mod: any, idx: number) => (
                  <div key={mod.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="font-semibold text-blue-700 mb-1">{mod.title}</div>
                    <div className="text-xs text-gray-500">{mod.lessons?.length || 0} lessons</div>
                    {mod.lessons && mod.lessons.length > 0 && (
                      <ul className="mt-1 ml-4 list-disc text-xs text-gray-600">
                        {mod.lessons.slice(0, 3).map((lesson: any, lidx: number) => (
                          <li key={lesson.id}>{lesson.title}</li>
                        ))}
                        {mod.lessons.length > 3 && <li>...and more</li>}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Reviews Placeholder */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reviews</h3>
            <div className="text-gray-500 text-sm">Reviews coming soon...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailsModal; 