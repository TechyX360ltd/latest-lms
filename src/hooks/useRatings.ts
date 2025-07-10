import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { keysToCamel } from '../lib/caseUtils';
import { 
  CourseRating, 
  InstructorRating, 
  CourseRatingStats, 
  InstructorRatingStats,
  ReviewHelpfulVote 
} from '../types';

export function useRatings() {
  const [courseRatings, setCourseRatings] = useState<CourseRating[]>([]);
  const [instructorRatings, setInstructorRatings] = useState<InstructorRating[]>([]);
  const [courseStats, setCourseStats] = useState<CourseRatingStats | null>(null);
  const [instructorStats, setInstructorStats] = useState<InstructorRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseRatings = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          *,
          user:users(firstName, lastName, avatar)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourseRatings(keysToCamel<CourseRating[]>(data || []));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch course ratings');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorRatings = async (instructorId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('instructor_ratings')
        .select(`
          *,
          learner:users!instructor_ratings_learner_id_fkey(firstName, lastName, avatar),
          course:courses(title)
        `)
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInstructorRatings(keysToCamel<InstructorRating[]>(data || []));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch instructor ratings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseRatingStats = async (courseId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_course_rating_stats', {
        p_course_id: courseId
      });
      
      if (error) throw error;
      setCourseStats(keysToCamel<CourseRatingStats>(data[0] || null));
    } catch (err: any) {
      console.error('Error fetching course rating stats:', err);
    }
  };

  const fetchInstructorRatingStats = async (instructorId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_instructor_rating_stats', {
        p_instructor_id: instructorId
      });
      
      if (error) throw error;
      setInstructorStats(keysToCamel<InstructorRatingStats>(data[0] || null));
    } catch (err: any) {
      console.error('Error fetching instructor rating stats:', err);
    }
  };

  const createCourseRating = async (ratingData: {
    courseId: string;
    rating: number;
    reviewTitle?: string;
    reviewContent?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('course_ratings')
        .insert([{
          course_id: ratingData.courseId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          rating: ratingData.rating,
          review_title: ratingData.reviewTitle,
          review_content: ratingData.reviewContent,
          is_verified_purchase: true // Assuming they can only rate if enrolled
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const mappedData = keysToCamel<CourseRating>(data);
      setCourseRatings([mappedData, ...courseRatings]);
      await fetchCourseRatingStats(ratingData.courseId);
      return mappedData;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create course rating');
    }
  };

  const createInstructorRating = async (ratingData: {
    instructorId: string;
    courseId: string;
    rating: number;
    reviewContent?: string;
    teachingQuality?: number;
    communication?: number;
    responsiveness?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('instructor_ratings')
        .insert([{
          instructor_id: ratingData.instructorId,
          learner_id: (await supabase.auth.getUser()).data.user?.id,
          course_id: ratingData.courseId,
          rating: ratingData.rating,
          review_content: ratingData.reviewContent,
          teaching_quality: ratingData.teachingQuality,
          communication: ratingData.communication,
          responsiveness: ratingData.responsiveness
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const mappedData = keysToCamel<InstructorRating>(data);
      setInstructorRatings([mappedData, ...instructorRatings]);
      await fetchInstructorRatingStats(ratingData.instructorId);
      return mappedData;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create instructor rating');
    }
  };

  const updateCourseRating = async (ratingId: string, updates: {
    rating?: number;
    reviewTitle?: string;
    reviewContent?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('course_ratings')
        .update({
          rating: updates.rating,
          review_title: updates.reviewTitle,
          review_content: updates.reviewContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)
        .select()
        .single();
      
      if (error) throw error;
      
      const mappedData = keysToCamel<CourseRating>(data);
      setCourseRatings(courseRatings.map(r => r.id === ratingId ? mappedData : r));
      return mappedData;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update course rating');
    }
  };

  const deleteCourseRating = async (ratingId: string) => {
    try {
      const { error } = await supabase
        .from('course_ratings')
        .delete()
        .eq('id', ratingId);
      
      if (error) throw error;
      
      setCourseRatings(courseRatings.filter(r => r.id !== ratingId));
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete course rating');
    }
  };

  const voteReviewHelpful = async (reviewId: string, isHelpful: boolean) => {
    try {
      const { data, error } = await supabase.rpc('vote_review_helpful', {
        p_review_id: reviewId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_is_helpful: isHelpful
      });
      
      if (error) throw error;
      
      // Refresh the course ratings to get updated helpful votes
      if (courseRatings.length > 0) {
        await fetchCourseRatings(courseRatings[0].course_id);
      }
      
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to vote on review');
    }
  };

  const canRateCourse = async (courseId: string) => {
    try {
      const { data, error } = await supabase.rpc('can_rate_course', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_course_id: courseId
      });
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error checking if can rate course:', err);
      return false;
    }
  };

  const canRateInstructor = async (instructorId: string, courseId: string) => {
    try {
      const { data, error } = await supabase.rpc('can_rate_instructor', {
        p_learner_id: (await supabase.auth.getUser()).data.user?.id,
        p_instructor_id: instructorId,
        p_course_id: courseId
      });
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error checking if can rate instructor:', err);
      return false;
    }
  };

  const markCourseCompleted = async (courseId: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_course_completed', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_course_id: courseId
      });
      
      if (error) throw error;
      return data;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to mark course as completed');
    }
  };

  return {
    courseRatings,
    instructorRatings,
    courseStats,
    instructorStats,
    loading,
    error,
    fetchCourseRatings,
    fetchInstructorRatings,
    fetchCourseRatingStats,
    fetchInstructorRatingStats,
    createCourseRating,
    createInstructorRating,
    updateCourseRating,
    deleteCourseRating,
    voteReviewHelpful,
    canRateCourse,
    canRateInstructor,
    markCourseCompleted
  };
} 