import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Users, 
  Save, 
  X, 
  GraduationCap,
  Building,
  FileText,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';

interface School {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  courseCount: number;
  studentCount: number;
  instructorCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface SchoolFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    description: '',
    icon: 'GraduationCap',
    color: 'blue',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available icons for schools
  const availableIcons = [
    { name: 'GraduationCap', icon: GraduationCap, label: 'Graduation Cap' },
    { name: 'Building', icon: Building, label: 'Building' },
    { name: 'BookOpen', icon: BookOpen, label: 'Book' },
    { name: 'Users', icon: Users, label: 'Users' },
    { name: 'Award', icon: Award, label: 'Award' },
    { name: 'TrendingUp', icon: TrendingUp, label: 'Trending Up' },
    { name: 'FileText', icon: FileText, label: 'Document' }
  ];

  // Available colors for schools
  const availableColors = [
    { name: 'blue', class: 'bg-blue-500', label: 'Blue' },
    { name: 'green', class: 'bg-green-500', label: 'Green' },
    { name: 'purple', class: 'bg-purple-500', label: 'Purple' },
    { name: 'red', class: 'bg-red-500', label: 'Red' },
    { name: 'yellow', class: 'bg-yellow-500', label: 'Yellow' },
    { name: 'indigo', class: 'bg-indigo-500', label: 'Indigo' },
    { name: 'pink', class: 'bg-pink-500', label: 'Pink' },
    { name: 'orange', class: 'bg-orange-500', label: 'Orange' }
  ];

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = () => {
    const storedSchools = localStorage.getItem('schools');
    const defaultSchools: School[] = [
      {
        id: 'school-of-engineering',
        name: 'School of Engineering',
        description: 'Technical and engineering courses covering software development, data science, AI, and more',
        icon: 'Building',
        color: 'blue',
        courseCount: 25,
        studentCount: 450,
        instructorCount: 12,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'school-of-design',
        name: 'School of Design',
        description: 'Creative design courses including UI/UX, graphic design, and digital arts',
        icon: 'Award',
        color: 'purple',
        courseCount: 18,
        studentCount: 320,
        instructorCount: 8,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'school-of-product',
        name: 'School of Product',
        description: 'Product management and strategy courses for aspiring product managers',
        icon: 'TrendingUp',
        color: 'green',
        courseCount: 12,
        studentCount: 180,
        instructorCount: 6,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'school-of-marketing',
        name: 'School of Marketing',
        description: 'Digital marketing, growth hacking, and brand strategy courses',
        icon: 'Users',
        color: 'orange',
        courseCount: 15,
        studentCount: 280,
        instructorCount: 7,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'school-of-business',
        name: 'School of Business',
        description: 'Business strategy, entrepreneurship, and leadership development courses',
        icon: 'GraduationCap',
        color: 'indigo',
        courseCount: 20,
        studentCount: 350,
        instructorCount: 10,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    if (storedSchools) {
      setSchools(JSON.parse(storedSchools));
    } else {
      localStorage.setItem('schools', JSON.stringify(defaultSchools));
      setSchools(defaultSchools);
    }
    setLoading(false);
  };

  const saveSchools = (updatedSchools: School[]) => {
    localStorage.setItem('schools', JSON.stringify(updatedSchools));
    setSchools(updatedSchools);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.icon) {
      newErrors.icon = 'Please select an icon';
    }

    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newSchool: School = {
        id: `school-${Date.now()}`,
        ...formData,
        courseCount: 0,
        studentCount: 0,
        instructorCount: 0,
        createdAt: new Date().toISOString()
      };

      const updatedSchools = [...schools, newSchool];
      saveSchools(updatedSchools);
      
      setShowCreateModal(false);
      resetForm();
      alert('School created successfully!');
    } catch (error) {
      console.error('Error creating school:', error);
      alert('Failed to create school. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !selectedSchool) return;

    setIsSubmitting(true);

    try {
      const updatedSchools = schools.map(school =>
        school.id === selectedSchool.id
          ? { ...school, ...formData, updatedAt: new Date().toISOString() }
          : school
      );

      saveSchools(updatedSchools);
      
      setShowEditModal(false);
      setSelectedSchool(null);
      resetForm();
      alert('School updated successfully!');
    } catch (error) {
      console.error('Error updating school:', error);
      alert('Failed to update school. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (schoolId: string) => {
    if (!window.confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }

    try {
      const updatedSchools = schools.filter(school => school.id !== schoolId);
      saveSchools(updatedSchools);
      alert('School deleted successfully!');
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Failed to delete school. Please try again.');
    }
  };

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      description: school.description,
      icon: school.icon,
      color: school.color,
      isActive: school.isActive
    });
    setShowEditModal(true);
  };

  const handleView = (school: School) => {
    setSelectedSchool(school);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'GraduationCap',
      color: 'blue',
      isActive: true
    });
    setErrors({});
  };

  const getIconComponent = (iconName: string) => {
    const iconData = availableIcons.find(icon => icon.name === iconName);
    return iconData ? iconData.icon : GraduationCap;
  };

  const getColorClass = (colorName: string) => {
    const colorData = availableColors.find(color => color.name === colorName);
    return colorData ? colorData.class : 'bg-blue-500';
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && school.isActive) ||
                         (selectedStatus === 'inactive' && !school.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.isActive).length;
  const totalCourses = schools.reduce((sum, s) => sum + s.courseCount, 0);
  const totalStudents = schools.reduce((sum, s) => sum + s.studentCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Management</h1>
          <p className="text-gray-600">Manage your educational schools and their offerings</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create School
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Schools</p>
              <p className="text-2xl font-bold text-gray-900">{totalSchools}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Schools</p>
              <p className="text-2xl font-bold text-gray-900">{activeSchools}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
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
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => {
          const IconComponent = getIconComponent(school.icon);
          const colorClass = getColorClass(school.color);
          
          return (
            <div key={school.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`${colorClass} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    school.isActive 
                      ? 'bg-white bg-opacity-20 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{school.name}</h3>
                <p className="text-white text-opacity-90 text-sm line-clamp-2">{school.description}</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{school.courseCount}</p>
                    <p className="text-xs text-gray-500">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{school.studentCount}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{school.instructorCount}</p>
                    <p className="text-xs text-gray-500">Instructors</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleView(school)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button 
                    onClick={() => handleEdit(school)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(school.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete School"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchools.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schools found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or create a new school</p>
        </div>
      )}

      {/* Create School Modal */}
      {showCreateModal && (
        <SchoolFormModal
          title="Create New School"
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isSubmitting={isSubmitting}
          availableIcons={availableIcons}
          availableColors={availableColors}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        />
      )}

      {/* Edit School Modal */}
      {showEditModal && selectedSchool && (
        <SchoolFormModal
          title="Edit School"
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          isSubmitting={isSubmitting}
          availableIcons={availableIcons}
          availableColors={availableColors}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedSchool(null);
            resetForm();
          }}
        />
      )}

      {/* View School Modal */}
      {showViewModal && selectedSchool && (
        <SchoolViewModal
          school={selectedSchool}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSchool(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            handleEdit(selectedSchool);
          }}
        />
      )}
    </div>
  );
}

// School Form Modal Component
function SchoolFormModal({
  title,
  formData,
  setFormData,
  errors,
  isSubmitting,
  availableIcons,
  availableColors,
  onSubmit,
  onCancel
}: {
  title: string;
  formData: SchoolFormData;
  setFormData: (data: SchoolFormData) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
  availableIcons: any[];
  availableColors: any[];
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter school name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what this school offers"
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Icon *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {availableIcons.map((iconData) => {
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={iconData.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconData.name })}
                    className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                      formData.icon === iconData.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-6 h-6 text-gray-600" />
                    <span className="text-xs text-gray-600">{iconData.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.icon && <p className="text-red-600 text-sm mt-1">{errors.icon}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {availableColors.map((colorData) => (
                <button
                  key={colorData.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: colorData.name })}
                  className={`p-4 border-2 rounded-lg transition-colors flex flex-col items-center gap-2 ${
                    formData.color === colorData.name
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 ${colorData.class} rounded-full`}></div>
                  <span className="text-xs text-gray-600">{colorData.label}</span>
                </button>
              ))}
            </div>
            {errors.color && <p className="text-red-600 text-sm mt-1">{errors.color}</p>}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              School is active and visible to users
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save School'}
          </button>
        </div>
      </div>
    </div>
  );
}

// School View Modal Component
function SchoolViewModal({
  school,
  onClose,
  onEdit
}: {
  school: School;
  onClose: () => void;
  onEdit: () => void;
}) {
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      GraduationCap,
      Building,
      BookOpen,
      Users,
      Award,
      TrendingUp,
      FileText
    };
    return iconMap[iconName] || GraduationCap;
  };

  const getColorClass = (colorName: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500'
    };
    return colorMap[colorName] || 'bg-blue-500';
  };

  const IconComponent = getIconComponent(school.icon);
  const colorClass = getColorClass(school.color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">School Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* School Header */}
          <div className={`${colorClass} rounded-xl p-6 text-white mb-6`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <IconComponent className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{school.name}</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                  school.isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <p className="text-white text-opacity-90">{school.description}</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{school.courseCount}</p>
              <p className="text-sm text-gray-600">Courses</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{school.studentCount}</p>
              <p className="text-sm text-gray-600">Students</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <GraduationCap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{school.instructorCount}</p>
              <p className="text-sm text-gray-600">Instructors</p>
            </div>
          </div>

          {/* School Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-600">{new Date(school.createdAt).toLocaleDateString()}</p>
              </div>
              {school.updatedAt && (
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-600">{new Date(school.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">School ID:</span>
                <p className="text-gray-600 font-mono text-xs">{school.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className={`font-medium ${school.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit School
          </button>
        </div>
      </div>
    </div>
  );
}