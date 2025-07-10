export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'learner' | 'admin' | 'instructor';
  avatar?: string | null;
  bio?: string;
  location?: string;
  occupation?: string;
  education?: string;
  enrolledCourses: string[];
  completedCourses: string[]; // Add completed courses tracking
  created_at: string;
  // Instructor-specific fields
  payoutEmail?: string;
  expertise?: string;
  isApproved?: boolean;
  // Gamification fields
  points?: number;
  coins?: number;
  currentStreak?: number;
  longestStreak?: number;
  lastActiveDate?: string;
  // Referral fields
  referral_code?: string;
  referred_by?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string; // URL-friendly slug for course
  description: string;
  instructor: string;
  category: string;
  format: string;
  duration: number;
  thumbnail: string;
  price: number;
  is_published: boolean;
  enrolled_count: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  category_id: string;
  instructor_id: string;
  certificatetemplate?: string;
  certificate_template?: string;
  level?: string;
  lessons: Lesson[];
  assignments: Assignment[];
  modules?: Module[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  lessons: Lesson[];
  assignments?: Assignment[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration?: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  module_id?: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date?: string;
  max_points: number;
  allowed_file_types?: string[];
  max_file_size?: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  courseId: string;
  submittedAt: string;
  files: SubmissionFile[];
  textSubmission?: string;
  status: 'submitted' | 'graded' | 'late' | 'missing';
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  senderId: string;
  senderName: string;
  recipients: NotificationRecipient[];
  courseId?: string;
  created_at: string;
  scheduledFor?: string;
  isRead?: boolean;
  attachments?: NotificationAttachment[];
  replies?: NotificationReply[];
}

export interface NotificationRecipient {
  userId: string;
  userName: string;
  isRead: boolean;
  readAt?: string;
  isStarred?: boolean;
  starredAt?: string;
}

export interface NotificationReply {
  id: string;
  notificationId: string;
  userId: string;
  userName: string;
  message: string;
  attachments?: NotificationAttachment[];
  created_at: string;
}

export interface NotificationAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  courseCount: number;
}

export interface Payment {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_purchase: number;
  maximum_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  applicable_courses?: string[];
  applicable_categories?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  course_id: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  used_at: string;
  payment_reference?: string;
}

export interface CouponValidationResult {
  success: boolean;
  error?: string;
  coupon_id?: string;
  coupon_name?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  discount_amount?: number;
  original_amount?: number;
  final_amount?: number;
}

export interface CouponStatistics {
  total_coupons: number;
  active_coupons: number;
  expired_coupons: number;
  total_usage: number;
  total_discount_given: number;
}

export interface CourseRating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_title?: string;
  review_content?: string;
  is_verified_purchase: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  course?: {
    title: string;
  };
}

export interface InstructorRating {
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
  updated_at: string;
  learner?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  instructor?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  course?: {
    title: string;
  };
}

export interface ReviewHelpfulVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface CourseRatingStats {
  total_ratings: number;
  average_rating: number;
  rating_distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
  verified_purchases: number;
}

export interface InstructorRatingStats {
  total_ratings: number;
  average_rating: number;
  teaching_quality_avg: number;
  communication_avg: number;
  responsiveness_avg: number;
  rating_distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LiveSession {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  session_date: string;
  session_time: string;
  duration: number;
  platform: string;
  created_at: string;
  updated_at: string;
  course?: { id: string; title: string };
}