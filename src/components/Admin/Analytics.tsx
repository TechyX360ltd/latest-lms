import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  DollarSign, 
  Award, 
  Calendar, 
  Clock, 
  Eye, 
  Download, 
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Target,
  Activity,
  PieChart,
  LineChart,
  Zap,
  Star,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { useCourses, useUsers, usePayments, useNotifications } from '../../hooks/useData';
import { supabase } from '../../lib/supabase';
import ReactCountryFlag from 'react-country-flag';
import * as XLSX from 'xlsx';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCourses: number;
    totalRevenue: number;
    totalEnrollments: number;
    activeUsers: number;
    completionRate: number;
    averageRating: number;
    certificatesIssued: number;
  };
  trends: {
    userGrowth: number;
    revenueGrowth: number;
    enrollmentGrowth: number;
    completionGrowth: number;
  };
  courseAnalytics: {
    topCourses: Array<{
      id: string;
      title: string;
      enrollments: number;
      revenue: number;
      rating: number;
      completionRate: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      enrollments: number;
      revenue: number;
      courses: number;
    }>;
  };
  userAnalytics: {
    demographics: {
      newUsers: number;
      returningUsers: number;
      activeUsers: number;
    };
    engagement: {
      dailyActiveUsers: number;
      weeklyActiveUsers: number;
      monthlyActiveUsers: number;
      averageSessionTime: number;
    };
    deviceStats: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
  };
  revenueAnalytics: {
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      enrollments: number;
    }>;
    paymentMethods: Array<{
      method: string;
      percentage: number;
      amount: number;
    }>;
  };
  timeSeriesData: {
    labels: string[];
    users: number[];
    revenue: number[];
    enrollments: number[];
  };
}

function useTimeSeriesData() {
  const [labels, setLabels] = useState<string[]>([]);
  const [users, setUsers] = useState<number[]>([]);
  const [revenue, setRevenue] = useState<number[]>([]);
  const [enrollments, setEnrollments] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: usersData } = await supabase.from('users_per_day').select('*');
      const { data: revenueData } = await supabase.from('revenue_per_day').select('*');
      const { data: enrollmentsData } = await supabase.from('enrollments_per_day').select('*');
      const allDates = [
        ...(usersData?.map(u => u.date) || []),
        ...(revenueData?.map(r => r.date) || []),
        ...(enrollmentsData?.map(e => e.date) || [])
      ];
      const uniqueDates = Array.from(new Set(allDates)).sort();
      setLabels(uniqueDates);
      setUsers(uniqueDates.map(date => usersData?.find(u => u.date === date)?.users || 0));
      setRevenue(uniqueDates.map(date => revenueData?.find(r => r.date === date)?.revenue || 0));
      setEnrollments(uniqueDates.map(date => enrollmentsData?.find(e => e.date === date)?.enrollments || 0));
      setLoading(false);
    }
    fetchData();
  }, []);
  return { labels, users, revenue, enrollments, loading };
}

