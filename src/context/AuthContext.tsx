import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../lib/supabase';
import { getDeviceType, getUserLocation } from '../lib/deviceUtils';
import { sendEmail } from '../lib/email';
import { fillTemplate } from '../lib/template'; // adjust path as needed

interface AuthAction {
  type: 'LOGIN' | 'LOGOUT' | 'SET_LOADING' | 'SET_USER' | 'ADD_USER' | 'UPDATE_ENROLLMENT' | 'COMPLETE_COURSE' | 'UPDATE_PROFILE';
  payload?: any;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'UPDATE_ENROLLMENT':
      return {
        ...state,
        user: state.user ? { ...state.user, enrolledCourses: action.payload } : null,
      };
    case 'COMPLETE_COURSE':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          completedCourses: [...(state.user.completedCourses || []), action.payload],
          enrolledCourses: state.user.enrolledCourses ? state.user.enrolledCourses.filter((id: string) => id !== action.payload) : [],
        } : null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'ADD_USER':
      // This action is handled by updating Supabase
      return state;
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'enrolledCourses' | 'completedCourses'> & { password: string; referralCode?: string }) => Promise<void>;
  logout: () => void;
  addUserToAuth: (userData: any) => void;
  updateUserEnrollment: (enrolledCourses: string[]) => void;
  completeCourse: (courseId: string) => void;
  updateUserProfile?: (profileData: any) => void;
  isSupabaseConnected: boolean;
  resetPassword: (email: string) => Promise<void>;
  refreshUserEnrollments: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get all users from localStorage or Supabase
