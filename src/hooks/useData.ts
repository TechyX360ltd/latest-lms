import { useState, useEffect } from 'react';
import { Course, Category, User, Payment, Assignment, Notification, NotificationReply } from '../types';
import { supabase } from '../lib/supabase';
import { keysToCamel } from '../lib/caseUtils';
import { useToast } from '../components/Auth/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Module, Lesson } from '../types';

// School interface (replacing Category)
interface School {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  course_count: number;
  student_count: number;
  instructor_count: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// Mock schools (replacing categories)
const mockSchools: School[] = [
  { 
    id: 'school-of-engineering', 
    name: 'School of Engineering', 
    description: 'Technical and engineering courses covering software development, data science, AI, and more',
    icon: 'Building',
    color: 'blue',
    course_count: 25,
    student_count: 450,
    instructor_count: 12,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 'school-of-design', 
    name: 'School of Design', 
    description: 'Creative design courses including UI/UX, graphic design, and digital arts',
    icon: 'Award',
    color: 'purple',
    course_count: 18,
    student_count: 320,
    instructor_count: 8,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 'school-of-product', 
    name: 'School of Product', 
    description: 'Product management and strategy courses for aspiring product managers',
    icon: 'TrendingUp',
    color: 'green',
    course_count: 12,
    student_count: 180,
    instructor_count: 6,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 'school-of-marketing', 
    name: 'School of Marketing', 
    description: 'Digital marketing, growth hacking, and brand strategy courses',
    icon: 'Users',
    color: 'orange',
    course_count: 15,
    student_count: 280,
    instructor_count: 7,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 'school-of-business', 
    name: 'School of Business', 
    description: 'Business strategy, entrepreneurship, and leadership development courses',
    icon: 'GraduationCap',
    color: 'indigo',
    course_count: 20,
    student_count: 350,
    instructor_count: 10,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z'
  },
];

const mockPayments: Payment[] = [
  {
    id: '1',
    userId: '1',
    courseId: '1',
    amount: 25000,
    status: 'completed',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    courseId: '2',
    amount: 35000,
    status: 'completed',
    created_at: '2024-01-20T00:00:00Z',
  },
];

// Check if Supabase is connected and fetch courses
const fetchCoursesFromSupabase = async () => {
  try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*');
      if (error) throw error;
      if (courses && courses.length > 0) {
        // Use keysToCamel to convert snake_case to camelCase
        return keysToCamel<Course[]>(courses);
      }
  } catch (error) {
    console.error('Error fetching courses from Supabase:', error);
  }
  return null;
};