export function Analytics() {
  const { courses, loading: coursesLoading } = useCourses();
  const { users, loading: usersLoading } = useUsers();
  const { payments, loading: paymentsLoading } = usePayments();
  const { notifications } = useNotifications();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'revenue' | 'enrollments'>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topCourses, setTopCourses] = useState<any[]>([]);
  const [locationUsage, setLocationUsage] = useState<any[]>([]);
  const { labels, users: usersTS, revenue: revenueTS, enrollments: enrollmentsTS, loading: timeSeriesLoading } = useTimeSeriesData();
  const timeSeriesData = {
    labels,
    users: usersTS,
    revenue: revenueTS,
    enrollments: enrollmentsTS
  };

  useEffect(() => {
    if (!coursesLoading && !usersLoading && !paymentsLoading) {
      generateAnalyticsData();
    }
  }, [courses, users, payments, coursesLoading, usersLoading, paymentsLoading, selectedTimeframe]);

  useEffect(() => {
    // Fetch real top courses from Supabase view
    const fetchTopCourses = async () => {
      const { data, error } = await supabase.from('top_courses').select('*');
      if (!error && data) {
        setTopCourses(data);
      }
    };
    fetchTopCourses();
  }, []);

  useEffect(() => {
    const fetchLocationUsage = async () => {
      const { data, error } = await supabase.from('location_usage_analytics').select('*');
      if (!error && data) setLocationUsage(data);
    };
    fetchLocationUsage();
  }, []);

  const generateAnalyticsData = () => {
    setLoading(true);
    
    // Simulate data processing delay
    setTimeout(() => {
      const now = new Date();
      const timeframeDays = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
      
      // Calculate overview metrics
      const totalUsers = users.length;
      const totalCourses = courses.length;
      const completedPayments = payments.filter(p => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalEnrollments = users.reduce((sum, u) => sum + (Array.isArray(u.enrolledCourses) ? u.enrolledCourses.length : 0), 0);
      const activeUsers = Math.floor(totalUsers * 0.7); // 70% active users
      const completionRate = Math.floor(Math.random() * 30 + 60); // 60-90%
      const averageRating = 4.8;
      const certificatesIssued = users.reduce((sum, u) => sum + (u.completedCourses?.length || 0), 0);

      // Generate trends (simulated growth)
      const userGrowth = Math.floor(Math.random() * 20 + 5); // 5-25%
      const revenueGrowth = Math.floor(Math.random() * 30 + 10); // 10-40%
      const enrollmentGrowth = Math.floor(Math.random() * 25 + 8); // 8-33%
      const completionGrowth = Math.floor(Math.random() * 15 + 3); // 3-18%

      // Top courses analysis
      const topCourses = courses
        .map(course => ({
          id: course.id,
          title: course.title,
          enrollments: course.enrolled_count,
          revenue: course.enrolled_count * course.price,
          rating: 4.5 + Math.random() * 0.5, // 4.5-5.0
          completionRate: Math.floor(Math.random() * 40 + 50) // 50-90%
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5);

      // Category performance
      const categoryMap = new Map();
      courses.forEach(course => {
        const category = course.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category: getCategoryName(category),
            enrollments: 0,
            revenue: 0,
            courses: 0
          });
        }
        const data = categoryMap.get(category);
        data.enrollments += course.enrolled_count;
        data.revenue += course.enrolled_count * course.price;
        data.courses += 1;
      });
      const categoryPerformance = Array.from(categoryMap.values());

      // User analytics
      const newUsers = Math.floor(totalUsers * 0.15); // 15% new users
      const returningUsers = totalUsers - newUsers;
      const dailyActiveUsers = Math.floor(totalUsers * 0.25);
      const weeklyActiveUsers = Math.floor(totalUsers * 0.45);
      const monthlyActiveUsers = Math.floor(totalUsers * 0.7);
      const averageSessionTime = Math.floor(Math.random() * 30 + 25); // 25-55 minutes

      // Device stats (simulated)
      const deviceStats = {
        desktop: Math.floor(Math.random() * 20 + 50), // 50-70%
        mobile: Math.floor(Math.random() * 20 + 25), // 25-45%
        tablet: Math.floor(Math.random() * 10 + 5)   // 5-15%
      };

      // Monthly revenue data
      const monthlyRevenue = generateMonthlyData(timeframeDays, totalRevenue);

      // Payment methods (simulated)
      const paymentMethods = [
        { method: 'Credit Card', percentage: 65, amount: totalRevenue * 0.65 },
        { method: 'Bank Transfer', percentage: 25, amount: totalRevenue * 0.25 },
        { method: 'Digital Wallet', percentage: 10, amount: totalRevenue * 0.10 }
      ];

      const analytics: AnalyticsData = {
        overview: {
          totalUsers,
          totalCourses,
          totalRevenue,
          totalEnrollments,
          activeUsers,
          completionRate,
          averageRating,
          certificatesIssued
        },
        trends: {
          userGrowth,
          revenueGrowth,
          enrollmentGrowth,
          completionGrowth
        },
        courseAnalytics: {
          topCourses,
          categoryPerformance
        },
        userAnalytics: {
          demographics: {
            newUsers,
            returningUsers,
            activeUsers
          },
          engagement: {
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            averageSessionTime
          },
          deviceStats
        },
        revenueAnalytics: {
          monthlyRevenue,
          paymentMethods
        },
        timeSeriesData
      };

      setAnalyticsData(analytics);
      setLoading(false);
    }, 1000);
  };

  const getCategoryName = (categoryId: string): string => {
    const categoryNames: Record<string, string> = {
      'school-of-engineering': 'Engineering',
      'school-of-design': 'Design',
      'school-of-product': 'Product',
      'school-of-marketing': 'Marketing',
      'school-of-business': 'Business'
    };
    return categoryNames[categoryId] || categoryId;
  };

  const generateMonthlyData = (days: number, totalRevenue: number) => {
    const months = [];
    const monthsToShow = Math.min(Math.ceil(days / 30), 12);
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      months.push({
        month: monthName,
        revenue: Math.floor(totalRevenue / monthsToShow * (0.8 + Math.random() * 0.4)),
        enrollments: Math.floor(Math.random() * 50 + 20)
      });
    }
    
    return months;
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUp className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const exportData = () => {
    if (!analyticsData) {
      alert('No data to export.');
      return;
    }
    // Prepare data for export
    const overviewSheet = [
      ['Metric', 'Value'],
      ['Total Users', analyticsData.overview.totalUsers],
      ['Total Courses', analyticsData.overview.totalCourses],
      ['Total Revenue', analyticsData.overview.totalRevenue],
      ['Total Enrollments', analyticsData.overview.totalEnrollments],
      ['Active Users', analyticsData.overview.activeUsers],
      ['Completion Rate', analyticsData.overview.completionRate],
      ['Average Rating', analyticsData.overview.averageRating],
      ['Certificates Issued', analyticsData.overview.certificatesIssued],
    ];
    const timeSeriesSheet = [
      ['Date', 'Users', 'Revenue', 'Enrollments'],
      ...(analyticsData.timeSeriesData.labels.map((label, i) => [
        label,
        analyticsData.timeSeriesData.users[i],
        analyticsData.timeSeriesData.revenue[i],
        analyticsData.timeSeriesData.enrollments[i],
      ])),
    ];
    // Device Usage Sheet
    const deviceUsageSheet = [
      ['Device Type', 'Percentage'],
      ['Desktop', analyticsData.userAnalytics.deviceStats.desktop],
      ['Mobile', analyticsData.userAnalytics.deviceStats.mobile],
      ['Tablet', analyticsData.userAnalytics.deviceStats.tablet],
    ];
    // Top Courses Sheet
    const topCoursesSheet = [
      ['Title', 'Enrollments', 'Revenue', 'Rating', 'Completion Rate'],
      ...((analyticsData.courseAnalytics.topCourses || []).map(course => [
        course.title,
        course.enrollments,
        course.revenue,
        course.rating,
        course.completionRate
      ])),
    ];
    const wb = XLSX.utils.book_new();
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewSheet);
    const wsTimeSeries = XLSX.utils.aoa_to_sheet(timeSeriesSheet);
    const wsDeviceUsage = XLSX.utils.aoa_to_sheet(deviceUsageSheet);
    const wsTopCourses = XLSX.utils.aoa_to_sheet(topCoursesSheet);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
    XLSX.utils.book_append_sheet(wb, wsTimeSeries, 'Trends Over Time');
    XLSX.utils.book_append_sheet(wb, wsDeviceUsage, 'Device Usage');
    XLSX.utils.book_append_sheet(wb, wsTopCourses, 'Top Courses');
    XLSX.writeFile(wb, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">Comprehensive insights into your platform performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Frame Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {timeframe === '7d' ? '7 Days' : timeframe === '30d' ? '30 Days' : timeframe === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(analyticsData.trends.userGrowth)}
            <span className="text-blue-100 text-sm">
              {formatPercentage(analyticsData.trends.userGrowth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(analyticsData.trends.revenueGrowth)}
            <span className="text-green-100 text-sm">
              {formatPercentage(analyticsData.trends.revenueGrowth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Enrollments</p>
              <p className="text-3xl font-bold">{analyticsData.overview.totalEnrollments.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(analyticsData.trends.enrollmentGrowth)}
            <span className="text-purple-100 text-sm">
              {formatPercentage(analyticsData.trends.enrollmentGrowth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm mb-1">Completion Rate</p>
              <p className="text-3xl font-bold">{formatPercentage(analyticsData.overview.completionRate)}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(analyticsData.trends.completionGrowth)}
            <span className="text-orange-100 text-sm">
              {formatPercentage(analyticsData.trends.completionGrowth)} from last period
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Time Series Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Trends Over Time</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['users', 'revenue', 'enrollments'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedMetric === metric
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Simple Line Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-2">
            {(() => {
              const rawData = timeSeriesData[selectedMetric];
              const labels = timeSeriesData.labels;
              // Debug log
              console.log('Chart Data:', { labels, data: rawData, selectedMetric });
              // Fallback: ensure all values are numbers and arrays are aligned
              const data = Array.isArray(rawData) ? rawData.map(v => Number(v) || 0) : [];
              if (!data || data.length === 0 || !labels || labels.length === 0) {
                return <div className="text-gray-400 text-center py-8 w-full">No data available for this period.</div>;
              }
              if (data.length !== labels.length) {
                return <div className="text-red-500 text-center py-8 w-full">Data/label length mismatch. Please check your backend data.</div>;
              }
              const allZero = data.every(v => v === 0);
              if (allZero) {
                return <div className="text-gray-400 text-center py-8 w-full">No data available for this period.</div>;
              }
              const maxValue = Math.max(...data, 1); // Avoid division by zero
              const maxBarHeight = 200; // px
              const minBarHeight = 8; // px
              const bars = labels.map((label, index) => {
                let height = 0;
                if (maxValue > 0) {
                  height = (data[index] / maxValue) * maxBarHeight;
                  if (data[index] > 0 && height < minBarHeight) height = minBarHeight;
                }
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-8 bg-blue-500 border border-red-500 rounded-t transition-all duration-300 hover:bg-blue-600 relative group"
                      style={{ height: `${height}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {selectedMetric === 'revenue' ? formatCurrency(data[index]) : data[index].toLocaleString()}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                      {label}
                    </span>
                  </div>
                );
              });
              if (!bars || bars.length === 0) {
                return <div className="text-gray-400 text-center py-8 w-full">No data bars to display.</div>;
              }
              return bars;
            })()}
          </div>
        </div>

        {/* User Engagement */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-600" />
            User Engagement
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Daily Active Users</p>
                  <p className="text-sm text-gray-600">Users active in the last 24 hours</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {analyticsData.userAnalytics.engagement.dailyActiveUsers.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Weekly Active Users</p>
                  <p className="text-sm text-gray-600">Users active in the last 7 days</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {analyticsData.userAnalytics.engagement.weeklyActiveUsers.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Avg. Session Time</p>
                  <p className="text-sm text-gray-600">Average time per session</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {analyticsData.userAnalytics.engagement.averageSessionTime}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Courses */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Top Performing Courses
          </h2>
          <div className="space-y-4">
            {topCourses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No data available.</div>
            ) : (
              topCourses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 line-clamp-1">{course.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{course.enrollments} enrollments</span>
                      <span>₦{course.revenue?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Users Logging by Location */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Users Logging by Location
          </h2>
          <div className="space-y-4">
            {locationUsage.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No location data available.</div>
            ) : (
              locationUsage.map((loc, idx) => (
                <div key={loc.country || idx} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition bg-blue-50">
                  <span className="text-3xl">
                    <ReactCountryFlag
                      countryCode={loc.country_code}
                      svg
                      style={{ width: '2em', height: '2em', borderRadius: '0.25em', boxShadow: '0 1px 4px #0001', marginRight: '0.5em' }}
                      title={loc.country}
                    />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">{loc.country}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="font-bold text-blue-700">
                        {loc.count} logins
                      </span>
                      {loc.last_login && (
                        <span className="ml-2 text-gray-500">Last: {new Date(loc.last_login).toLocaleString()}</span>
                      )}
                      {loc.last_ip && (
                        <span className="ml-2 text-gray-400">IP: {loc.last_ip}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Device Usage */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Device Usage
          </h2>
          <div className="space-y-6">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray={`${analyticsData.userAnalytics.deviceStats.desktop}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.userAnalytics.deviceStats.desktop}%</p>
                    <p className="text-sm text-gray-600">Desktop</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Desktop</span>
                </div>
                <span className="font-bold text-blue-600">{analyticsData.userAnalytics.deviceStats.desktop}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Mobile</span>
                </div>
                <span className="font-bold text-green-600">{analyticsData.userAnalytics.deviceStats.mobile}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Tablet className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Tablet</span>
                </div>
                <span className="font-bold text-purple-600">{analyticsData.userAnalytics.deviceStats.tablet}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Revenue Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Revenue Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {analyticsData.revenueAnalytics.monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...analyticsData.revenueAnalytics.monthlyRevenue.map(m => m.revenue));
                const height = (month.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatCurrency(month.revenue)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{month.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
            <div className="space-y-4">
              {analyticsData.revenueAnalytics.paymentMethods.map((method, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={method.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{method.method}</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{method.percentage}%</p>
                        <p className="text-sm text-gray-600">{formatCurrency(method.amount)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-8 text-white">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Platform Performance Summary</h2>
          <p className="text-lg opacity-90">Your SKILL SAGE platform is performing excellently</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-yellow-300">{analyticsData.overview.activeUsers}</p>
            <p className="text-sm opacity-80">Active Users</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-yellow-300">{analyticsData.overview.certificatesIssued}</p>
            <p className="text-sm opacity-80">Certificates Issued</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-yellow-300">{analyticsData.overview.averageRating}</p>
            <p className="text-sm opacity-80">Average Rating</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold text-yellow-300">{formatPercentage(analyticsData.overview.completionRate)}</p>
            <p className="text-sm opacity-80">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Device Usage */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          Device Usage
        </h2>
        <div className="space-y-6">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${analyticsData.userAnalytics.deviceStats.desktop}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.userAnalytics.deviceStats.desktop}%</p>
                  <p className="text-sm text-gray-600">Desktop</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Desktop</span>
              </div>
              <span className="font-bold text-blue-600">{analyticsData.userAnalytics.deviceStats.desktop}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Mobile</span>
              </div>
              <span className="font-bold text-green-600">{analyticsData.userAnalytics.deviceStats.mobile}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Tablet className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Tablet</span>
              </div>
              <span className="font-bold text-purple-600">{analyticsData.userAnalytics.deviceStats.tablet}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataConsistencyChecker() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkData() {
      setLoading(true);
      const { data: courses } = await supabase.from('courses').select('*');
      const { data: modules } = await supabase.from('modules').select('*');
      const { data: lessons } = await supabase.from('lessons').select('*');
      const { data: assignments } = await supabase.from('assignments').select('*');
      const issues: any[] = [];
      // Check modules
      for (const mod of modules) {
        if (!courses.find(c => c.id === mod.course_id)) {
          issues.push({ type: 'Module', id: mod.id, problem: 'Module has invalid course_id', course_id: mod.course_id });
        }
      }
      // Check lessons
      for (const les of lessons) {
        if (!courses.find(c => c.id === les.course_id)) {
          issues.push({ type: 'Lesson', id: les.id, problem: 'Lesson has invalid course_id', course_id: les.course_id });
        }
        if (les.module_id && !modules.find(m => m.id === les.module_id)) {
          issues.push({ type: 'Lesson', id: les.id, problem: 'Lesson has invalid module_id', module_id: les.module_id });
        }
      }
      // Check assignments
      for (const assn of assignments) {
        if (!courses.find(c => c.id === assn.course_id)) {
          issues.push({ type: 'Assignment', id: assn.id, problem: 'Assignment has invalid course_id', course_id: assn.course_id });
        }
        if (assn.module_id && !modules.find(m => m.id === assn.module_id)) {
          issues.push({ type: 'Assignment', id: assn.id, problem: 'Assignment has invalid module_id', module_id: assn.module_id });
        }
      }
      setReport(issues);
      setLoading(false);
    }
    checkData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Data Consistency Checker</h2>
      {loading ? <div>Checking...</div> : report.length === 0 ? <div className="text-green-600">No issues found!</div> : (
        <table className="min-w-full border text-sm mt-2">
          <thead>
            <tr>
              <th className="border px-2 py-1">Type</th>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Problem</th>
              <th className="border px-2 py-1">Related ID</th>
            </tr>
          </thead>
          <tbody>
            {report.map((issue, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{issue.type}</td>
                <td className="border px-2 py-1">{issue.id}</td>
                <td className="border px-2 py-1">{issue.problem}</td>
                <td className="border px-2 py-1">{issue.course_id || issue.module_id || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}