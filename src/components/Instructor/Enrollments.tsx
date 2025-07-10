import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Layout/Sidebar';
import { Header } from '../Layout/Header';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserMinus, 
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
import html2canvas from 'html2canvas';

// Demo data for development
const demoStats = {
  total: 156,
  active: 89,
  inactive: 34,
  cancelled: 12,
  completed: 21,
  recent: 8,
  revenue: 1250000
};

const demoStudents = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    course: 'React for Beginners',
    enrollmentDate: '2024-01-15',
    status: 'active' as const,
    progress: 75,
    lastAccessed: '2024-01-20',
    amountPaid: 25000,
    avatar: null
  },
  {
    id: 2,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    course: 'Advanced TypeScript',
    enrollmentDate: '2024-01-10',
    status: 'completed' as const,
    progress: 100,
    lastAccessed: '2024-01-18',
    amountPaid: 35000,
    avatar: null
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    course: 'UI/UX Design',
    enrollmentDate: '2024-01-05',
    status: 'inactive' as const,
    progress: 25,
    lastAccessed: '2024-01-12',
    amountPaid: 20000,
    avatar: null
  },
  {
    id: 4,
    name: 'Emily Brown',
    email: 'emily.brown@example.com',
    course: 'React for Beginners',
    enrollmentDate: '2024-01-08',
    status: 'active' as const,
    progress: 90,
    lastAccessed: '2024-01-20',
    amountPaid: 25000,
    avatar: null
  },
  {
    id: 5,
    name: 'David Lee',
    email: 'david.lee@example.com',
    course: 'Advanced TypeScript',
    enrollmentDate: '2024-01-03',
    status: 'cancelled' as const,
    progress: 10,
    lastAccessed: '2024-01-07',
    amountPaid: 0,
    avatar: null
  }
];

const demoCourses = [
  'React for Beginners',
  'Advanced TypeScript', 
  'UI/UX Design',
  'Node.js Backend',
  'Python for Data Science'
];

const demoEnrollmentTrends = [
  { month: 'Jan', enrollments: 45, revenue: 450000 },
  { month: 'Feb', enrollments: 52, revenue: 520000 },
  { month: 'Mar', enrollments: 38, revenue: 380000 },
  { month: 'Apr', enrollments: 61, revenue: 610000 },
  { month: 'May', enrollments: 48, revenue: 480000 },
  { month: 'Jun', enrollments: 55, revenue: 550000 }
];