const saveAllCourses = async (courses: Course[]): Promise<void> => {
  try {
    // Try to save to Supabase first
      for (const course of courses) {
        // Check if course exists
        if (!isValidUUID(course.id)) throw new Error('Invalid course.id: must be UUID');
        const { data: existingCourse, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', course.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingCourse) {
          // Update existing course
          const { error: updateError } = await supabase
            .from('courses')
            .update({
              title: course.title,
              description: course.description,
              instructor: course.instructor,
              category: course.category,
              format: course.format,
              duration: course.duration,
              thumbnail: course.thumbnail,
              price: course.price,
              is_published: course.is_published,
              enrolled_count: course.enrolled_count,
              certificatetemplate: course.certificatetemplate,
              updated_at: new Date().toISOString()
            })
            .eq('id', course.id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new course
          const { error: insertError } = await supabase
            .from('courses')
            .insert({
              id: course.id,
              title: course.title,
              description: course.description,
              instructor: course.instructor,
              category: course.category,
              format: course.format,
              duration: course.duration,
              thumbnail: course.thumbnail,
              price: course.price,
              is_published: course.is_published,
              enrolled_count: course.enrolled_count,
              certificatetemplate: course.certificatetemplate,
              created_at: course.created_at
            });
          
          if (insertError) throw insertError;
        }
        
        // Handle modules and lessons
        if (course.modules) {
          for (const module of course.modules) {
            // Check if module exists
            if (!isValidUUID(module.id)) throw new Error('Invalid module.id: must be UUID');
            const { data: existingModule, error: moduleCheckError } = await supabase
              .from('modules')
              .select('id')
              .eq('id', module.id)
              .maybeSingle();
            
            if (moduleCheckError) throw moduleCheckError;
            
            if (existingModule) {
              // Update existing module
              const { error: moduleUpdateError } = await supabase
                .from('modules')
                .update({
                  title: module.title,
                  description: module.description,
                  order: module.sort_order,
                  updated_at: new Date().toISOString()
                })
                .eq('id', module.id);
              
              if (moduleUpdateError) throw moduleUpdateError;
            } else {
              // Insert new module
              const { error: moduleInsertError } = await supabase
                .from('modules')
                .insert({
                  id: module.id,
                  course_id: course.id,
                  title: module.title,
                  description: module.description,
                  order: module.sort_order,
                  created_at: new Date().toISOString()
                });
              
              if (moduleInsertError) throw moduleInsertError;
            }
            
            // Handle lessons in this module
            if (module.lessons) {
              for (const lesson of module.lessons) {
                // Check if lesson exists
                if (!isValidUUID(lesson.id)) throw new Error('Invalid lesson.id: must be UUID');
                const { data: existingLesson, error: lessonCheckError } = await supabase
                  .from('lessons')
                  .select('id')
                  .eq('id', lesson.id)
                  .maybeSingle();
                
                if (lessonCheckError) throw lessonCheckError;
                
                if (existingLesson) {
                  // Update existing lesson
                  const { error: lessonUpdateError } = await supabase
                    .from('lessons')
                    .update({
                      title: lesson.title,
                      content: lesson.content,
                      video_url: lesson.video_url,
                      duration: lesson.duration,
                      order: lesson.sort_order,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', lesson.id);
                  
                  if (lessonUpdateError) throw lessonUpdateError;
                } else {
                  // Insert new lesson
                  const { error: lessonInsertError } = await supabase
                    .from('lessons')
                    .insert({
                      id: lesson.id,
                      course_id: course.id,
                      module_id: module.id,
                      title: lesson.title,
                      content: lesson.content,
                      video_url: lesson.video_url,
                      duration: lesson.duration,
                      order: lesson.sort_order,
                      created_at: new Date().toISOString()
                    });
                  
                  if (lessonInsertError) throw lessonInsertError;
                }
              }
            }
          }
        } else if (course.lessons) {
          // Handle lessons without modules
          for (const lesson of course.lessons) {
            // Check if lesson exists
            if (!isValidUUID(lesson.id)) throw new Error('Invalid lesson.id: must be UUID');
            const { data: existingLesson, error: lessonCheckError } = await supabase
              .from('lessons')
              .select('id')
              .eq('id', lesson.id)
              .maybeSingle();
            
            if (lessonCheckError) throw lessonCheckError;
            
            if (existingLesson) {
              // Update existing lesson
              const { error: lessonUpdateError } = await supabase
                .from('lessons')
                .update({
                  title: lesson.title,
                  content: lesson.content,
                  video_url: lesson.video_url,
                  duration: lesson.duration,
                  order: lesson.sort_order,
                  updated_at: new Date().toISOString()
                })
                .eq('id', lesson.id);
              
              if (lessonUpdateError) throw lessonUpdateError;
            } else {
              // Insert new lesson
              const { error: lessonInsertError } = await supabase
                .from('lessons')
                .insert({
                  id: lesson.id,
                  course_id: course.id,
                  module_id: null,
                  title: lesson.title,
                  content: lesson.content,
                  video_url: lesson.video_url,
                  duration: lesson.duration,
                  order: lesson.sort_order,
                  created_at: new Date().toISOString()
                });
              
              if (lessonInsertError) throw lessonInsertError;
            }
          }
        }
    }
  } catch (error) {
    console.error('Error saving courses to Supabase:', error);
  }
  // Fallback to localStorage if Supabase fails
  localStorage.setItem('allCourses', JSON.stringify(courses));
};

// Assignment storage functions
const getAssignmentsForCourse = async (courseId: string): Promise<Assignment[]> => {
  try {
    // Try to get from Supabase first
      const { data: assignments, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId);
      
      if (error) throw error;
      
      if (assignments && assignments.length > 0) {
        // Format assignments to match our app's structure
      return assignments.map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          due_date: assignment.due_date,
          max_points: assignment.max_points,
          allowed_file_types: assignment.allowed_file_types,
          max_file_size: assignment.max_file_size,
          module_id: assignment.module_id,
          course_id: assignment.course_id,
          is_required: assignment.is_required,
          created_at: assignment.created_at
        }));
    }
  } catch (error) {
    console.error('Error fetching assignments from Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  const storedAssignments = localStorage.getItem(`assignments-${courseId}`);
  if (storedAssignments) {
    return JSON.parse(storedAssignments);
  }
  return [];
};

const saveAssignmentsForCourse = async (courseId: string, assignments: Assignment[]) => {
  try {
      // For each assignment, update or insert into Supabase
      for (const assignment of assignments) {
        // Check if assignment exists
        const { data: existingAssignment, error: checkError } = await supabase
          .from('assignments')
          .select('id')
          .eq('id', assignment.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingAssignment) {
          // Update existing assignment
          const { error: updateError } = await supabase
            .from('assignments')
            .update({
              title: assignment.title,
              description: assignment.description,
              instructions: assignment.instructions,
              due_date: assignment.due_date,
              max_points: assignment.max_points,
              allowed_file_types: assignment.allowed_file_types,
              max_file_size: assignment.max_file_size,
              module_id: assignment.module_id,
              course_id: assignment.course_id,
              is_required: assignment.is_required,
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new assignment
          const { error: insertError } = await supabase
            .from('assignments')
            .insert({
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              instructions: assignment.instructions,
              due_date: assignment.due_date,
              max_points: assignment.max_points,
              allowed_file_types: assignment.allowed_file_types,
              max_file_size: assignment.max_file_size,
              module_id: assignment.module_id,
              course_id: assignment.course_id,
              is_required: assignment.is_required,
              created_at: assignment.created_at
            });
          
          if (insertError) throw insertError;
        }
      }
      
      return;
  } catch (error) {
    console.error('Error saving assignments to Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  localStorage.setItem(`assignments-${courseId}`, JSON.stringify(assignments));
};

// User storage functions
const getAllUsersFromStorage = async (): Promise<User[]> => {
  try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          user_courses:user_courses(course_id, status)
        `);
      
      if (error) throw error;
      
      if (users && users.length > 0) {
        // Format users to match our app's structure
        return users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          bio: u.bio || '',
          location: u.location || '',
          occupation: u.occupation || '',
          education: u.education || '',
          avatar: u.avatar_url,
          enrolledCourses: u.user_courses
            ? u.user_courses
                .filter((uc: any) => uc.status === 'enrolled')
                .map((uc: any) => uc.course_id)
            : [],
          completedCourses: u.user_courses
            ? u.user_courses
                .filter((uc: any) => uc.status === 'completed')
                .map((uc: any) => uc.course_id)
            : [],
          createdAt: u.created_at
        }));
    }
  } catch (error) {
    console.error('Error fetching users from Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  const storedUsers = localStorage.getItem('allUsers');
  if (storedUsers) {
    return JSON.parse(storedUsers);
  }
  return [];
};

// School storage functions - Updated to sync with Supabase
const getAllSchools = async (): Promise<School[]> => {
  try {
      const { data: schools, error } = await supabase
        .from('schools')
        .select('*');
      
      if (error) throw error;
      
      if (schools && schools.length > 0) {
        // Format schools to match our app's structure
        const mappedSchools = (schools || []).map((school: any) => ({
          id: school.id,
          name: school.name,
          description: school.description,
          icon: school.icon,
          color: school.color,
          courseCount: school.course_count,
          studentCount: school.student_count,
          instructorCount: school.instructor_count,
          isActive: school.is_active,
          createdAt: school.created_at,
          updatedAt: school.updated_at,
        }));
        return mappedSchools;
      }
      
      // If no schools in Supabase, insert default schools
      const { error: insertError } = await supabase
        .from('schools')
        .insert(mockSchools.map(school => ({
          id: school.id,
          name: school.name,
          description: school.description,
          icon: school.icon,
          color: school.color,
          course_count: school.course_count,
          student_count: school.student_count,
          instructor_count: school.instructor_count,
          is_active: school.is_active,
          created_at: school.created_at
        })));
      
      if (insertError) throw insertError;
      
      return mockSchools;
  } catch (error) {
    console.error('Error fetching schools from Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  const storedSchools = localStorage.getItem('schools');
  if (storedSchools) {
    return JSON.parse(storedSchools);
  } else {
    localStorage.setItem('schools', JSON.stringify(mockSchools));
    return mockSchools;
  }
};

const saveAllSchools = async (schools: School[]) => {
  try {
      // For each school, update or insert into Supabase
      for (const school of schools) {
        // Check if school exists
        const { data: existingSchool, error: checkError } = await supabase
          .from('schools')
          .select('id')
          .eq('id', school.id)
          .maybeSingle();
        
        if (checkError) throw checkError;
        
        if (existingSchool) {
          // Update existing school
          const { error: updateError } = await supabase
            .from('schools')
            .update({
              name: school.name,
              description: school.description,
              icon: school.icon,
              color: school.color,
              course_count: school.course_count,
              student_count: school.student_count,
              instructor_count: school.instructor_count,
              is_active: school.is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', school.id);
          
          if (updateError) throw updateError;
        } else {
          // Insert new school
          const { error: insertError } = await supabase
            .from('schools')
            .insert({
              id: school.id,
              name: school.name,
              description: school.description,
              icon: school.icon,
              color: school.color,
              course_count: school.course_count,
              student_count: school.student_count,
              instructor_count: school.instructor_count,
              is_active: school.is_active,
              created_at: school.created_at
            });
          
          if (insertError) throw insertError;
        }
      }
      
      return;
  } catch (error) {
    console.error('Error saving schools to Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  localStorage.setItem('schools', JSON.stringify(schools));
};

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { user } = useAuth(); // Not needed for public course browsing

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all published courses for learners
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true);
        if (error) {
          setError(error.message);
          setCourses([]);
        } else {
          setCourses(data || []);
        }
      } catch (err) {
        setError('Failed to fetch courses');
        setCourses([]);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  const addCourse = async (newCourse: Partial<Course> & { modules?: Module[] }) => {
    let createdCourseId: string | undefined;
    let errors: any[] = [];
    try {
      // Insert course
      const { data, error } = await supabase
        .from('courses')
        .insert([newCourse])
        .select();
      console.log('addCourse result:', { data, error });
      if (error) {
        console.error('Error inserting course:', error);
        errors.push({ step: 'insert_course', error });
        return { data, error };
      }
      if (!data || !Array.isArray(data) || !data[0]?.id) {
        const err = new Error('Course creation failed - no course ID returned');
        console.error(err);
        errors.push({ step: 'no_course_id', error: err });
        return { data, error: err };
      }
      createdCourseId = data[0].id;
      // Save modules and lessons if provided
      if (newCourse.modules && Array.isArray(newCourse.modules)) {
        for (const mod of newCourse.modules) {
          try {
            if (!mod.id || !createdCourseId) throw new Error('Invalid UUID for module or course');
            const { error: modError } = await supabase
              .from('modules')
              .upsert({
                id: mod.id,
                course_id: createdCourseId,
                title: mod.title,
                description: mod.description,
                order: mod.sort_order,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            if (modError) {
              console.error('Module upsert error:', modError, mod);
              errors.push({ step: 'upsert_module', module: mod, error: modError });
              continue;
            }
            // Save lessons for this module
            if (mod.lessons && Array.isArray(mod.lessons)) {
              for (const les of mod.lessons) {
                try {
                  if (!les.id || !mod.id || !createdCourseId) throw new Error('Invalid UUID for lesson, module, or course');
                  const { error: lesError } = await supabase
                    .from('lessons')
                    .upsert({
                      id: les.id,
                      course_id: createdCourseId,
                      module_id: mod.id,
                      title: les.title,
                      content: les.content,
                      video_url: les.video_url || null,
                      duration: les.duration,
                      order: les.sort_order,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    });
                  if (lesError) {
                    console.error('Lesson upsert error:', lesError, les);
                    errors.push({ step: 'upsert_lesson', lesson: les, error: lesError });
                    continue;
                  }
                } catch (lessonErr) {
                  console.error('Lesson save error:', lessonErr);
                  errors.push({ step: 'save_lesson', lesson: les, error: lessonErr });
                }
              }
            }
          } catch (modErr) {
            console.error('Module save error:', modErr);
            errors.push({ step: 'save_module', module: mod, error: modErr });
          }
        }
      }
      return { data, error: errors.length > 0 ? errors : null };
    } catch (err) {
      console.error('Error in addCourse:', err);
      return { data: null, error: err };
    }
  };

  const updateCourse = async (courseId: string, updatedCourse: Partial<Course>) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updatedCourse)
      .eq('id', courseId)
      .select();
    if (!error && data) {
      setCourses(prev => prev.map(c => c.id === courseId ? data[0] : c));
    }
    return { data, error };
  };

  const deleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (!error) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
    }
    return { error };
  };

  const getCourseById = (courseId: string): Course | undefined => {
    return courses.find(course => course.id === courseId);
  };

  const getCourseBySlug = (slug: string): Course | undefined => {
    return courses.find(course => course.slug === slug);
  };

  return {
    courses,
    setCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    getCourseBySlug,
    loading,
    error
  };
}

export function useAssignments(courseId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      const courseAssignments = await getAssignmentsForCourse(courseId);
      setAssignments(courseAssignments);
      setLoading(false);
    };

    fetchAssignments();
  }, [courseId]);

  const addAssignment = async (newAssignment: Assignment) => {
    const updatedAssignments = [...assignments, newAssignment];
    await saveAssignmentsForCourse(courseId, updatedAssignments);
    setAssignments(updatedAssignments);
  };

  const updateAssignment = async (assignmentId: string, updatedAssignment: Partial<Assignment>) => {
    const updatedAssignments = assignments.map(assignment =>
      assignment.id === assignmentId ? { ...assignment, ...updatedAssignment } : assignment
    );
    await saveAssignmentsForCourse(courseId, updatedAssignments);
    setAssignments(updatedAssignments);
  };

  const deleteAssignment = async (assignmentId: string) => {
    const updatedAssignments = assignments.filter(assignment => assignment.id !== assignmentId);
    await saveAssignmentsForCourse(courseId, updatedAssignments);
    setAssignments(updatedAssignments);
  };

  return {
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    loading
  };
}

// Updated Schools hook with Supabase sync
export function useSchools() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchools = async () => {
      const allSchools = await getAllSchools();
      setSchools(allSchools);
      setLoading(false);
    };

    fetchSchools();
  }, []);

  const addSchool = async (newSchool: School) => {
    const allSchools = await getAllSchools();
    const updatedSchools = [...allSchools, newSchool];
    await saveAllSchools(updatedSchools);
    setSchools(updatedSchools);
  };

  const updateSchool = async (schoolId: string, updatedSchool: Partial<School>) => {
    const allSchools = await getAllSchools();
    const updatedSchools = allSchools.map(school =>
      school.id === schoolId ? { ...school, ...updatedSchool } : school
    );
    await saveAllSchools(updatedSchools);
    setSchools(updatedSchools);
  };

  const deleteSchool = async (schoolId: string) => {
    const allSchools = await getAllSchools();
    const updatedSchools = allSchools.filter(school => school.id !== schoolId);
    await saveAllSchools(updatedSchools);
    setSchools(updatedSchools);
  };

  const refreshSchools = async () => {
    const allSchools = await getAllSchools();
    setSchools(allSchools);
  };

  return { 
    schools, 
    setSchools, 
    addSchool, 
    updateSchool, 
    deleteSchool, 
    refreshSchools, 
    loading 
  };
}

// Updated Categories hook to only select fields from categories and avoid invalid join
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, description')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const mappedCategories: Category[] = (data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          courseCount: 0, // Remove or update if you add course counting later
        }));
        setCategories(mappedCategories);
      } catch (err) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const refreshCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedCategories: Category[] = (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        courseCount: 0,
      }));
      setCategories(mappedCategories);
    } catch (err) {
      setCategories([]);
    }
  };

  return { categories, setCategories, refreshCategories, loading };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Select only columns that exist in the users table
        const { data: usersData, error } = await supabase.from('users').select('id, first_name, last_name, email, phone, role, created_at, updated_at, is_approved, payout_email, expertise');
        if (error) throw error;
        console.log('Raw users from Supabase:', usersData);
        const formattedUsers = (usersData || []).map((u: any) => ({
          ...u,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          isApproved: u.is_approved,
          payoutEmail: u.payout_email,
          createdAt: u.created_at,
        }));
        setUsers(formattedUsers);
        console.log('Mapped users for frontend:', formattedUsers);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error fetching users from Supabase:', error);
      }
      // Fallback to localStorage or mock data
      const allUsers = await getAllUsersFromStorage();
      setUsers(allUsers);
      console.log('Fetched users from localStorage/mock:', allUsers);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const refreshUsers = async () => {
    try {
      const { data: usersData, error } = await supabase.from('users').select('id, first_name, last_name, email, phone, role, created_at, updated_at, is_approved, payout_email, expertise');
      if (error) throw error;
      const formattedUsers = (usersData || []).map((u: any) => ({
        ...u,
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        isApproved: u.is_approved,
        payoutEmail: u.payout_email,
        createdAt: u.created_at,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error refreshing users from Supabase:', error);
      setUsers([]);
    }
  };

  const deleteUser = async (userId: string, adminPassword: string) => {
  try {
    const response = await fetch('https://rpexcrwcgdmlfxihdmny.functions.supabase.co/admin-delete-user2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, admin_password: adminPassword })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to delete user');
    await refreshUsers();
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

  return { users, setUsers, addUser, refreshUsers, loading, deleteUser };
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
          const { data: paymentsData, error } = await supabase
            .from('payments')
            .select('*');
          
          if (error) throw error;
          
          if (paymentsData && paymentsData.length > 0) {
            // Format payments to match our app's structure
            const formattedPayments = paymentsData.map((payment: any) => ({
              id: payment.id,
              userId: payment.user_id,
              courseId: payment.course_id,
              amount: payment.amount,
              status: payment.status,
              createdAt: payment.created_at
            }));
            
            setPayments(formattedPayments);
            setLoading(false);
            return;
        }
      } catch (error) {
        console.error('Error fetching payments from Supabase:', error);
      }
      
      // Fallback to mock data
      setPayments(mockPayments);
      setLoading(false);
    };

    fetchPayments();
  }, []);

  return { payments, setPayments, loading };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  console.log('useNotifications hook mounted for user:', user?.id);

  // Helper function to format notifications
  const formatNotifications = async (notificationsData: any[]) => {
    try {
      // Get user data for sender names and recipient names
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email');
      if (usersError) throw usersError;
      // Fetch all recipients for all notifications
      const notificationIds = (notificationsData || []).map((n: any) => n.id);
      let allRecipients: any[] = [];
      if (notificationIds.length > 0) {
        const { data: recipientsData, error: recipientsError } = await supabase
          .from('notification_recipients')
          .select('*')
          .in('notification_id', notificationIds);
        if (recipientsError) throw recipientsError;
        allRecipients = recipientsData || [];
      }
      // Defensive: always use arrays
      const safeNotifications = notificationsData || [];
      const safeUsers = users || [];
      // Format notifications to match our app's structure
      const formattedNotifications = safeNotifications.map((notification: any) => {
        const sender = safeUsers.find((u: any) => u.id === notification.sender_id);
        // Attach recipients from DB
        const recipientsForNotification = allRecipients.filter((r) => r.notification_id === notification.id);
        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          senderId: notification.sender_id,
          senderName: sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.email || 'Unknown User' : 'Unknown User',
          recipients: recipientsForNotification.map((recipient: any) => {
            const user = safeUsers.find((u: any) => u.id === recipient.user_id);
            return {
              userId: recipient.user_id,
              userName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown User' : 'Unknown User',
              isRead: recipient.is_read,
              readAt: recipient.read_at,
              isStarred: recipient.is_starred,
              starredAt: recipient.starred_at
            };
          }),
          courseId: notification.course_id,
          createdAt: notification.created_at,
          created_at: notification.created_at, // for DB compatibility
          attachments: (notification.attachments || []).map((attachment: any) => ({
            id: attachment.id,
            name: attachment.name,
            type: attachment.type,
            size: attachment.size,
            url: attachment.url
          })),
          replies: (notification.replies || []).map((reply: any) => {
            const replyUser = safeUsers.find((u: any) => u.id === reply.user_id);
            return {
              id: reply.id,
              notificationId: reply.notification_id,
              userId: reply.user_id,
              userName: replyUser?.name || 'Unknown User',
              message: reply.message,
              createdAt: reply.created_at
            };
          })
        };
      });
      return formattedNotifications;
    } catch (error) {
      console.error('Error formatting notifications:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: notificationsData, error } = await supabase
          .from('notifications')
          .select('*');
        
        if (error) throw error;
        
        if (notificationsData && notificationsData.length > 0) {
          const formattedNotifications = await formatNotifications(notificationsData);
            
            setNotifications(formattedNotifications);
            setLoading(false);
            return;
        }
      } catch (error) {
        console.error('Error fetching notifications from Supabase:', error);
      }
      
      // Fallback to localStorage if Supabase fails
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  // Real-time subscription for notifications
  useEffect(() => {
    // Subscribe to real-time changes on notifications table
    const notificationsChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        async (payload: any) => {
          // Fetch updated notifications when there's a change
          try {
            const { data: notificationsData, error } = await supabase
              .from('notifications')
              .select('*');
            if (error) throw error;
            if (notificationsData && notificationsData.length > 0) {
              const formattedNotifications = await formatNotifications(notificationsData);
              setNotifications(formattedNotifications);
              // Show toast and play sound for new gift_received notifications
              if (payload.eventType === 'INSERT') {
                const notification = payload.new;
                // Check if this is a gift_received notification for the current user
                if (notification.type === 'gift_received' && user && notification.user_id === user.id) {
                  // Play sound
                  const audio = new Audio('/notification.mp3');
                  audio.play();
                  // Show toast
                  showToast('🎁 You received a gift!', 'confirmation', 6000, notification.message);
                }
              }
            }
          } catch (error) {
            console.error('Error updating notifications from real-time:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_recipients'
        },
        async (payload: any) => {
          console.log('Real-time notification recipient change:', payload);
          
          // Fetch updated notifications when recipient status changes
          try {
            const { data: notificationsData, error } = await supabase
              .from('notifications')
              .select('*');
            if (error) throw error;
            if (notificationsData && notificationsData.length > 0) {
              const formattedNotifications = await formatNotifications(notificationsData);
              setNotifications(formattedNotifications);
            }
          } catch (error) {
            console.error('Error updating notifications from real-time:', error);
          }
        }
      )
  }, []);

  // Add Notification to DB and real-time
  const addNotification = async (notificationData: Notification) => {
    try {
      // Generate IDs
      const notificationId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      // Insert notification
      const { error: notifError } = await supabase.from('notifications').insert({
        id: notificationId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        sender_id: notificationData.senderId,
        course_id: notificationData.courseId || null,
        scheduled_for: notificationData.scheduledFor || null,
        created_at: createdAt
      });
      if (notifError) throw notifError;
      // Insert recipients
      if (notificationData.recipients && notificationData.recipients.length > 0) {
        const recipientRows = notificationData.recipients.map((r) => ({
          id: crypto.randomUUID(),
          notification_id: notificationId,
          user_id: r.userId,
          is_read: false,
          is_starred: false,
          created_at: createdAt
        }));
        const { error: recError } = await supabase.from('notification_recipients').insert(recipientRows);
        if (recError) throw recError;
      }
      // Insert attachments if any
      if (notificationData.attachments && notificationData.attachments.length > 0) {
        const attachmentRows = notificationData.attachments.map((a) => ({
          id: crypto.randomUUID(),
          notification_id: notificationId,
          name: a.name,
          type: a.type,
          size: a.size,
          url: a.url,
          created_at: createdAt
        }));
        const { error: attError } = await supabase.from('notification_attachments').insert(attachmentRows);
        if (attError) throw attError;
      }
      showToast('Notification sent!', 'confirmation');
      // Optionally, fetch notifications again to update state
      // await fetchNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
      showToast('Failed to send notification', 'error');
    }
  };

  return { notifications, setNotifications, loading, addNotification };
}

export function useCourseStructure(courseId: string) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !/^[0-9a-fA-F-]{36}$/.test(courseId)) {
      setModules([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    async function fetchStructure() {
      try {
        // Fetch modules for the course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });
        if (modulesError) throw modulesError;
        if (!modulesData) {
          setModules([]);
          setLoading(false);
          return;
        }
        // Fetch lessons for the course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId);
        if (lessonsError) throw lessonsError;
        // Fetch assignments for the course
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .eq('course_id', courseId);
        if (assignmentsError) throw assignmentsError;
        // Group lessons by module_id
        const lessonsByModule: { [moduleId: string]: Lesson[] } = {};
        (lessonsData || []).forEach((lesson: Lesson) => {
          if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = [];
          lessonsByModule[lesson.module_id].push(lesson);
        });
        // Group assignments by module_id (optional, if you want to attach to modules)
        const assignmentsByModule: { [moduleId: string]: Assignment[] } = {};
        (assignmentsData || []).forEach((assignment: Assignment) => {
          if (!assignmentsByModule[assignment.module_id]) assignmentsByModule[assignment.module_id] = [];
          assignmentsByModule[assignment.module_id].push(assignment);
        });
        // Attach lessons and assignments to modules
        const structuredModules = (modulesData || []).map((mod: Module) => ({
          ...mod,
          lessons: lessonsByModule[mod.id] || [],
          assignments: assignmentsByModule[mod.id] || [],
        }));
        setModules(structuredModules);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch course structure');
        setModules([]);
        setLoading(false);
      }
    }
    fetchStructure();
  }, [courseId]);

  return { modules, loading, error };
}

export function useAllCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      if (error) {
        setError(error.message);
        setCourses([]);
      } else {
        // For each course, fetch enrolled_count
        const coursesWithCounts = await Promise.all((data || []).map(async (course: any) => {
          const { count, error: countError } = await supabase
            .from('user_courses')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('status', 'enrolled');
          return {
            ...course,
            enrolled_count: count || 0,
          };
        }));
        setCourses(coursesWithCounts);
      }
    } catch (err) {
      setError('Failed to fetch courses');
      setCourses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const deleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (!error) {
      // Refetch all courses after deletion
      await fetchAllCourses();
    }
    return { error };
  };

  return { courses, loading, error, deleteCourse };
}