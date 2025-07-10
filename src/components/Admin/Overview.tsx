import React, { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, Clock, Award } from 'lucide-react';
import { useCourses, useUsers, usePayments } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';

export function AdminOverview() {
  const { courses, loading: coursesLoading } = useCourses();
  const { users, loading: usersLoading } = useUsers();
  const { payments, loading: paymentsLoading } = usePayments();

  const [overview, setOverview] = useState({
    totalUsers: null,
    totalCourses: null,
    totalRevenue: null,
    totalEnrollments: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log('fetchOverview useEffect running');
    async function fetchOverview() {
      console.log('fetchOverview function running');
      setOverview(prev => ({ ...prev, loading: true }));
      console.log('Calling get_total_users');
      const usersRes = await supabase.rpc('get_total_users');
      console.log('get_total_users result:', usersRes);
      console.log('Calling get_total_courses');
      const coursesRes = await supabase.rpc('get_total_courses');
      console.log('get_total_courses result:', coursesRes);
      console.log('Calling get_total_revenue');
      const revenueRes = await supabase.rpc('get_total_revenue');
      console.log('get_total_revenue result:', revenueRes);
      console.log('Calling get_total_enrollments');
      const enrollmentsRes = await supabase.rpc('get_total_enrollments');
      console.log('get_total_enrollments result:', enrollmentsRes);
      setOverview({
        totalUsers: usersRes.data,
        totalCourses: coursesRes.data,
        totalRevenue: revenueRes.data,
        totalEnrollments: enrollmentsRes.data,
        loading: false,
        error: usersRes.error || coursesRes.error || revenueRes.error || enrollmentsRes.error,
      });
      console.log('Overview state set:', {
        totalUsers: usersRes.data,
        totalCourses: coursesRes.data,
        totalRevenue: revenueRes.data,
        totalEnrollments: enrollmentsRes.data,
        error: usersRes.error || coursesRes.error || revenueRes.error || enrollmentsRes.error,
      });
    }
    fetchOverview();
  }, []);

  if (overview.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (overview.error) {
    return (
      <div className="text-red-600 p-8">Error loading overview data. Please check your Supabase functions and try again.<br/>{overview.error.message || String(overview.error)}</div>
    );
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const stats = [
    {
      title: 'Total Users',
      value: overview.totalUsers ?? '—',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Courses',
      value: overview.totalCourses ?? '—',
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: overview.totalRevenue !== null && overview.totalRevenue !== undefined
        ? `₦${Number(overview.totalRevenue).toLocaleString()}`
        : '—',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Enrollments',
      value: overview.totalEnrollments ?? '—',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Overview</h1>
          <p className="text-gray-600">Monitor your TECHYX 360 platform performance</p>
        </div>
        <div className="hidden md:block">
          <img 
            src="/BLACK-1-removebg-preview.png" 
            alt="TECHYX 360" 
            className="h-10 w-auto opacity-60"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Courses</h2>
          <div className="space-y-4">
            {courses
              .sort((a, b) => b.enrolledCount - a.enrolledCount)
              .slice(0, 5)
              .map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.enrolledCount} enrollments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₦{course.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Payments</h2>
          <div className="space-y-4">
            {payments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((payment) => {
                const user = users.find(u => u.id === payment.userId);
                const course = courses.find(c => c.id === payment.courseId);
                
                return (
                  <div key={payment.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-500">{course?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₦{payment.amount.toLocaleString()}</p>
                      <p className={`text-xs ${
                        payment.status === 'completed' ? 'text-green-600' : 
                        payment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}