const getAllUsers = async () => {
  try {
    // Try to get users from Supabase
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    
    if (users && users.length > 0) {
      return users;
    }
  } catch (error) {
    console.error('Error fetching users from Supabase:', error);
  }
  
  // Fallback to localStorage if Supabase fails
  const storedUsers = localStorage.getItem('allUsers');
  const defaultUsers = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+2348012345678',
      role: 'learner' as const,
      password: 'password',
      enrolledCourses: ['1', '2'], // Pre-enrolled for demo user
      completedCourses: [], // Initialize completed courses
      bio: 'Passionate learner exploring new technologies and skills.',
      location: 'Lagos, Nigeria',
      occupation: 'Software Developer',
      education: 'Bachelor of Computer Science',
      avatar: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phone: '+2348012345679',
      role: 'admin' as const,
      password: 'password',
      enrolledCourses: [],
      completedCourses: [],
      bio: 'Platform administrator managing the learning ecosystem.',
      location: 'Abuja, Nigeria',
      occupation: 'Platform Administrator',
      education: 'Master of Education Technology',
      avatar: null,
      createdAt: new Date().toISOString(),
    },
  ];

  if (storedUsers) {
    const users = JSON.parse(storedUsers);
    // Ensure all users have completedCourses array and profile fields
    return users.map((user: any) => ({
      ...user,
      completedCourses: user.completedCourses || [],
      bio: user.bio || '',
      location: user.location || '',
      occupation: user.occupation || '',
      education: user.education || '',
      avatar: user.avatar || null
    }));
  } else {
    // Initialize with default users
    localStorage.setItem('allUsers', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Inactivity logout timer (6 hours = 21600000 ms)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const INACTIVITY_LIMIT = 21600000; // 6 hours in ms

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      if (state.isAuthenticated) {
        timer = setTimeout(() => {
          // Only logout if still authenticated
          if (state.isAuthenticated) {
            // Dispatch a custom event for toast
            window.dispatchEvent(new CustomEvent('inactivity-logout', { detail: { message: 'You have been logged out due to inactivity.' } }));
            logout();
          }
        }, INACTIVITY_LIMIT);
      }
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    if (state.isAuthenticated) {
      resetTimer();
    }

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [state.isAuthenticated]);

  useEffect(() => {
    // Check Supabase connection
    const checkSupabaseConnection = async () => {
      try {
        // Use a simpler query that doesn't require specific permissions
        const { data, error } = await supabase.from('users').select('id').limit(1);
        if (!error) {
          setIsSupabaseConnected(true);
          console.log('Supabase connected successfully');
        } else {
          console.error('Supabase connection error:', error);
          setIsSupabaseConnected(false);
        }
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        setIsSupabaseConnected(false);
      }
    };

    checkSupabaseConnection();

    // Check for stored auth data
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          // Get user data from Supabase, including enrollments
          const { data: userData, error } = await supabase
            .from('users')
            .select('*, user_courses(user_id, course_id, status)')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          
          if (userData) {
            // Debug: log raw userData from Supabase
            console.log('Raw userData from Supabase:', userData);
            // Format user data to match our app's structure
            const formattedUser = {
              id: userData.id,
              firstName: userData.first_name,
              lastName: userData.last_name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              bio: userData.bio || '',
              location: userData.location || '',
              occupation: userData.occupation || '',
              education: userData.education || '',
              avatar: userData.avatar_url,
              referral_code: userData.referral_code,
              referred_by: userData.referred_by,
              coins: userData.coins || 0,
              enrolledCourses: userData.user_courses
                ? userData.user_courses.filter((e: any) => (e as any).status === 'enrolled').map((e: any) => (e as any).course_id)
                : [],
              completedCourses: userData.user_courses
                ? userData.user_courses.filter((e: any) => (e as any).status === 'completed').map((e: any) => (e as any).course_id)
                : [],
              createdAt: userData.created_at,
              // Add verification fields
              verification_status: userData.verification_status,
              verification_id_url: userData.verification_id_url,
              verification_rejection_reason: userData.verification_rejection_reason,
            };
            // Debug: log mapped formattedUser
            console.log('Mapped formattedUser for context:', formattedUser);
            
            dispatch({ type: 'LOGIN', payload: formattedUser });
            return;
          }
        } catch (error) {
          console.error('Error fetching user data from Supabase:', error);
        }
      }
      
      // Fallback to localStorage if Supabase auth fails
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Ensure user has completedCourses array and profile fields
        const updatedUser = {
          ...user,
          completedCourses: user.completedCourses || [],
          bio: user.bio || '',
          location: user.location || '',
          occupation: user.occupation || '',
          education: user.education || '',
          avatar: user.avatar || null,
          coins: user.coins || 0,
          created_at: user.created_at || new Date().toISOString(),
          // Add verification fields
          verification_status: user.verification_status,
          verification_id_url: user.verification_id_url,
          verification_rejection_reason: user.verification_rejection_reason,
        };
        dispatch({ type: 'LOGIN', payload: updatedUser });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthState();

    // Subscribe to Supabase auth state changes for session restoration
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session && session.user) {
        // Fetch user data and update context
        supabase
          .from('users')
          .select('*, user_courses(user_id, course_id, status)')
          .eq('id', session.user.id)
          .single()
          .then(({ data: userData, error }: { data: any, error: any }) => {
            if (!error && userData) {
              const formattedUser = {
                id: userData.id,
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                bio: userData.bio || '',
                location: userData.location || '',
                occupation: userData.occupation || '',
                education: userData.education || '',
                avatar: userData.avatar_url,
                referral_code: userData.referral_code,
                referred_by: userData.referred_by,
                coins: userData.coins || 0,
                enrolledCourses: userData.user_courses
                  ? userData.user_courses.filter((e: any) => e.status === 'enrolled').map((e: any) => e.course_id)
                  : [],
                completedCourses: userData.user_courses
                  ? userData.user_courses.filter((e: any) => e.status === 'completed').map((e: any) => e.course_id)
                  : [],
                createdAt: userData.created_at,
                // Add verification fields
                verification_status: userData.verification_status,
                verification_id_url: userData.verification_id_url,
                verification_rejection_reason: userData.verification_rejection_reason,
              };
              dispatch({ type: 'LOGIN', payload: formattedUser });
            }
          });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (isSupabaseConnected) {
        // Try to sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          dispatch({ type: 'SET_LOADING', payload: false });
          throw error;
        }
        if (data.user) {
          // Get user data from Supabase, including enrollments
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*, user_courses(user_id, course_id, status)')
            .eq('id', data.user.id)
            .single();
          if (userError) {
            dispatch({ type: 'SET_LOADING', payload: false });
            throw userError;
          }
          if (userData) {
            // Log device and location
            try {
              const deviceType = getDeviceType();
              const location = await getUserLocation();
              const logPayload = {
                user_id: userData.id,
                device_type: deviceType,
                city: location.city,
                country: location.country_name,
                country_code: location.country_code, // Add country_code
                ip_address: location.ip
              };
              console.log('Attempting to log device/location:', logPayload);
              const { error: logError } = await supabase.from('device_logs').insert([logPayload]);
              if (logError) {
                console.warn('Device/location logging failed:', logError);
              } else {
                console.log('Device/location logging succeeded');
              }
            } catch (logErr) {
              console.warn('Device/location logging threw error:', logErr);
            }
            // Debug: log raw userData from Supabase
            console.log('Raw userData from Supabase:', userData);
            // Format user data to match our app's structure
            const formattedUser = {
              id: userData.id,
              firstName: userData.first_name,
              lastName: userData.last_name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              bio: userData.bio || '',
              location: userData.location || '',
              occupation: userData.occupation || '',
              education: userData.education || '',
              avatar: userData.avatar_url,
              referral_code: userData.referral_code,
              referred_by: userData.referred_by,
              coins: userData.coins || 0,
              enrolledCourses: userData.user_courses
                ? userData.user_courses.filter((e: any) => e.status === 'enrolled').map((e: any) => e.course_id)
                : [],
              completedCourses: userData.user_courses
                ? userData.user_courses.filter((e: any) => e.status === 'completed').map((e: any) => e.course_id)
                : [],
              createdAt: userData.created_at,
            };
            // Debug: log mapped formattedUser
            console.log('Mapped formattedUser for context:', formattedUser);
            
            dispatch({ type: 'LOGIN', payload: formattedUser });
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }
        }
      }
      // Fallback to localStorage if Supabase auth fails
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Ensure user has completedCourses array and profile fields
        const updatedUser = {
          ...user,
          completedCourses: user.completedCourses || [],
          bio: user.bio || '',
          location: user.location || '',
          occupation: user.occupation || '',
          education: user.education || '',
          avatar: user.avatar || null,
          coins: user.coins || 0,
          created_at: user.created_at || new Date().toISOString(),
        };
        dispatch({ type: 'LOGIN', payload: updatedUser });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'enrolledCourses' | 'completedCourses'> & { password: string; referralCode?: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (isSupabaseConnected) {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              role: userData.role,
            }
          }
        });

        if (authError) {
          let msg = 'Registration failed. Please try again.';
          if (
            authError.message?.toLowerCase().includes('already registered') ||
            authError.message?.toLowerCase().includes('duplicate') ||
            authError.message?.toLowerCase().includes('23505')
          ) {
            msg = 'This email is already registered. Please log in or use a different email.';
          }
          alert(msg);
          throw authError;
        }
        if (!authData.user) throw new Error('Auth signup failed, no user returned');

        // 2. Insert user profile into users table
        const userPayload = {
          id: authData.user.id,
          email: userData.email,
          role: userData.role,
          first_name: userData.first_name,
          last_name: userData.last_name,
          points: 0,
          coins: 0,
          current_streak: 0,
          longest_streak: 0,
          referred_by: userData.referralCode || null,
          verification_status: 'unverified',
          phone: userData.phone || '',
          bio: userData.bio || '',
          location: userData.location || '',
          occupation: userData.occupation || '',
          education: userData.education || '',
          avatar_url: null,
          payout_email: userData.role === 'instructor' ? userData.payoutEmail || '' : '',
          expertise: userData.role === 'instructor' ? userData.expertise || '' : '',
          is_approved: userData.role === 'instructor' ? false : null,
          created_at: new Date().toISOString(),
        };
        console.log('User insert payload:', userPayload);
        const { error: userError } = await supabase
          .from('users')
          .insert(userPayload);
        if (userError) {
          console.error('User profile insert error:', userError);
          alert(JSON.stringify(userError, null, 2));
          throw userError;
        }

        // --- Custom Confirmation Email Trigger ---
        try {
          const learnerName = userData.first_name || 'Learner';
          const { data: templateData } = await supabase
            .from('email_templates')
            .select('subject_template, html_template')
            .eq('name', 'confirmation')
            .single();
          if (templateData) {
            const subject = fillTemplate(templateData.subject_template, { name: learnerName });
            // html will have {{confirmation_link}} placeholder
            const html = fillTemplate(templateData.html_template, { name: learnerName });
            await fetch('https://rpexcrwcgdmlfxihdmny.functions.supabase.co/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: userData.email,
                subject,
                html,
                type: 'confirmation',
                user_id: authData.user.id
              })
            });
          }
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr);
        }
        // --- End Custom Confirmation Email Trigger ---

        // --- Welcome Email Trigger ---
        try {
          const learnerName = userData.first_name || 'Learner';
          const { data: templateData } = await supabase
            .from('email_templates')
            .select('subject_template, html_template')
            .eq('name', 'welcome')
            .single();
          if (templateData) {
            const subject = fillTemplate(templateData.subject_template, { name: learnerName });
            const html = fillTemplate(templateData.html_template, { name: learnerName });
            await sendEmail({
              to: userData.email,
              subject,
              html
            });
          }
        } catch (emailErr) {
          console.error('Failed to send welcome email:', emailErr);
        }
        // --- End Welcome Email Trigger ---

        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      // Fallback to localStorage if Supabase fails
      const allUsers = await getAllUsers();
      const existingUser = allUsers.find((u: any) => u.email === userData.email);
      if (existingUser) {
        dispatch({ type: 'SET_LOADING', payload: false });
        throw new Error('User already exists');
      }
      const newUser: User & { password: string } = {
        ...userData,
        id: Date.now().toString(),
        enrolledCourses: [],
        completedCourses: [],
        bio: userData.bio || '',
        coins: userData.coins || 0,
        created_at: new Date().toISOString(),
      };
      const updatedUsers = [...allUsers, newUser];
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    } catch (error) {
      console.error('Full registration error:', error); // Log the full error object for debugging
      let msg = 'Registration failed. Please try again.';
      if (
        (error as any)?.code === '23505' ||
        (error as any)?.message?.toLowerCase().includes('duplicate key value') ||
        (error as any)?.message?.toLowerCase().includes('already registered') ||
        (error as any)?.message?.toLowerCase().includes('duplicate')
      ) {
        msg = 'This email is already registered. Please log in or use a different email.';
      }
      alert(msg);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(msg);
    }
  };

  const addUserToAuth = async (userData: any) => {
    try {
      if (isSupabaseConnected) {
        // Create auth user in Supabase
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password || 'password',
          email_confirm: true,
          user_metadata: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role
          }
        });
        
        if (authError) throw authError;
        
        if (authData.user) {
          // Create user profile in the users table
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              first_name: userData.firstName,
              last_name: userData.lastName,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              bio: userData.bio || null,
              location: userData.location || null,
              occupation: userData.occupation || null,
              education: userData.education || null,
              avatar_url: null,
              created_at: new Date().toISOString()
            });
          
          if (userError) throw userError;
          
          return;
        }
      }
      
      // Fallback to localStorage if Supabase fails
      const allUsers = await getAllUsers();
      
      // Check if user already exists
      const existingUser = allUsers.find((u: any) => u.email === userData.email);
      if (existingUser) {
        return; // User already exists
      }
      
      // Add password to user data and ensure empty arrays for new users
      const userWithPassword = {
        ...userData,
        password: userData.password || 'password', // Use provided password or default
        enrolledCourses: userData.enrolledCourses || [], // Start with empty array if not provided
        completedCourses: userData.completedCourses || [], // Start with empty array if not provided
        bio: userData.bio || '',
        location: userData.location || '',
        occupation: userData.occupation || '',
        education: userData.education || '',
        avatar: userData.avatar || null,
      };
      
      // Add to all users
      const updatedUsers = [...allUsers, userWithPassword];
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const updateUserEnrollment = async (enrolledCourses: string[]) => {
    if (!state.user) return;

    try {
      if (isSupabaseConnected) {
        // First, get existing enrollments
        const { data: existingEnrollments, error: fetchError } = await supabase
          .from('user_courses')
          .select('course_id, status')
          .eq('user_id', state.user.id);
        
        if (fetchError) throw fetchError;
        
        // Find courses to add (new enrollments)
        const existingCourseIds = existingEnrollments?.map(e => e.course_id) || [];
        const coursesToAdd = enrolledCourses.filter(id => !existingCourseIds.includes(id));
        
        // Add new enrollments
        if (coursesToAdd.length > 0) {
          const enrollmentsToInsert = coursesToAdd.map(courseId => ({
            id: crypto.randomUUID(),
            user_id: state.user.id,
            course_id: courseId,
            status: 'enrolled',
            progress: 0,
            created_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('user_courses')
            .insert(enrollmentsToInsert);
          
          if (insertError) throw insertError;
          
          // Update course enrollment count
          for (const courseId of coursesToAdd) {
            const { error: updateError } = await supabase.rpc('increment_enrollment_count', {
              course_id: courseId
            });
            if (updateError) console.error('Error updating enrollment count:', updateError);
          }

          // Fetch course details and send enrollment email using DB template
          try {
            for (const courseId of coursesToAdd) {
              // Fetch course title
              const { data: courseData } = await supabase
                .from('courses')
                .select('title')
                .eq('id', courseId)
                .single();
              const courseTitle = courseData?.title || 'a course';
              const learnerName = state.user.first_name || 'Learner';

              // Fetch email template from DB
              const { data: templateData } = await supabase
                .from('email_templates')
                .select('subject_template, html_template')
                .eq('name', 'course_enroll')
                .single();

              if (!templateData) {
                console.error('No email template found for course_enroll');
                continue;
              }

              // Fill in the template
              const subject = fillTemplate(templateData.subject_template, {
                course: courseTitle,
                name: learnerName
              });
              const html = fillTemplate(templateData.html_template, {
                course: courseTitle,
                name: learnerName
              });

              // Send the email
              await sendEmail({
                to: state.user.email,
                subject,
                html
              });
            }
          } catch (emailErr) {
            console.error('Failed to send enrollment email:', emailErr);
          }
        }
        
        // Update user in context
        dispatch({ type: 'UPDATE_ENROLLMENT', payload: enrolledCourses });
        return;
      }
      
      // Fallback to localStorage if Supabase fails
      // Update user in localStorage
      const allUsers = await getAllUsers();
      const updatedUsers = allUsers.map((u: any) => 
        u.id === state.user?.id ? { ...u, enrolledCourses } : u
      );
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      // Update current user in localStorage
      const updatedUser = { ...state.user, enrolledCourses };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update context state
      dispatch({ type: 'UPDATE_ENROLLMENT', payload: enrolledCourses });
    } catch (error) {
      console.error('Error updating enrollment:', error);
    }
  };

  const completeCourse = async (courseId: string) => {
    if (!state.user) return;

    try {
      if (isSupabaseConnected) {
        // Update user_courses status to 'completed'
        const { error: updateError } = await supabase
          .from('user_courses')
          .update({ status: 'completed' })
          .eq('user_id', state.user.id)
          .eq('course_id', courseId);
        
        if (updateError) throw updateError;
        
        // Create certificate
        const certificateId = `cert-${Date.now()}`;
        const { error: certError } = await supabase
          .from('certificates')
          .insert({
            id: certificateId,
            user_id: state.user.id,
            course_id: courseId,
            issue_date: new Date().toISOString(),
            template: 'default',
            url: `https://example.com/certificates/${certificateId}.pdf`
          });
        
        if (certError) throw certError;
        
        // Check if this is the user's first completed course and trigger referral reward
        const { data: completedCourses, error: completedError } = await supabase
          .from('user_courses')
          .select('course_id')
          .eq('user_id', state.user.id)
          .eq('status', 'completed');
        
        if (!completedError && completedCourses && completedCourses.length === 1) {
          // This is the first completed course, trigger referral reward
          try {
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/handle-referral-reward`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                referredUserId: state.user.id,
                courseId: courseId
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Referral reward result:', result);
            }
          } catch (referralError) {
            console.error('Error triggering referral reward:', referralError);
          }
        }
        
        // Get updated enrollments
        const { data: enrollments, error: fetchError } = await supabase
          .from('user_courses')
          .select('course_id, status')
          .eq('user_id', state.user.id);
        
        if (fetchError) throw fetchError;
        
        // Update user in context
        const updatedUser = { 
          ...state.user, 
          enrolledCourses: enrollments
            ? enrollments.filter((e: any) => e.status === 'enrolled').map((e: any) => e.course_id)
            : state.user.enrolledCourses.filter(id => id !== courseId),
          completedCourses: [
            ...(state.user.completedCourses || []),
            courseId
          ]
        };
        
        dispatch({ type: 'SET_USER', payload: updatedUser });
        return;
      }
      
      // Fallback to localStorage if Supabase fails
      // Update user in localStorage
      const allUsers = await getAllUsers();
      const updatedUsers = allUsers.map((u: any) => 
        state.user && u.id === state.user.id ? { 
          ...u, 
          completedCourses: [...(u.completedCourses || []), courseId],
          enrolledCourses: u.enrolledCourses.filter((id: string) => id !== courseId)
        } : u
      );
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      // Update current user in localStorage
      const updatedUser = { 
        ...state.user, 
        completedCourses: [...(state.user.completedCourses || []), courseId],
        enrolledCourses: state.user.enrolledCourses.filter(id => id !== courseId)
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update context state
      dispatch({ type: 'COMPLETE_COURSE', payload: courseId });
    } catch (error) {
      console.error('Error completing course:', error);
    }
  };

  const updateUserProfile = async (profileData: any) => {
    if (!state.user) return;

    try {
      if (isSupabaseConnected) {
        // Update user profile in Supabase
        const { error } = await supabase
          .from('users')
          .update({
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            bio: profileData.bio,
            location: profileData.location,
            occupation: profileData.occupation,
            education: profileData.education,
            avatar_url: profileData.avatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', state.user.id);
        
        if (error) throw error;
        
        // Update user in context
        dispatch({ type: 'UPDATE_PROFILE', payload: profileData });
        return;
      }
      
      // Fallback to localStorage if Supabase fails
      // Update user in localStorage
      const allUsers = await getAllUsers();
      const updatedUsers = allUsers.map((u: any) => 
        u.id === state.user?.id ? { ...u, ...profileData } : u
      );
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers));

      // Update current user in localStorage
      const updatedUser = { ...state.user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update context state
      dispatch({ type: 'UPDATE_PROFILE', payload: profileData });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConnected) {
        await supabase.auth.signOut();
      }
      
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Add password reset function
  const resetPassword = async (email: string) => {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (isSupabaseConnected) {
      // Use Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return;
    }
    // Fallback: simulate local reset (no email sent)
    const allUsers = await getAllUsers();
    const user = allUsers.find((u: any) => u.email === email);
    if (!user) throw new Error('No account found with that email.');
    // In a real app, you would send an email. Here, just resolve.
    return;
  };

  const refreshUserEnrollments = async (userId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', userId);
    if (!error && data) {
      const enrolledCourses = data.map((e: any) => e.course_id);
      dispatch({ type: 'UPDATE_ENROLLMENT', payload: enrolledCourses });
    }
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      addUserToAuth,
      updateUserEnrollment,
      completeCourse,
      updateUserProfile,
      isSupabaseConnected,
      resetPassword,
      refreshUserEnrollments,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}