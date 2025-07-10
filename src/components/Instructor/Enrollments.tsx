import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserCheck, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { supabase } from '../../lib/supabase';

// Helper to load image as base64
const getBase64FromUrl = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function Enrollments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'trends' | 'distribution' | 'progress'>('trends');

  // Pagination and Sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('enrollmentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch enrollments from Supabase
  useEffect(() => {
    const fetchEnrollments = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select(`
            *,
            users:user_id (id, first_name, last_name, email, avatar),
            courses:course_id (id, title)
          `)
          .eq('instructor_id', user.id);
        if (error) throw error;
        const formatted = data.map((e: any) => ({
          id: e.id,
          name: e.users ? `${e.users.first_name || ''} ${e.users.last_name || ''}`.trim() : 'Unknown',
          email: e.users?.email || '',
          course: e.courses?.title || '',
          enrollmentDate: e.enrolled_at,
          status: e.status,
          progress: e.progress_percentage,
          lastAccessed: e.last_accessed,
          amountPaid: e.amount_paid,
          avatar: e.users?.avatar || null
        }));
        setStudents(formatted);
        setFilteredStudents(formatted);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch enrollments');
      }
      setLoading(false);
    };
    if (user?.id) fetchEnrollments();
  }, [user]);

  // Filter students based on current filters
  useEffect(() => {
    let filtered = students;
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.course === courseFilter);
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      const daysAgo = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(student => 
        new Date(student.enrollmentDate) >= cutoffDate
      );
    }
    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter, courseFilter, dateFilter]);

  // Sorting logic
  const sortedStudents = React.useMemo(() => {
    const sorted = [...filteredStudents];
    sorted.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      // For string columns, compare lowercase
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredStudents, sortBy, sortOrder]);

  // Pagination logic
  const totalPages = Math.ceil(sortedStudents.length / rowsPerPage);
  const paginatedStudents = sortedStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Get unique courses for filter dropdown
  const uniqueCourses = Array.from(new Set(students.map(s => s.course))).filter(Boolean);

  // Stats calculation
  const stats = {
    total: filteredStudents.length,
    active: filteredStudents.filter(s => s.status === 'active').length,
    inactive: filteredStudents.filter(s => s.status === 'inactive').length,
    cancelled: filteredStudents.filter(s => s.status === 'cancelled').length,
    completed: filteredStudents.filter(s => s.status === 'completed').length,
    revenue: filteredStudents.reduce((sum, s) => sum + (s.amountPaid || 0), 0)
  };

  // Enrollment trends for chart (by month)
  const enrollmentTrends = (() => {
    const months: { [key: string]: { enrollments: number; revenue: number } } = {};
    filteredStudents.forEach(s => {
      const d = new Date(s.enrollmentDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!months[key]) months[key] = { enrollments: 0, revenue: 0 };
      months[key].enrollments++;
      months[key].revenue += s.amountPaid || 0;
    });
    return Object.entries(months).map(([k, v]) => ({ month: k, ...v }));
  })();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  // Export data as CSV
  const handleExportCSV = () => {
    const data = filteredStudents.map(student => ({
      Name: student.name,
      Email: student.email,
      Course: student.course,
      Status: student.status,
      Progress: student.progress + '%',
      'Enrollment Date': student.enrollmentDate,
      'Last Accessed': student.lastAccessed,
      'Amount Paid': formatCurrency(student.amountPaid)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'enrollments.csv');
  };

  // Export data as Excel
  const handleExportExcel = () => {
    const data = filteredStudents.map(student => ({
      Name: student.name,
      Email: student.email,
      Course: student.course,
      Status: student.status,
      Progress: student.progress + '%',
      'Enrollment Date': student.enrollmentDate,
      'Last Accessed': student.lastAccessed,
      'Amount Paid': formatCurrency(student.amountPaid)
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Enrollments');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'enrollments.xlsx');
  };

  // Export data as PDF (same as before, using getBase64FromUrl for logo)
  const handleExportPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const tableStartY = 60;
    const logoUrl = '/BLACK-1-removebg-preview.png';
    let logoBase64 = '';
    try {
      logoBase64 = await getBase64FromUrl(logoUrl);
    } catch (e) { logoBase64 = ''; }
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, 10, 30, 30);
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('TECHYX 360', pageWidth / 2, 44, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Learning Management System', pageWidth / 2, 50, { align: 'center' });
    doc.setFontSize(16);
    doc.text('ENROLLMENT REPORT', pageWidth / 2, 58, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 58);
    doc.text(`Total Students: ${filteredStudents.length}`, pageWidth - margin, 58, { align: 'right' });
    const columns = [
      { header: 'Name', dataKey: 'name', width: 35 },
      { header: 'Email', dataKey: 'email', width: 50 },
      { header: 'Course', dataKey: 'course', width: 40 },
      { header: 'Status', dataKey: 'status', width: 20 },
      { header: 'Progress', dataKey: 'progress', width: 20 },
      { header: 'Enrollment Date', dataKey: 'enrollmentDate', width: 30 },
      { header: 'Last Accessed', dataKey: 'lastAccessed', width: 30 },
      { header: 'Amount Paid', dataKey: 'amountPaid', width: 25 }
    ];
    const tableData = filteredStudents.map(student => ({
      name: student.name,
      email: student.email,
      course: student.course,
      status: student.status.charAt(0).toUpperCase() + student.status.slice(1),
      progress: student.progress + '%',
      enrollmentDate: new Date(student.enrollmentDate).toLocaleDateString(),
      lastAccessed: student.lastAccessed ? new Date(student.lastAccessed).toLocaleDateString() : '',
      amountPaid: formatCurrency(student.amountPaid)
    }));
    // @ts-ignore
    if (doc.autoTable) {
      // @ts-ignore
      doc.autoTable({
        head: [columns.map(col => col.header)],
        body: tableData.map(row => columns.map(col => row[col.dataKey])),
        startY: tableStartY,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 25 },
        },
        didDrawPage: function(data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
          doc.setFontSize(8);
          doc.text('© 2024 TECHYX 360 - Learning Management System', margin, pageHeight - 5);
          doc.text('Confidential - For internal use only', pageWidth - margin - 60, pageHeight - 5);
        },
        willDrawCell: function(data) {
          if (data.column.index === 3) {
            const status = data.cell.text.join('');
            if (status === 'Active') {
              data.cell.styles.fillColor = [34, 197, 94];
            } else if (status === 'Completed') {
              data.cell.styles.fillColor = [59, 130, 246];
            } else if (status === 'Inactive') {
              data.cell.styles.fillColor = [245, 158, 11];
            } else if (status === 'Cancelled') {
              data.cell.styles.fillColor = [239, 68, 68];
            }
            data.cell.styles.textColor = [255, 255, 255];
          }
          if (data.column.index === 4) {
            const progress = parseInt(data.cell.text.join('').replace('%', ''));
            if (progress >= 80) {
              data.cell.styles.fillColor = [34, 197, 94];
            } else if (progress >= 60) {
              data.cell.styles.fillColor = [59, 130, 246];
            } else if (progress >= 40) {
              data.cell.styles.fillColor = [245, 158, 11];
            } else {
              data.cell.styles.fillColor = [239, 68, 68];
            }
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      });
    }
    doc.save('enrollments-report.pdf');
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'inactive': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Student Enrollments
              </h1>
              <p className="text-gray-600">Manage and track your course enrollments</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Enrollments</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Students</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedChart('trends')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedChart === 'trends' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Trends
                </button>
                <button
                  onClick={() => setSelectedChart('distribution')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedChart === 'distribution' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <PieChart className="w-4 h-4 inline mr-1" />
                  Distribution
                </button>
                <button
                  onClick={() => setSelectedChart('progress')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedChart === 'progress' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-1" />
                  Progress
                </button>
              </div>
            </div>
            <div className="h-80">
              {selectedChart === 'trends' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'enrollments' ? value : formatCurrency(Number(value)),
                        name === 'enrollments' ? 'Enrollments' : 'Revenue'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Enrollments"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {selectedChart === 'distribution' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: stats.active, color: '#10B981' },
                        { name: 'Completed', value: stats.completed, color: '#3B82F6' },
                        { name: 'Inactive', value: stats.inactive, color: '#F59E0B' },
                        { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {[
                        { name: 'Active', value: stats.active, color: '#10B981' },
                        { name: 'Completed', value: stats.completed, color: '#3B82F6' },
                        { name: 'Inactive', value: stats.inactive, color: '#F59E0B' },
                        { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Students']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
              {selectedChart === 'progress' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { range: '0-25%', students: filteredStudents.filter(s => s.progress <= 25).length },
                    { range: '26-50%', students: filteredStudents.filter(s => s.progress > 25 && s.progress <= 50).length },
                    { range: '51-75%', students: filteredStudents.filter(s => s.progress > 50 && s.progress <= 75).length },
                    { range: '76-100%', students: filteredStudents.filter(s => s.progress > 75).length }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Students']} />
                    <Bar dataKey="students" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students, courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <span className="text-sm text-gray-500">
                  {filteredStudents.length} of {students.length} students
                </span>
              </div>
            </div>
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Courses</option>
                      {uniqueCourses.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-blue-600 font-semibold">Loading enrollments...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-600 font-semibold">{error}</div>
            ) : (
              <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                        Student {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('course')}>
                        Course {sortBy === 'course' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                        Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('progress')}>
                        Progress {sortBy === 'progress' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('enrollmentDate')}>
                        Enrollment Date {sortBy === 'enrollmentDate' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('lastAccessed')}>
                        Last Accessed {sortBy === 'lastAccessed' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amountPaid')}>
                        Amount Paid {sortBy === 'amountPaid' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.course}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                            {student.status?.charAt(0).toUpperCase() + student.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(student.progress)}`}
                                style={{ width: `${student.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.lastAccessed ? new Date(student.lastAccessed).toLocaleDateString() : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(student.amountPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} ({sortedStudents.length} students)
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
                </div>
              </div>
              </>
            )}
            {filteredStudents.length === 0 && !loading && !error && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 