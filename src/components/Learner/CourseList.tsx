import React, { useState } from 'react';
import { Clock, Users, Star, Play, Eye, Award, CheckCircle, Coins } from 'lucide-react';
import { useCourses, useUsers } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useGamification } from '../../hooks/useGamification';
import { supabase } from '../../lib/supabase';
import CourseDetailsModal from './CourseDetailsModal';

interface CourseListProps {}

export function CourseList({}: CourseListProps) {
  const { courses, loading } = useCourses();
  const { users } = useUsers();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { onViewCourse } = useOutletContext<{ onViewCourse: (courseId: string) => void }>();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { stats, loadUserStats } = useGamification();
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [coinModalCourse, setCoinModalCourse] = useState<any>(null);
  const [coinModalLoading, setCoinModalLoading] = useState(false);
  const [coinModalError, setCoinModalError] = useState<string | null>(null);
  const [coinModalSuccess, setCoinModalSuccess] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const COIN_CONVERSION = 100; // 100 coins = ₦1
  const MIN_NAIRA = 1;
  const MAX_NAIRA = 10000;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const enrolledCourses = courses.filter(course => 
    !!user && Array.isArray(user.enrolledCourses) && user.enrolledCourses.includes(course.id)
  );

  const completedCourses = courses.filter(course => 
    !!user && Array.isArray(user.completedCourses) && user.completedCourses.includes(course.id)
  );

  const handleBrowseCourses = () => {
    navigate('/dashboard/browse');
  };

  const handleContinueCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const handleViewDetails = (course: any) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const handleViewCertificate = () => {
    navigate('/dashboard/certificates');
  };

  const handleJoinCommunity = () => {
    window.open('https://chat.whatsapp.com/Beu0xCMTdVu3ZVxoUOjSwN', '_blank');
  };

  const currentCourses = activeTab === 'active' ? enrolledCourses : completedCourses;

  const handlePayWithCoins = async (course: any) => {
    setCoinModalLoading(true);
    setCoinModalError(null);
    setCoinModalSuccess(null);
    try {
      const { data, error } = await supabase.rpc('pay_with_coins', {
        p_user_id: user.id,
        p_course_id: course.id,
      });
      if (error || data?.error) {
        throw new Error(data?.error || error.message || 'Could not enroll with coins.');
      }
      setCoinModalSuccess('Enrollment successful!');
      loadUserStats();
      setCoinModalLoading(false);
      setTimeout(() => {
        setShowCoinModal(false);
        setCoinModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setCoinModalError(err.message || 'Could not enroll with coins.');
      setCoinModalLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Track your learning progress and continue where you left off</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleJoinCommunity}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg transform hover:scale-105"
          >
            <Users className="w-5 h-5" />
            <span className="hidden sm:inline">Join WhatsApp Community</span>
            <span className="sm:hidden">Join Community</span>
          </button>
          <div className="hidden md:block">
            <img 
              src="/BLACK-1-removebg-preview.png" 
              alt="TECHYX 360" 
              className="h-10 w-auto opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.length + completedCourses.length > 0 
                  ? Math.round((completedCourses.length / (enrolledCourses.length + completedCourses.length)) * 100)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-6">
        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
          <div className="flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'active'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>Active Courses</span>
              {enrolledCourses.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'active' ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {enrolledCourses.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-green-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Completed</span>
              {completedCourses.length > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'completed' ? 'bg-white text-green-600' : 'bg-green-100 text-green-600'
                }`}>
                  {completedCourses.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Course Grid */}
        {currentCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentCourses.map((course) => {
              const eligible = course.price >= MIN_NAIRA && course.price <= MAX_NAIRA;
              const coinPrice = course.price * COIN_CONVERSION;
              const canAfford = (stats?.coins || 0) >= coinPrice;
              return (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                    {activeTab === 'completed' && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                        {course.duration} hours
                      </div>
                    </div>
                  </div>
                  <div className="p-4 lg:p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                        {(() => {
                          const instructor = users.find(u => u.id === course.instructor_id);
                          if (instructor) {
                            return (
                              <div className="flex items-center gap-2 mb-1">
                                {instructor.avatar ? (
                                  <img src={instructor.avatar} alt={instructor.firstName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-gray-200">
                                    {instructor.firstName?.[0] || ''}{instructor.lastName?.[0] || ''}
                                  </div>
                                )}
                                <span className="font-bold text-gray-800 text-sm">{instructor.firstName} {instructor.lastName}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-base font-semibold text-gray-900">{'rating' in course && typeof course.rating === 'number' ? course.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolled_count || 0} students</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      {activeTab === 'active' ? (
                        <>
                        <Link to={`/course/${course.slug}`} className="flex-1">
                          <button className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <Play className="w-5 h-5" /> Continue
                          </button>
                        </Link>
                          <button
                            onClick={() => handleViewDetails(course)}
                            className="flex-1 bg-gray-100 text-blue-700 px-6 py-2 rounded-lg font-medium hover:bg-blue-100 border border-blue-200 transition-colors flex items-center justify-center gap-2"
                            style={{ minWidth: '0' }}
                          >
                            <Eye className="w-5 h-5" /> View
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleViewCertificate}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Award className="w-4 h-4" /> View Certificate
                        </button>
                      )}
                      {eligible && !!user && user.enrolledCourses && !user.enrolledCourses.includes(course.id) && (
                        <button
                          onClick={() => { setCoinModalCourse(course); setShowCoinModal(true); }}
                          disabled={!canAfford}
                          className={`w-full bg-yellow-500 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${canAfford ? 'hover:bg-yellow-600' : 'opacity-60 cursor-not-allowed'}`}
                          title={canAfford ? 'Pay with coins' : 'Not enough coins'}
                        >
                          <Coins className="w-4 h-4" />
                          {coinPrice.toLocaleString()} coins
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            {activeTab === 'active' ? (
              <>
                <Play className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active courses</h3>
                <p className="text-gray-600 mb-6">Start learning by enrolling in new courses</p>
                <button 
                  onClick={handleBrowseCourses}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Browse Courses
                </button>
              </>
            ) : (
              <>
                <Award className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed courses yet</h3>
                <p className="text-gray-600 mb-6">Complete your active courses to earn certificates</p>
                <button 
                  onClick={() => setActiveTab('active')}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  View Active Courses
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {showCoinModal && coinModalCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pay with Coins</h3>
            <div className="mb-4 text-gray-700">
              Are you sure you want to enroll in <span className="font-bold">{coinModalCourse.title}</span> for <span className="font-bold text-yellow-600">{(coinModalCourse.price * COIN_CONVERSION).toLocaleString()}</span> gold coins?
            </div>
            {coinModalError && <div className="text-red-600 mb-2">{coinModalError}</div>}
            {coinModalSuccess && <div className="text-green-600 mb-2">{coinModalSuccess}</div>}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCoinModal(false)}
                className="w-1/2 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                disabled={coinModalLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayWithCoins(coinModalCourse)}
                className="w-1/2 bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                disabled={coinModalLoading}
              >
                {coinModalLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDetailsModal && selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}