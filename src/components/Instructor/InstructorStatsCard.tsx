import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Star, Users, BookOpen, DollarSign, Calendar } from 'lucide-react';

export default function InstructorStatsCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    coursesCreated: 0,
    totalEnrollments: 0,
    totalEarnings: 0,
    averageRating: 0,
    eventsHosted: 0,
    ratingsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch courses created by instructor
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, enrolled_count')
          .eq('instructor_id', user.id);
        if (coursesError) throw coursesError;
        const courseIds = (courses || []).map((c: any) => c.id);
        const coursesCreated = courses?.length || 0;
        const totalEnrollments = (courses || []).reduce((sum: number, c: any) => sum + (c.enrolled_count || 0), 0);

        // Fetch total earnings
        let totalEarnings = 0;
        if (courseIds.length > 0) {
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, course_id, status')
            .in('course_id', courseIds)
            .eq('status', 'completed');
          if (paymentsError) throw paymentsError;
          totalEarnings = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        }

        // Fetch average course rating
        let averageRating = 0;
        let ratingsCount = 0;
        if (courseIds.length > 0) {
          const { data: ratings, error: ratingsError } = await supabase
            .from('course_ratings')
            .select('rating')
            .in('course_id', courseIds);
          if (ratingsError) throw ratingsError;
          ratingsCount = ratings?.length || 0;
          averageRating = ratingsCount > 0 ? (ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / ratingsCount) : 0;
        }

        // Fetch events hosted
        const { data: events, error: eventsError } = await supabase
          .from('live_sessions')
          .select('id')
          .eq('instructor_id', user.id);
        if (eventsError) throw eventsError;
        const eventsHosted = events?.length || 0;

        setStats({
          coursesCreated,
          totalEnrollments,
          totalEarnings,
          averageRating,
          eventsHosted,
          ratingsCount,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load instructor stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user?.id]);

  return (
    <div className="mb-8">
      {loading ? (
        <div className="text-gray-500">Loading stats...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.coursesCreated}</p>
            <p className="text-sm text-blue-700">Courses Created</p>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-lg border border-green-100">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.totalEnrollments}</p>
            <p className="text-sm text-green-700">Total Enrollments</p>
          </div>
          <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-100">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-purple-600">₦{stats.totalEarnings.toLocaleString()}</p>
            <p className="text-sm text-purple-700">Total Earnings</p>
          </div>
          <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.averageRating.toFixed(1)}</p>
            <p className="text-sm text-yellow-700">Avg. Course Rating</p>
            <p className="text-xs text-gray-400">({stats.ratingsCount} ratings)</p>
          </div>
          <div className="text-center p-6 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-indigo-600">{stats.eventsHosted}</p>
            <p className="text-sm text-indigo-700">Events Hosted</p>
          </div>
        </div>
      )}
    </div>
  );
} 