export default function Enrollments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [stats, setStats] = useState(demoStats);
  const [students, setStudents] = useState(demoStudents);
  const [filteredStudents, setFilteredStudents] = useState(demoStudents);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Chart states
  const [selectedChart, setSelectedChart] = useState<'trends' | 'distribution' | 'progress'>('trends');

  // Filter students based on current filters
  useEffect(() => {
    let filtered = students;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }
    
    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(student => student.course === courseFilter);
    }
    
    // Date filter (simplified for demo)
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
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

  // Export data as PDF
  const handleExportPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const tableStartY = 50;
    
    // Add brand logo and header
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Add logo placeholder (you can replace with actual logo)
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('TECHYX 360', margin, 22);
    
    // Add subtitle
    doc.setFontSize(12);
    doc.text('Learning Management System', margin, 30);
    
    // Add report title
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, 40, pageWidth - 2 * margin, 8, 'F');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Student Enrollments Report', pageWidth / 2, 46, { align: 'center' });
    
    // Add report metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 55);
    doc.text(`Total Students: ${filteredStudents.length}`, pageWidth - margin - 50, 55);
    
    // Create table data
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
      lastAccessed: new Date(student.lastAccessed).toLocaleDateString(),
      amountPaid: formatCurrency(student.amountPaid)
    }));
    
    // Add table with custom styling
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
          0: { cellWidth: 35 }, // Name
          1: { cellWidth: 50 }, // Email
          2: { cellWidth: 40 }, // Course
          3: { cellWidth: 20 }, // Status
          4: { cellWidth: 20 }, // Progress
          5: { cellWidth: 30 }, // Enrollment Date
          6: { cellWidth: 30 }, // Last Accessed
          7: { cellWidth: 25 }, // Amount Paid
        },
        didDrawPage: function(data) {
          // Add page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
          
          // Add footer
          doc.setFontSize(8);
          doc.text('© 2024 TECHYX 360 - Learning Management System', margin, pageHeight - 5);
          doc.text('Confidential - For internal use only', pageWidth - margin - 60, pageHeight - 5);
        },
        willDrawCell: function(data) {
          // Custom cell styling for status
          if (data.column.index === 3) { // Status column
            const status = data.cell.text.join('');
            if (status === 'Active') {
              data.cell.styles.fillColor = [34, 197, 94]; // Green
            } else if (status === 'Completed') {
              data.cell.styles.fillColor = [59, 130, 246]; // Blue
            } else if (status === 'Inactive') {
              data.cell.styles.fillColor = [245, 158, 11]; // Yellow
            } else if (status === 'Cancelled') {
              data.cell.styles.fillColor = [239, 68, 68]; // Red
            }
            data.cell.styles.textColor = [255, 255, 255];
          }
          
          // Custom cell styling for progress
          if (data.column.index === 4) { // Progress column
            const progress = parseInt(data.cell.text.join('').replace('%', ''));
            if (progress >= 80) {
              data.cell.styles.fillColor = [34, 197, 94]; // Green
            } else if (progress >= 60) {
              data.cell.styles.fillColor = [59, 130, 246]; // Blue
            } else if (progress >= 40) {
              data.cell.styles.fillColor = [245, 158, 11]; // Yellow
            } else {
              data.cell.styles.fillColor = [239, 68, 68]; // Red
            }
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      });
    } else {
      // Fallback for when autoTable is not available
      let y = tableStartY;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Draw header
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Name | Email | Course | Status | Progress | Enrollment Date | Last Accessed | Amount Paid', margin + 2, y + 6);
      y += 10;
      
      // Draw data rows
      doc.setTextColor(0, 0, 0);
      tableData.forEach((row, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 2, pageWidth - 2 * margin, 6, 'F');
        }
        doc.text(Object.values(row).join(' | '), margin + 2, y + 4);
        y += 8;
      });
      
      // Add page number
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Page 1 of 1', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Add footer
      doc.setFontSize(8);
      doc.text('© 2024 TECHYX 360 - Learning Management System', margin, pageHeight - 5);
      doc.text('Confidential - For internal use only', pageWidth - margin - 60, pageHeight - 5);
    }
    
    // Add summary section at the end
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : pageHeight - 30;
    
    if (finalY < pageHeight - 40) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, finalY, pageWidth - 2 * margin, 25, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', margin + 5, finalY + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`• Total Students: ${filteredStudents.length}`, margin + 5, finalY + 15);
      doc.text(`• Active Students: ${filteredStudents.filter(s => s.status === 'active').length}`, margin + 5, finalY + 22);
      doc.text(`• Completed Courses: ${filteredStudents.filter(s => s.status === 'completed').length}`, margin + 80, finalY + 15);
      doc.text(`• Total Revenue: ${formatCurrency(filteredStudents.reduce((sum, s) => sum + s.amountPaid, 0))}`, margin + 80, finalY + 22);
    }
    
    doc.save('enrollments-report.pdf');
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

            {/* Charts */}
            <div className="h-80">
              {selectedChart === 'trends' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={demoEnrollmentTrends}>
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
                    { range: '0-25%', students: students.filter(s => s.progress <= 25).length },
                    { range: '26-50%', students: students.filter(s => s.progress > 25 && s.progress <= 50).length },
                    { range: '51-75%', students: students.filter(s => s.progress > 50 && s.progress <= 75).length },
                    { range: '76-100%', students: students.filter(s => s.progress > 75).length }
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

            {/* Advanced Filters */}
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
                      {demoCourses.map(course => (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrollment Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Accessed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
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
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
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
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(student.lastAccessed).toLocaleDateString()}
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
            
            {/* Empty State */}
            {filteredStudents.length === 0 && (
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