export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          role: 'learner' | 'admin' | 'instructor'
          bio: string | null
          location: string | null
          occupation: string | null
          education: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string | null
          payout_email: string | null
          expertise: string | null
          is_approved: boolean | null
        }
        Insert: {
          id: string
          name: string
          email: string
          phone: string
          role: 'learner' | 'admin' | 'instructor'
          bio?: string | null
          location?: string | null
          occupation?: string | null
          education?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          payout_email?: string | null
          expertise?: string | null
          is_approved?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          role?: 'learner' | 'admin' | 'instructor'
          bio?: string | null
          location?: string | null
          occupation?: string | null
          education?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string | null
          payout_email?: string | null
          expertise?: string | null
          is_approved?: boolean | null
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          instructor: string
          category: string
          format: 'text' | 'video' | 'mixed'
          duration: number
          thumbnail: string
          price: number
          is_published: boolean
          enrolled_count: number
          certificate_template: 'default' | 'modern' | 'elegant' | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          description: string
          instructor: string
          category: string
          format: 'text' | 'video' | 'mixed'
          duration: number
          thumbnail: string
          price: number
          is_published?: boolean
          enrolled_count?: number
          certificate_template?: 'default' | 'modern' | 'elegant' | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          instructor?: string
          category?: string
          format?: 'text' | 'video' | 'mixed'
          duration?: number
          thumbnail?: string
          price?: number
          is_published?: boolean
          enrolled_count?: number
          certificate_template?: 'default' | 'modern' | 'elegant' | null
          created_at?: string
          updated_at?: string | null
        }
      }
      lessons: {
        Row: {
          id: string
          course_id: string
          module_id: string | null
          title: string
          content: string
          video_url: string | null
          duration: number | null
          order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          course_id: string
          module_id?: string | null
          title: string
          content: string
          video_url?: string | null
          duration?: number | null
          order: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          module_id?: string | null
          title?: string
          content?: string
          video_url?: string | null
          duration?: number | null
          order?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string
          order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          course_id: string
          title: string
          description: string
          order: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string
          order?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          color: string
          course_count: number
          student_count: number
          instructor_count: number
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          color: string
          course_count?: number
          student_count?: number
          instructor_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          color?: string
          course_count?: number
          student_count?: number
          instructor_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      user_courses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: 'enrolled' | 'completed'
          progress: number
          last_accessed: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          course_id: string
          status?: 'enrolled' | 'completed'
          progress?: number
          last_accessed?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: 'enrolled' | 'completed'
          progress?: number
          last_accessed?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          instructions: string
          due_date: string
          max_points: number
          allowed_file_types: string[]
          max_file_size: number
          module_id: string | null
          course_id: string
          is_required: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          description: string
          instructions: string
          due_date: string
          max_points: number
          allowed_file_types: string[]
          max_file_size: number
          module_id?: string | null
          course_id: string
          is_required?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          instructions?: string
          due_date?: string
          max_points?: number
          allowed_file_types?: string[]
          max_file_size?: number
          module_id?: string | null
          course_id?: string
          is_required?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          user_id: string
          course_id: string
          submitted_at: string
          text_submission: string | null
          status: 'submitted' | 'graded' | 'late' | 'missing'
          grade: number | null
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          assignment_id: string
          user_id: string
          course_id: string
          submitted_at: string
          text_submission?: string | null
          status?: 'submitted' | 'graded' | 'late' | 'missing'
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          user_id?: string
          course_id?: string
          submitted_at?: string
          text_submission?: string | null
          status?: 'submitted' | 'graded' | 'late' | 'missing'
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      submission_files: {
        Row: {
          id: string
          submission_id: string
          name: string
          type: string
          size: number
          url: string
          uploaded_at: string
          created_at: string
        }
        Insert: {
          id: string
          submission_id: string
          name: string
          type: string
          size: number
          url: string
          uploaded_at: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          name?: string
          type?: string
          size?: number
          url?: string
          uploaded_at?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'announcement'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          sender_id: string
          course_id: string | null
          scheduled_for: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'announcement'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          sender_id: string
          course_id?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'announcement'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          sender_id?: string
          course_id?: string | null
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      notification_recipients: {
        Row: {
          id: string
          notification_id: string
          user_id: string
          is_read: boolean
          read_at: string | null
          is_starred: boolean
          starred_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          notification_id: string
          user_id: string
          is_read?: boolean
          read_at?: string | null
          is_starred?: boolean
          starred_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          user_id?: string
          is_read?: boolean
          read_at?: string | null
          is_starred?: boolean
          starred_at?: string | null
          created_at?: string
        }
      }
      notification_attachments: {
        Row: {
          id: string
          notification_id: string
          name: string
          type: string
          size: number
          url: string
          created_at: string
        }
        Insert: {
          id: string
          notification_id: string
          name: string
          type: string
          size: number
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          name?: string
          type?: string
          size?: number
          url?: string
          created_at?: string
        }
      }
      notification_replies: {
        Row: {
          id: string
          notification_id: string
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          id: string
          notification_id: string
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          user_id?: string
          message?: string
          created_at?: string
        }
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          issue_date: string
          template: 'default' | 'modern' | 'elegant'
          url: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          course_id: string
          issue_date: string
          template: 'default' | 'modern' | 'elegant'
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          issue_date?: string
          template?: 'default' | 'modern' | 'elegant'
          url?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          amount: number
          status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          course_id: string
          amount: number
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string | null
        }
      }
      lesson_notes: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lesson_discussions: {
        Row: {
          id: string;
          lesson_id: string;
          user_id: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          user_id: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          user_id?: string;
          content?: string;
          parent_id?: string | null;
          created_at?: string;
        };
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}