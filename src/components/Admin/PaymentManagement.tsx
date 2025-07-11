import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  BookOpen, 
  BarChart3, 
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Eye,
  FileText,
  Printer,
  Mail,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { usePayments, useUsers, useCourses } from '../../hooks/useData';
import { useAuth } from '../../context/AuthContext';

export function PaymentManagement() {
  const { payments, loading } = usePayments();
  const { users } = useUsers();
  const { courses } = useCourses();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPaymentDetails, setShowPaymentDetails] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Remove demo enhancement logic: use payments as-is
  const enhancedPayments = payments;

  // Helper functions to get user and course info
  const getUserById = (userId: string) => users?.find(u => u.id === userId);
  const getCourseById = (courseId: string) => courses?.find(c => c.id === courseId);

  useEffect(() => {
    if (!loading) {
      // generateEnhancedPayments(); // This line is no longer needed
    }
  }, [payments, loading]);

  // const generateEnhancedPayments = () => { // This function is no longer needed
  //   const enhanced = payments.map(payment => {
  //     // Generate random payment method
  //     const methodIndex = Math.floor(Math.random() * paymentMethods.length);
  //     const paymentMethod = paymentMethods[methodIndex];
      
  //     // Generate transaction ID
  //     const transactionId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
  //     // Generate payment details
  //     const cardDetails = paymentMethod.id === 'card' 
  //       ? { 
  //           cardNumber: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
  //           cardType: ['Visa', 'Mastercard', 'Verve'][Math.floor(Math.random() * 3)],
  //           expiryDate: `${Math.floor(1 + Math.random() * 12)}/${Math.floor(23 + Math.random() * 5)}`
  //         }
  //       : null;
      
  //     // Generate bank details
  //     const bankDetails = paymentMethod.id === 'bank'
  //       ? {
  //           bankName: ['First Bank', 'GTBank', 'Zenith Bank', 'UBA', 'Access Bank'][Math.floor(Math.random() * 5)],
  //           accountNumber: `*****${Math.floor(1000 + Math.random() * 9000)}`,
  //           referenceNumber: `REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  //         }
  //       : null;
      
  //     // Generate wallet details
  //     const walletDetails = paymentMethod.id === 'wallet'
  //       ? {
  //           provider: ['PayPal', 'Paystack', 'Flutterwave'][Math.floor(Math.random() * 3)],
  //           walletId: `WALLET-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  //           email: payment.userId.includes('@') ? payment.userId : `user${payment.userId}@example.com`
  //         }
  //       : null;
      
  //     // Generate receipt number
  //     const receiptNumber = `RCPT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
  //     // Generate invoice number
  //     const invoiceNumber = `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
  //     // Generate payment processor fee (0.5% to 3%)
  //     const processorFeePercentage = 0.5 + Math.random() * 2.5;
  //     const processorFee = Math.round(payment.amount * (processorFeePercentage / 100));
      
  //     // Generate net amount
  //     const netAmount = payment.amount - processorFee;
      
  //     // Generate payment processor
  //     const paymentProcessor = ['Paystack', 'Flutterwave', 'Stripe', 'Interswitch'][Math.floor(Math.random() * 4)];
      
  //     // Generate payment notes
  //     const paymentNotes = payment.status === 'completed' 
  //       ? 'Payment processed successfully' 
  //       : payment.status === 'pending' 
  //         ? 'Awaiting payment confirmation' 
  //         : 'Payment failed due to insufficient funds';
      
  //     return {
  //       ...payment,
  //       paymentMethod,
  //       transactionId,
  //       cardDetails,
  //       bankDetails,
  //       walletDetails,
  //       receiptNumber,
  //       invoiceNumber,
  //       processorFee,
  //       netAmount,
  //       paymentProcessor,
  //       paymentNotes,
  //       customerName: `Customer ${payment.userId}`,
  //       customerEmail: `customer${payment.userId}@example.com`,
  //       courseName: `Course ${payment.courseId}`
  //     };
  //   });
      
  //   setEnhancedPayments(enhanced);
  // };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // generateEnhancedPayments(); // This line is no longer needed
    setIsRefreshing(false);
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleRowExpansion = (paymentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeframeDate = (timeframe: string) => {
    const now = new Date();
    switch (timeframe) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(0); // Beginning of time
    }
  };

  // Filter and sort payments
  const filteredPayments = enhancedPayments.filter(payment => {
    const user = getUserById(payment.userId);
    const course = getCourseById(payment.courseId);
    const matchesSearch =
      (user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
      (course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    const matchesTimeframe = selectedTimeframe === 'all' ||
      new Date(payment.created_at) >= getTimeframeDate(selectedTimeframe);
    // No payment method filter, as we don't have real data for it
    return matchesSearch && matchesStatus && matchesTimeframe;
  }).sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc'
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      return sortDirection === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
  });

  // Calculate summary statistics
  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalTransactions = filteredPayments.length;
  
  const successfulTransactions = filteredPayments
    .filter(p => p.status === 'completed')
    .length;
  
  const pendingTransactions = filteredPayments
    .filter(p => p.status === 'pending')
    .length;
  
  const failedTransactions = filteredPayments
    .filter(p => p.status === 'failed')
    .length;
  
  const successRate = totalTransactions > 0
    ? Math.round((successfulTransactions / totalTransactions) * 100)
    : 0;

  // Export payment data to CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Customer Name',
      'Customer Email',
      'Course',
      'Amount',
      'Status'
    ];
    const csvData = [
      headers.join(','),
      ...filteredPayments.map(payment => {
        const user = getUserById(payment.userId);
        const course = getCourseById(payment.courseId);
        return [
          new Date(payment.created_at).toISOString(),
          `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
          user?.email || '',
          course?.title || '',
          payment.amount,
          payment.status
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Generate invoice PDF
  const generateInvoice = (payment: any) => {
    alert(`Invoice ${payment.invoiceNumber} for ${payment.customerName} is being generated and will be available for download shortly.`);
  };

  // Send receipt via email
  const sendReceipt = (payment: any) => {
    alert(`Receipt for transaction ${payment.transactionId} has been sent to ${payment.customerEmail}.`);
  };

  // Restrict unverified instructors
  if (user?.role === 'instructor' && user?.verification_status !== 'verified') {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-red-50 border border-red-200 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-red-700 mb-2">Account Not Verified</h2>
        <p className="text-red-700 mb-4">You must verify your instructor account before you can access earnings or request cashout.</p>
        <a href="/instructor/profile" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Verify Now</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show payment details modal
  if (showPaymentDetails) {
    const payment = enhancedPayments.find(p => p.id === showPaymentDetails);
    if (!payment) return null;
    const user = getUserById(payment.userId);
    const course = getCourseById(payment.courseId);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentDetails(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {user?.first_name} {user?.last_name}</p>
                  <p><span className="font-medium">Email:</span> {user?.email}</p>
                  <p><span className="font-medium">User ID:</span> {payment.userId}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  Course Information
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Title:</span> {course?.title}</p>
                  <p><span className="font-medium">Course ID:</span> {payment.courseId}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Amount</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}> 
                  {getStatusIcon(payment.status)}
                  <span className="capitalize">{payment.status}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {formatDate(payment.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Payment Management
          </h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{successfulTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by transaction ID, customer, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Methods</option>
              {/* paymentMethods.map(method => ( // This line is no longer needed */}
              {/*   <option key={method.id} value={method.id}> // This line is no longer needed */}
              {/*     {method.name} // This line is no longer needed */}
              {/*   </option> // This line is no longer needed */}
              {/* ))} // This line is no longer needed */}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 p-4"></th>
                <th className="text-left p-4 font-medium text-gray-900">Transaction ID</th>
                <th 
                  className="text-left p-4 font-medium text-gray-900 cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Customer</th>
                <th className="text-left p-4 font-medium text-gray-900">Course</th>
                <th 
                  className="text-left p-4 font-medium text-gray-900 cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Method</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <React.Fragment key={payment.id}>
                  <tr className={`hover:bg-gray-50 ${expandedRows.has(payment.id) ? 'bg-gray-50' : ''}`}>
                    <td className="p-4">
                      <button
                        onClick={() => toggleRowExpansion(payment.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      >
                        {expandedRows.has(payment.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {payment.transactionId}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{getUserById(payment.userId)?.first_name} {getUserById(payment.userId)?.last_name}</p>
                        <p className="text-sm text-gray-500">{getUserById(payment.userId)?.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-900">{getCourseById(payment.courseId)?.title}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="capitalize">{payment.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <payment.paymentMethod.icon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{payment.paymentMethod.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPaymentDetails(payment.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateInvoice(payment)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Generate Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendReceipt(payment)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Send Receipt"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row Details */}
                  {expandedRows.has(payment.id) && (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <div className="bg-gray-50 p-4 border-t border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Receipt:</span> {payment.receiptNumber}</p>
                                <p><span className="font-medium">Invoice:</span> {payment.invoiceNumber}</p>
                                <p><span className="font-medium">Processor:</span> {payment.paymentProcessor}</p>
                                <p><span className="font-medium">Fee:</span> {formatCurrency(payment.processorFee)}</p>
                                <p><span className="font-medium">Net Amount:</span> {formatCurrency(payment.netAmount)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                              <div className="space-y-1 text-sm">
                                {payment.cardDetails && (
                                  <>
                                    <p><span className="font-medium">Card:</span> {payment.cardDetails.cardNumber}</p>
                                    <p><span className="font-medium">Type:</span> {payment.cardDetails.cardType}</p>
                                    <p><span className="font-medium">Expiry:</span> {payment.cardDetails.expiryDate}</p>
                                  </>
                                )}
                                
                                {payment.bankDetails && (
                                  <>
                                    <p><span className="font-medium">Bank:</span> {payment.bankDetails.bankName}</p>
                                    <p><span className="font-medium">Account:</span> {payment.bankDetails.accountNumber}</p>
                                    <p><span className="font-medium">Reference:</span> {payment.bankDetails.referenceNumber}</p>
                                  </>
                                )}
                                
                                {payment.walletDetails && (
                                  <>
                                    <p><span className="font-medium">Provider:</span> {payment.walletDetails.provider}</p>
                                    <p><span className="font-medium">Wallet ID:</span> {payment.walletDetails.walletId}</p>
                                    <p><span className="font-medium">Email:</span> {payment.walletDetails.email}</p>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                              <p className="text-sm text-gray-600">{payment.paymentNotes}</p>
                              
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={() => setShowPaymentDetails(payment.id)}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  View Full Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      )}

      {/* Payment Insights */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Payment Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Payment Method Distribution */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Payment Method Distribution</h3>
            <div className="space-y-4">
              {/* Payment method distribution is unavailable because demo logic was removed. */}
              <div className="text-gray-500 text-sm">Payment method distribution is unavailable.</div>
            </div>
          </div>
          
          {/* Payment Status Distribution */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Payment Status Distribution</h3>
            <div className="space-y-4">
              {['completed', 'pending', 'failed'].map(status => {
                const statusCount = filteredPayments.filter(p => p.status === status).length;
                const percentage = totalTransactions > 0 ? Math.round((statusCount / totalTransactions) * 100) : 0;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium text-gray-900 capitalize">{status}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{percentage}%</span>
                        <span className="text-sm text-gray-500 ml-2">({statusCount})</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          status === 'completed' ? 'bg-green-500' : 
                          status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Tips */}
      <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-900 mb-2">Payment Processing Tips</h3>
            <div className="text-yellow-800 space-y-2">
              <p>• Regularly reconcile transactions with your payment processor's dashboard</p>
              <p>• Follow up on pending transactions that are more than 24 hours old</p>
              <p>• Investigate failed payments to identify common issues</p>
              <p>• Ensure receipt emails are being delivered to customers</p>
              <p>• Consider offering multiple payment methods to increase conversion rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}