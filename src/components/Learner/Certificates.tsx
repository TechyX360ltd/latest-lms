import React, { useState, useEffect } from 'react';
import { Award, Download, Calendar, BookOpen, Search } from 'lucide-react';

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  userName: string;
  instructor: string;
  completionDate: string;
  certificateUrl: string;
}

export function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load certificates from localStorage
    const loadCertificates = () => {
      const storedCertificates = localStorage.getItem('userCertificates');
      if (storedCertificates) {
        setCertificates(JSON.parse(storedCertificates));
      }
      setLoading(false);
    };

    setTimeout(loadCertificates, 500);
  }, []);

  const filteredCertificates = certificates.filter(cert =>
    cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = (certificate: Certificate) => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${certificate.courseName}-Certificate.pdf`;
    link.click();
    alert(`${certificate.courseName} certificate downloaded as PDF!`);
  };

  const handleDownloadPNG = (certificate: Certificate) => {
    // Simulate PNG download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${certificate.courseName}-Certificate.png`;
    link.click();
    alert(`${certificate.courseName} certificate downloaded as PNG!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">View and download your course completion certificates</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredCertificates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {certificates.length === 0 ? 'No certificates yet' : 'No certificates found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {certificates.length === 0 
              ? 'Complete courses to earn certificates and showcase your achievements'
              : 'Try adjusting your search criteria'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCertificates.map((certificate) => (
            <div key={certificate.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border-b-4 border-blue-200 p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <img 
                      src="/BLACK-1-removebg-preview.png" 
                      alt="TECHYX 360" 
                      className="h-8 w-auto mx-auto mb-2"
                    />
                    <h3 className="text-lg font-bold text-gray-900">Certificate of Completion</h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-1">This is to certify that</p>
                    <h4 className="text-xl font-bold text-blue-900 mb-1">{certificate.userName}</h4>
                    <p className="text-sm text-gray-700 mb-1">has successfully completed</p>
                    <h5 className="text-lg font-bold text-gray-900">{certificate.courseName}</h5>
                  </div>
                  
                  <div className="flex justify-between items-end text-xs">
                    <div>
                      <p className="text-gray-600">Instructor</p>
                      <p className="font-semibold text-gray-900">{certificate.instructor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(certificate.completionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{certificate.courseName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(certificate.completionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDownloadPDF(certificate)}
                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleDownloadPNG(certificate)}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PNG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Certificate Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-sm text-gray-600">Total Certificates</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{new Set(certificates.map(c => c.courseId)).size}</p>
              <p className="text-sm text-gray-600">Courses Completed</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.length > 0 ? new Date(Math.max(...certificates.map(c => new Date(c.completionDate).getTime()))).getFullYear() : new Date().getFullYear()}
              </p>
              <p className="text-sm text-gray-600">Latest Year</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}