import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle, 
  Star, 
  Users, 
  BookOpen, 
  Award, 
  Clock, 
  MapPin, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  MessageCircle,
  Heart,
  Share2,
  Play,
  Eye,
  Filter,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRatings } from '../../hooks/useRatings';
import { useToast } from '../Auth/ToastContext';

interface Instructor {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  education?: string;
  expertise?: string;
  avatar_url?: string;
  is_approved?: boolean;
  verification_status?: string;
  created_at: string;
  updated_at: string;
  points?: number;
  coins?: number;
  current_streak?: number;
  longest_streak?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  duration: number;
  enrolled_count: number;
  rating: number;
  is_published: boolean;
  created_at: string;
}

interface InstructorRating {
  id: string;
  instructor_id: string;
  learner_id: string;
  course_id: string;
  rating: number;
  review_content?: string;
  teaching_quality?: number;
  communication?: number;
  responsiveness?: number;
  created_at: string;
  learner?: {
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
    avatar_url?: string;
  };
  course?: {
    title: string;
  };
}

export function InstructorProfilePage() {
  const { instructorId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { createInstructorRating, instructorRatings, instructorStats, fetchInstructorRatings, fetchInstructorRatingStats } = useRatings();
  
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'reviews'>('overview');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    review_content: '',
    teaching_quality: 5,
    communication: 5,
    responsiveness: 5,
    course_id: ''
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'price'>('recent');

  useEffect(() => {
    if (instructorId) {
      fetchInstructorData();
      fetchInstructorCourses();
      fetchInstructorRatings(instructorId);
      fetchInstructorRatingStats(instructorId);
    }
  }, [instructorId]);

  const fetchInstructorData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', instructorId)
        .single();
      
      if (error) throw error;
      setInstructor(data);
    } catch (error) {
      console.error('Error fetching instructor:', error);
      showToast('Failed to load instructor profile', 'error');
    }
  };

  const fetchInstructorCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showToast('Failed to load instructor courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!user || !instructor) return;

    // If no course is selected, use the first available course
    let courseId = ratingForm.course_id;
    if (!courseId && courses.length > 0) {
      courseId = courses[0].id;
    }

    if (!courseId) {
      showToast('Please select a course to rate the instructor for', 'error');
      return;
    }

    try {
      await createInstructorRating({
        instructorId: instructor.id,
        courseId: courseId,
        rating: ratingForm.rating,
        reviewContent: ratingForm.review_content,
        teachingQuality: ratingForm.teaching_quality,
        communication: ratingForm.communication,
        responsiveness: ratingForm.responsiveness
      });

      showToast('Rating submitted successfully!', 'success');
      setShowRatingModal(false);
      setRatingForm({
        rating: 5,
        review_content: '',
        teaching_quality: 5,
        communication: 5,
        responsiveness: 5,
        course_id: ''
      });
      
      // Refresh ratings
      fetchInstructorRatings(instructor.id);
      fetchInstructorRatingStats(instructor.id);
    } catch (error) {
      if (error.message && error.message.includes('duplicate key value')) {
        showToast('You have already rated this instructor for this course.', 'error');
      } else {
        console.error('Rating submission error:', error);
        showToast('Failed to submit rating', 'error');
      }
    }
  };

  const openRatingModal = (course: Course) => {
    setSelectedCourse(course);
    setRatingForm(prev => ({ ...prev, course_id: course.id }));
    setShowRatingModal(true);
  };

  const getInstructorName = (instructor: Instructor) => {
    return `${instructor.first_name || instructor.firstName || ''} ${instructor.last_name || instructor.lastName || ''}`.trim() || instructor.email;
  };

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
            className={`${sizeClasses[size]} ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getSortedCourses = () => {
    let sorted = [...courses];
    
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return sorted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">Instructor not found</div>
          <Link to="/dashboard/browse" className="text-blue-600 hover:underline">
            ← Back to Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  const instructorName = getInstructorName(instructor);
  const totalStudents = courses.reduce((sum, course) => sum + (course.enrolled_count || 0), 0);
  const averageRating = courses.length > 0 
    ? courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            to="/dashboard/browse" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Browse Courses
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructor Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-xl">
                  {instructor.avatar_url ? (
                    <img
                      src={instructor.avatar_url}
                      alt={instructorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                      <Users className="w-10 h-10 sm:w-16 sm:h-16 text-white/70" />
                    </div>
                  )}
                </div>
                {instructor.verification_status === 'verified' && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{instructorName}</h1>
                  {instructor.verification_status === 'verified' && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Verified Instructor
                    </span>
                  )}
                </div>
                
                {instructor.expertise && (
                  <p className="text-xl text-blue-100 mb-4">{instructor.expertise}</p>
                )}
                
                {instructor.bio && (
                  <p className="text-blue-100 mb-6 leading-relaxed max-w-3xl">{instructor.bio}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <div className="text-blue-100 text-sm">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalStudents.toLocaleString()}</div>
                    <div className="text-blue-100 text-sm">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                    <div className="text-blue-100 text-sm">Avg Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{instructorStats?.total_ratings || 0}</div>
                    <div className="text-blue-100 text-sm">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Star className="w-5 h-5" />
                  Rate Instructor
                </button>
                <a
                  href={`mailto:${instructor.email}`}
                  className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Connect with Me
                </a>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {instructor.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{instructor.location}</span>
                </div>
              )}
              {instructor.occupation && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{instructor.occupation}</span>
                </div>
              )}
              {instructor.education && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{instructor.education}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">
                  Joined {new Date(instructor.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-8">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'courses'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-5 h-5" />
                                Courses ({courses.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'reviews'
                  ? 'bg-blue-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Star className="w-5 h-5" />
              Reviews ({instructorStats?.total_ratings || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Average Rating</h3>
                  <div className="flex items-center gap-2">
                    {renderStars(averageRating)}
                    <span className="text-sm text-gray-600">({instructorStats?.total_ratings || 0} reviews)</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Total Students</h3>
                  <p className="text-sm text-gray-600">Across all courses</p>
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                <div className="space-y-4">
                  {instructorRatings.slice(0, 3).map((rating) => (
                    <div key={rating.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {rating.learner?.avatar_url ? (
                            <img
                              src={rating.learner.avatar_url}
                              alt="Learner"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {rating.learner ? `${rating.learner.first_name || rating.learner.firstName || ''} ${rating.learner.last_name || rating.learner.lastName || ''}`.trim() : 'Anonymous'}
                            </span>
                            {rating.course && (
                              <span className="text-sm text-gray-600">
                                for {rating.course.title}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {renderStars(rating.rating, 'sm')}
                            <span className="text-sm text-gray-600">
                              {rating.rating} out of 5
                            </span>
                          </div>
                          {rating.review_content && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {rating.review_content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{instructor.email}</span>
                  </div>
                  {instructor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{instructor.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Follow</h3>
                <div className="flex gap-3">
                  <button className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-blue-400 text-white rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-pink-600 text-white rounded-lg flex items-center justify-center hover:bg-pink-700 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                    <Youtube className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Price: Low to High</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getSortedCourses().map((course) => (
                <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />

                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      ₦{course.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.enrolled_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(course.rating || 0, 'sm')}
                        <span className="text-sm font-semibold text-gray-900">{course.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/course/${course.id}`}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        View Course
                      </Link>
                      <button
                        onClick={() => openRatingModal(course)}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Rate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {getSortedCourses().length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No published courses found</h3>
                <p className="text-gray-600">This instructor hasn't published any courses yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{instructorStats?.average_rating?.toFixed(1) || 'N/A'}</div>
                  <div className="flex justify-center mb-2">
                    {renderStars(instructorStats?.average_rating || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{instructorStats?.total_ratings || 0}</div>
                  <div className="text-sm text-gray-600">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{instructorStats?.teaching_quality?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Teaching Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{instructorStats?.communication?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-gray-600">Communication</div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">All Reviews</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {instructorRatings.length > 0 ? (
                  instructorRatings.map((rating) => (
                    <div key={rating.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {rating.learner?.avatar_url ? (
                            <img
                              src={rating.learner.avatar_url}
                              alt="Learner"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {rating.learner ? `${rating.learner.first_name || rating.learner.firstName || ''} ${rating.learner.last_name || rating.learner.lastName || ''}`.trim() : 'Anonymous'}
                            </span>
                            {rating.course && (
                              <span className="text-sm text-gray-600">
                                for {rating.course.title}
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            {renderStars(rating.rating, 'sm')}
                            <span className="text-sm text-gray-600">
                              {rating.rating} out of 5
                            </span>
                          </div>

                          {(rating.teaching_quality || rating.communication || rating.responsiveness) && (
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
                          )}

                          {rating.review_content && (
                            <p className="text-gray-700 leading-relaxed">
                              {rating.review_content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600 mb-4">Be the first to review this instructor!</p>
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Rate Instructor</h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedCourse ? (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Course: {selectedCourse.title}</h3>
                  <p className="text-sm text-gray-600">{selectedCourse.description}</p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Select Course</h3>
                  <p className="text-sm text-blue-700 mb-3">Choose a course to rate the instructor for:</p>
                  <select
                    value={ratingForm.course_id}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, course_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-6">
                {/* Overall Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingForm(prev => ({ ...prev, rating: star }))}
                        className="text-3xl"
                      >
                        <Star
                          className={`w-8 h-8 ${star <= ratingForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teaching Quality
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingForm(prev => ({ ...prev, teaching_quality: star }))}
                        >
                          <Star
                            className={`w-6 h-6 ${star <= ratingForm.teaching_quality ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingForm(prev => ({ ...prev, communication: star }))}
                        >
                          <Star
                            className={`w-6 h-6 ${star <= ratingForm.communication ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsiveness
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingForm(prev => ({ ...prev, responsiveness: star }))}
                        >
                          <Star
                            className={`w-6 h-6 ${star <= ratingForm.responsiveness ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review (Optional)
                  </label>
                  <textarea
                    value={ratingForm.review_content}
                    onChange={(e) => setRatingForm(prev => ({ ...prev, review_content: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your experience with this instructor..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRatingSubmit}
                    disabled={!ratingForm.course_id}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      ratingForm.course_id 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 