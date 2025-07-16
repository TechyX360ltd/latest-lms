import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Briefcase, DollarSign, Star, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

interface Job {
  id: string;
  title: string;
  company: string;
  company_logo: string;
  location: string;
  job_type: string;
  description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  tags: string[];
  application_url: string;
  contact_email: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  salary_text: string; // Added salary_text to the interface
}

// Job Details Modal
const JobDetailsModal: React.FC<{
  job: Job | null;
  open: boolean;
  onClose: () => void;
}> = ({ job, open, onClose }) => {
  if (!open || !job) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h2>
          <div className="text-gray-600 text-sm">{job.company}</div>
        </div>
        {/* In JobDetailsModal, only show location and job type badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.location}
          </span>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{job.job_type}</span>
        </div>
        <div className="mb-4">
          <span className="block text-sm text-gray-500 mb-1">Salary</span>
          <span className="text-base font-medium text-gray-800">
            {job.salary_text ? job.salary_text : 'Salary not specified'}
          </span>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-1">Description</h3>
          <p className="text-gray-700 whitespace-pre-line text-sm">{job.description}</p>
        </div>
        {job.requirements && (
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-1">Requirements</h3>
            <p className="text-gray-700 whitespace-pre-line text-sm">{job.requirements}</p>
          </div>
        )}
        <div className="flex gap-2 mt-6">
          {job.application_url && (
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm"
            >
              Apply Now
            </a>
          )}
          {job.contact_email && (
            <a
              href={`mailto:${job.contact_email}`}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Contact
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const JobBoardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const salaryRanges = [
    { label: 'All Salaries', value: '' },
    { label: 'Under $50k', value: '0-50000' },
    { label: '$50k - $75k', value: '50000-75000' },
    { label: '$75k - $100k', value: '75000-100000' },
    { label: '$100k+', value: '100000-999999' }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, salaryFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Job type filter
    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.job_type === jobTypeFilter);
    }

    // Salary filter
    if (salaryFilter) {
      const [min, max] = salaryFilter.split('-').map(Number);
      filtered = filtered.filter(job => {
        const jobMin = job.salary_min || 0;
        const jobMax = job.salary_max || 0;
        return jobMin >= min && jobMax <= max;
      });
    }

    setFilteredJobs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setJobTypeFilter('');
    setSalaryFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-3 px-1 md:px-2 lg:px-4 w-full">
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-3 px-1 md:px-2 lg:px-4 w-full">
      <Breadcrumbs />
      <div className="w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Board</h1>
          <p className="text-gray-600 text-lg">Find your next opportunity. Browse open positions below.</p>
        </header>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Job Type Filter */}
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {/* Salary Filter */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-bold select-none">₦</span>
              <select
                value={salaryFilter}
                onChange={(e) => setSalaryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {salaryRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Clear Filters Button */}
          {(searchTerm || locationFilter || jobTypeFilter || salaryFilter) && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </p>
        </div>

        {/* Job Grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 flex flex-col justify-between border ${
                  job.is_featured ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-100'
                } w-full min-w-0`}
              >
                {/* Featured Badge */}
                {job.is_featured && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                )}

                <div className="flex items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">{job.title}</h2>
                    <span className="text-sm text-gray-500">{job.company}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-gray-700 text-sm line-clamp-3">{job.description}</p>
                </div>

                {/* In job card, only show location and job type badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.location}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {job.job_type}
                  </span>
                </div>

                {/* Salary */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">
                    {job.salary_text ? job.salary_text : 'Salary not specified'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {job.application_url && (
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm"
                    >
                      Apply Now
                    </a>
                  )}
                  <button
                    className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => {
                      setSelectedJob(job);
                      setModalOpen(true);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Job Details Modal */}
      <JobDetailsModal job={selectedJob} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default JobBoardPage; 